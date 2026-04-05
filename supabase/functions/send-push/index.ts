// ──────────────────────────────────────────────────────────────
// supabase/functions/send-push/index.ts
// Edge Function — FCM HTTP v1 API com Service Account
//
// Deploy:
//   supabase functions deploy send-push --project-ref xbutdadniizewcwqmvuy
//
// Secrets (PowerShell — rodar uma vez):
//   $sa = Get-Content "caminho\service-account.json" -Raw
//   $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($sa))
//   supabase secrets set FCM_SERVICE_ACCOUNT_B64=$b64
// ──────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL           = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE        = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVICE_ACCOUNT_B64 = Deno.env.get('FCM_SERVICE_ACCOUNT_B64')!;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccount {
  project_id:   string;
  client_email: string;
  private_key:  string;
}

interface PushPayload {
  terreiroId: string;
  title:      string;
  body:       string;
  url?:       string;
}

// ── Cria JWT assinado com RS256 ──────────────────────────────
async function buildJWT(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const header  = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  });

  const signingInput = `${header}.${payload}`;

  // Import private key (PKCS8)
  const pem    = sa.private_key.replace(/-----.*?-----/g, '').replace(/\n/g, '');
  const keyBuf = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sig    = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${sigB64}`;
}

// ── Troca JWT por access_token do Google ────────────────────
async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const jwt = await buildJWT(sa);
  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Envia uma mensagem FCM v1 para um token ──────────────────
async function sendFCMMessage(
  accessToken: string, projectId: string,
  token: string, title: string, body: string, url: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          webpush: {
            notification: { title, body, icon: '/favicon.svg', badge: '/favicon.svg', vibrate: [200, 100, 200] },
            fcm_options: { link: url },
          },
          data: { title, body, url },
        },
      }),
    }
  );
  if (res.ok) return { success: true };
  const err = await res.json();
  return { success: false, error: JSON.stringify(err) };
}

// ── Handler principal ────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { terreiroId, title, body, url = '/' }: PushPayload = await req.json();
    if (!terreiroId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: terreiroId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse service account
    const sa: ServiceAccount = JSON.parse(atob(FCM_SERVICE_ACCOUNT_B64));

    // Busca tokens FCM do terreiro
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);
    const { data: rows, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('terreiro_id', terreiroId);

    if (error) throw error;
    if (!rows?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'Nenhum token encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtém access token (uma vez para todos os envios)
    const accessToken = await getGoogleAccessToken(sa);

    // Envia para cada token
    const results = await Promise.allSettled(
      rows.map((r: { token: string }) =>
        sendFCMMessage(accessToken, sa.project_id, r.token, title, body, url)
      )
    );

    const sent   = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;

    console.log(`[send-push] Enviado: ${sent}/${rows.length}, Falhou: ${failed}`);
    return new Response(
      JSON.stringify({ sent, failed, total: rows.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-push] Erro:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
