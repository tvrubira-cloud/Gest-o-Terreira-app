// =============================================================
//  /api/webhook-stripe.js
//  Vercel Serverless Function — Webhook Stripe
//
//  Fluxo:
//   1. Stripe envia evento (checkout.session.completed)
//   2. Validamos a assinatura com stripe.webhooks.constructEvent
//   3. Extraímos plan, terreiro_id dos metadados
//   4. Atualizamos o plano no Supabase
//
//  Variáveis de ambiente (Vercel → Settings → Env):
//   STRIPE_SECRET_KEY      — Chave secreta do Stripe (sk_test_xxx)
//   STRIPE_WEBHOOK_SECRET  — Webhook signing secret (whsec_xxx)
//   SUPABASE_URL            — URL do Supabase
//   SUPABASE_SERVICE_KEY    — Service Role Key do Supabase
// =============================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let rawBody = "";
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => (rawBody += chunk.toString()));
    req.on("end", resolve);
    req.on("error", reject);
  });

  const signature = req.headers["stripe-signature"];

  // ── Tentativa 1: Webhook nativo do Stripe (com assinatura) ──
  if (signature && STRIPE_WEBHOOK_SECRET && STRIPE_SECRET_KEY) {
    try {
      const stripe = (await import('stripe')).default;
      const stripeClient = stripe(STRIPE_SECRET_KEY);
      const event = stripeClient.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

      console.log(`[webhook-stripe] Evento Stripe recebido: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const { plan, terreiro_id, billing } = metadata;

        if (!plan || !terreiro_id) {
          console.warn("[webhook-stripe] Sessão sem metadados de plano/terreiro");
          return res.status(200).json({ received: true, processed: false, reason: "missing_metadata" });
        }

        if (!['ile', 'axe', 'orun'].includes(plan)) {
          console.warn(`[webhook-stripe] Plano inválido nos metadados: ${plan}`);
          return res.status(200).json({ received: true, processed: false, reason: "invalid_plan" });
        }

        const dias = billing === 'year' ? 365 : 30;
        const expiracao = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

        const { status: updateStatus } = await supabaseRequest(
          `/terreiros?id=eq.${encodeURIComponent(terreiro_id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              plan,
              plan_status: "active",
              plan_expires_at: expiracao,
              plan_updated_at: new Date().toISOString(),
            }),
          }
        );

        if (updateStatus === 200 || updateStatus === 204) {
          console.log(`[webhook-stripe] Plano ${plan} ativado — terreiro: ${terreiro_id}`);
          return res.status(200).json({ received: true, processed: true, plan, terreiro_id, expiracao });
        } else {
          console.error(`[webhook-stripe] Falha ao atualizar terreiro ${terreiro_id}. Status: ${updateStatus}`);
          return res.status(500).json({ received: true, processed: false, reason: "update_failed" });
        }
      }

      return res.status(200).json({ received: true, processed: false, type: event.type });
    } catch (err) {
      console.error("[webhook-stripe] Erro na validação Stripe:", err);
      return res.status(400).json({ error: "Assinatura inválida" });
    }
  }

  // ── Tentativa 2: Formato legado (AgenteX / compatibilidade) ──
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers["x-webhook-secret"] || req.headers["x-agenteX-secret"] || "";
    if (headerSecret !== secret) {
      return res.status(401).json({ error: "Não autorizado" });
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Body inválido" });
  }

  const { senderEmail, plan, notificationType, terreiro_id, plan_expires_at } = payload;
  const isPago = notificationType === "preApproval" || notificationType === "checkout.session.completed" || plan === "mensal" || plan === "pro";

  if (!isPago || !senderEmail) {
    return res.status(200).json({ received: true, processed: false, reason: "not_paid_or_no_email" });
  }

  try {
    const { data: users } = await supabaseRequest(`/users?email=eq.${encodeURIComponent(senderEmail)}&limit=1`);
    if (!users || users.length === 0) {
      return res.status(200).json({ received: true, processed: false, reason: "user_not_found" });
    }

    let tId = terreiro_id || null;
    if (!tId) {
      const { data: terreiros } = await supabaseRequest(`/terreiros?admin_id=eq.${encodeURIComponent(users[0].id)}&limit=1`);
      if (!terreiros || terreiros.length === 0) {
        return res.status(200).json({ received: true, processed: false, reason: "terreiro_not_found" });
      }
      tId = terreiros[0].id;
    }

    const expiracao = plan_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { status: updateStatus } = await supabaseRequest(`/terreiros?id=eq.${encodeURIComponent(tId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        plan: plan || "pro",
        plan_status: "active",
        plan_expires_at: expiracao,
        plan_updated_at: new Date().toISOString(),
      }),
    });

    if (updateStatus === 200 || updateStatus === 204) {
      return res.status(200).json({ received: true, processed: true, terreiroId: tId, expiracao });
    } else {
      return res.status(500).json({ received: true, processed: false, reason: "update_failed" });
    }
  } catch (err) {
    console.error("[webhook-stripe] Erro interno:", err);
    return res.status(500).json({ error: String(err) });
  }
}

export const config = { api: { bodyParser: false } };
