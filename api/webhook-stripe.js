// =============================================================
//  /api/webhook-stripe.js
//  Vercel Serverless Function — Webhook AgenteX/Stripe
//
//  Fluxo:
//   1. AgenteX envia POST após confirmação de pagamento Stripe
//   2. Buscamos o usuário pelo email no Supabase
//   3. Buscamos o terreiro vinculado ao usuário (campo created_by)
//   4. Ativamos o plano Pro no terreiro (campo `plan` = 'pro')
//
//  Variáveis de ambiente necessárias (Vercel → Settings → Env):
//   SUPABASE_URL         — URL do Supabase (sem o VITE_ prefix)
//   SUPABASE_SERVICE_KEY — Service Role Key (chave secreta do Supabase)
//   WEBHOOK_SECRET       — (opcional) segredo compartilhado com AgenteX
// =============================================================

// ── Helper: requisição autenticada ao Supabase REST API ───────

async function supabaseRequest(path, options = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

// ── Handler principal ──────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ── 1. Ler o body como texto bruto ────────────────────────────
  let body = "";
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", resolve);
    req.on("error", reject);
  });

  // ── 2. (Opcional) Validar segredo compartilhado ───────────────
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const headerSecret =
      req.headers["x-webhook-secret"] || req.headers["x-agenteX-secret"] || "";
    if (headerSecret !== secret) {
      console.warn("[webhook-stripe] Segredo inválido — requisição rejeitada.");
      return res.status(401).json({ error: "Não autorizado" });
    }
  }

  // ── 3. Parsear payload ────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: "Body inválido" });
  }

  console.log("[webhook-stripe] Evento recebido:", JSON.stringify(payload));

  const { senderEmail, plan, notificationType, terreiro_id, plan_expires_at } = payload;

  // Aceita tanto o formato AgenteX quanto legado PagSeguro
  const isPago =
    notificationType === "preApproval" ||
    notificationType === "checkout.session.completed" ||
    plan === "mensal" ||
    plan === "pro";

  if (!isPago || !senderEmail) {
    console.log("[webhook-stripe] Evento ignorado — não é pagamento ou sem email.");
    return res.status(200).json({ received: true, processed: false, reason: "not_paid_or_no_email" });
  }

  try {
    // ── 4. Buscar usuário pelo email ──────────────────────────────
    const { data: users } = await supabaseRequest(
      `/users?email=eq.${encodeURIComponent(senderEmail)}&limit=1`
    );

    if (!users || users.length === 0) {
      console.warn(`[webhook-stripe] Usuário não encontrado: ${senderEmail}`);
      return res
        .status(200)
        .json({ received: true, processed: false, reason: "user_not_found" });
    }

    const user = users[0];
    const userId = user.id;
    console.log(`[webhook-stripe] Usuário encontrado: ${userId}`);

    // ── 5. Determinar o terreiro a ativar ─────────────────────────
    // Prioridade: terreiro_id vindo no payload → fallback: buscar pelo created_by
    let terreiroId = terreiro_id || null;

    if (!terreiroId) {
      const { data: terreiros } = await supabaseRequest(
        `/terreiros?admin_id=eq.${encodeURIComponent(userId)}&limit=1`
      );

      if (!terreiros || terreiros.length === 0) {
        console.warn(
          `[webhook-stripe] Terreiro não encontrado para userId: ${userId}`
        );
        return res
          .status(200)
          .json({ received: true, processed: false, reason: "terreiro_not_found" });
      }

      terreiroId = terreiros[0].id;
    }

    console.log(`[webhook-stripe] Terreiro alvo: ${terreiroId}`);

    // ── 6. Calcular data de expiração (30 dias se não informada) ──
    const expiracao =
      plan_expires_at ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── 7. Ativar plano Pro no terreiro ───────────────────────────
    const { status: updateStatus } = await supabaseRequest(
      `/terreiros?id=eq.${encodeURIComponent(terreiroId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          plan: "pro",
          plan_expires_at: expiracao,
          plan_updated_at: new Date().toISOString(),
        }),
      }
    );

    if (updateStatus === 200 || updateStatus === 204) {
      console.log(
        `[webhook-stripe] ✅ Plano Pro ativado — terreiro: ${terreiroId} | expira: ${expiracao}`
      );
      return res.status(200).json({ received: true, processed: true, terreiroId, expiracao });
    } else {
      console.error(
        `[webhook-stripe] Falha ao atualizar terreiro ${terreiroId}. Status: ${updateStatus}`
      );
      return res
        .status(500)
        .json({ received: true, processed: false, reason: "update_failed" });
    }
  } catch (err) {
    console.error("[webhook-stripe] Erro interno:", err);
    return res.status(500).json({ error: String(err) });
  }
}

// ── Necessário para leitura do raw body no Vercel ─────────────
export const config = { api: { bodyParser: false } };
