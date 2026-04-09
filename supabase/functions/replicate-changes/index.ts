// ──────────────────────────────────────────────────────────────────────────────
// supabase/functions/replicate-changes/index.ts
// Edge Function — CDC (Change Data Capture)
//
// Recebe webhooks do banco de dados do Supabase (INSERT / UPDATE / DELETE)
// e replica as alterações para data warehouses externos e plataformas de
// análise configuradas via variáveis de ambiente.
//
// Deploy:
//   supabase functions deploy replicate-changes --project-ref xbutdadniizewcwqmvuy
//
// Secrets necessários (configurar uma vez):
//   supabase secrets set WEBHOOK_SECRET=<segredo-do-webhook>
//   supabase secrets set REPLICATE_TARGETS='[{"type":"webhook","url":"https://...","secret":"..."}]'
//   supabase secrets set BIGQUERY_DATASET_URL=https://bigquery.googleapis.com/bigquery/v2/projects/PROJECT/datasets/DATASET/tables/TABLE/insertAll
//   supabase secrets set BIGQUERY_ACCESS_TOKEN=<token-oauth2>
//
// Como configurar os webhooks no Supabase:
//   Database → Webhooks → Create a new hook
//   → Table: terreiros / users / events / broadcasts / charges
//   → Events: INSERT, UPDATE, DELETE
//   → URL: https://<project-ref>.supabase.co/functions/v1/replicate-changes
//   → HTTP Headers: { "x-webhook-secret": "<WEBHOOK_SECRET>" }
// ──────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const WEBHOOK_SECRET        = Deno.env.get('WEBHOOK_SECRET')        || '';
const REPLICATE_TARGETS_RAW = Deno.env.get('REPLICATE_TARGETS')     || '[]';
const BIGQUERY_DATASET_URL  = Deno.env.get('BIGQUERY_DATASET_URL')  || '';
const BIGQUERY_ACCESS_TOKEN = Deno.env.get('BIGQUERY_ACCESS_TOKEN') || '';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EventType = 'INSERT' | 'UPDATE' | 'DELETE';

interface WebhookPayload {
  type:       EventType;
  table:      string;
  schema:     string;
  record:     Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

interface ReplicaTarget {
  type:   'webhook' | 'bigquery' | 'log';
  url?:   string;
  secret?: string;
  table_map?: Record<string, string>; // mapeamento terreiro_table -> warehouse_table
}

// ── CORS ──────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

/** Monta o evento padronizado para todos os destinos. */
function buildChangeEvent(payload: WebhookPayload) {
  return {
    source:     'terreiras-app',
    schema:     payload.schema,
    table:      payload.table,
    event:      payload.type,
    occurred_at: now(),
    record:     payload.record,
    old_record: payload.old_record,
  };
}

// ── Destino: Webhook genérico ─────────────────────────────────────────────────

async function sendToWebhook(
  target:  ReplicaTarget,
  event:   ReturnType<typeof buildChangeEvent>
): Promise<void> {
  if (!target.url) return;

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (target.secret) headers['x-webhook-secret'] = target.secret;

  const res = await fetch(target.url, {
    method:  'POST',
    headers,
    body:    JSON.stringify(event),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Webhook ${target.url} retornou ${res.status}: ${body}`);
  }
}

// ── Destino: BigQuery (Streaming Insert) ──────────────────────────────────────

async function sendToBigQuery(
  target: ReplicaTarget,
  event:  ReturnType<typeof buildChangeEvent>
): Promise<void> {
  // Usa a URL específica da tabela se mapeada, senão a URL base
  const tableMap  = target.table_map || {};
  const tableUrl  = tableMap[event.table] || BIGQUERY_DATASET_URL;
  const authToken = BIGQUERY_ACCESS_TOKEN;

  if (!tableUrl || !authToken) {
    console.warn('[replicate-changes] BigQuery não configurado (URL ou token ausente).');
    return;
  }

  const rows = [{
    insertId: `${event.table}-${event.occurred_at}`,
    json: {
      ...event,
      record:     event.record     ? JSON.stringify(event.record)     : null,
      old_record: event.old_record ? JSON.stringify(event.old_record) : null,
    },
  }];

  const res = await fetch(tableUrl, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ rows, skipInvalidRows: false, ignoreUnknownValues: false }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`BigQuery retornou ${res.status}: ${body}`);
  }

  const result = await res.json();
  if (result.insertErrors?.length) {
    throw new Error(`BigQuery insertErrors: ${JSON.stringify(result.insertErrors)}`);
  }
}

// ── Destino: Log estruturado (fallback / auditoria) ────────────────────────────

function logEvent(event: ReturnType<typeof buildChangeEvent>): void {
  console.log(JSON.stringify({
    level:   'info',
    fn:      'replicate-changes',
    message: 'CDC event',
    ...event,
  }));
}

// ── Roteador de destinos ──────────────────────────────────────────────────────

async function dispatchToTargets(
  targets: ReplicaTarget[],
  event:   ReturnType<typeof buildChangeEvent>
): Promise<{ ok: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(
    targets.map((target) => {
      switch (target.type) {
        case 'webhook':  return sendToWebhook(target, event);
        case 'bigquery': return sendToBigQuery(target, event);
        case 'log':      logEvent(event); return Promise.resolve();
        default:         return Promise.resolve();
      }
    })
  );

  const errors: string[] = [];
  let ok = 0;
  let failed = 0;

  for (const r of results) {
    if (r.status === 'fulfilled') {
      ok++;
    } else {
      failed++;
      errors.push(r.reason?.message || String(r.reason));
    }
  }

  return { ok, failed, errors };
}

// ── Handler principal ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verifica segredo do webhook (proteção contra chamadas não autorizadas)
  if (WEBHOOK_SECRET) {
    const incoming = req.headers.get('x-webhook-secret') || '';
    if (incoming !== WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Payload JSON inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Tabelas monitoradas — altere para incluir/excluir tabelas
  const MONITORED_TABLES = new Set([
    'terreiros', 'users', 'events', 'broadcasts', 'charges', 'bank_accounts',
  ]);

  if (!MONITORED_TABLES.has(payload.table)) {
    return new Response(
      JSON.stringify({ skipped: true, table: payload.table }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Monta e despacha o evento
  const event = buildChangeEvent(payload);

  let targets: ReplicaTarget[] = [];
  try {
    targets = JSON.parse(REPLICATE_TARGETS_RAW) as ReplicaTarget[];
  } catch {
    console.warn('[replicate-changes] REPLICATE_TARGETS inválido, usando log como fallback.');
    targets = [{ type: 'log' }];
  }

  // Sempre loga localmente além dos destinos externos
  logEvent(event);

  const { ok, failed, errors } = await dispatchToTargets(targets, event);

  console.log(`[replicate-changes] table=${payload.table} event=${payload.type} ok=${ok} failed=${failed}`);

  return new Response(
    JSON.stringify({ table: payload.table, event: payload.type, ok, failed, errors }),
    {
      status:  failed > 0 && ok === 0 ? 500 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
