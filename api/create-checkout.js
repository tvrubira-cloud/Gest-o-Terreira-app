// =============================================================
//  /api/create-checkout.js
//  Vercel Serverless Function — Cria sessão Stripe Checkout
//
//  Fluxo:
//   1. Frontend envia { plan, billing, terreiroId, email }
//   2. Usa Price ID do Stripe (produto já cadastrado no dashboard)
//   3. Retorna a URL para redirecionar o usuário
//
//  Variáveis de ambiente (Vercel → Settings → Env):
//   STRIPE_SECRET_KEY   — Chave secreta do Stripe (sk_test_xxx / sk_live_xxx)
//   APP_URL             — URL base do app (ex: https://orunapp.com.br)
// =============================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const PLAN_PRICE_IDS = {
  ile_month: 'price_1TcScVHzk9cIblw9iVJRstc1',
  ile_year: 'price_1TcSdbHzk9cIblw9Xkj4VaBP',
  axe_month: 'price_1TcSeqHzk9cIblw9YM4HgFzd',
  axe_year: 'price_1TcSgXHzk9cIblw9DGRhbAIQ',
  orun_month: 'price_1TcShRHzk9cIblw9bjWj5XNY',
  orun_year: 'price_1TcSiyHzk9cIblw9FkVZuo54',
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe não configurado (STRIPE_SECRET_KEY ausente)" });
  }

  let body = "";
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", resolve);
    req.on("error", reject);
  });

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return res.status(400).json({ error: "Body inválido" });
  }

  const { plan, billing = 'month', terreiroId, email, userId, successUrl, cancelUrl } = payload;

  if (!plan) {
    return res.status(400).json({ error: "Plano é obrigatório" });
  }

  const priceId = PLAN_PRICE_IDS[`${plan}_${billing}`];

  if (!priceId) {
    return res.status(400).json({ error: `Preço não encontrado para ${plan} ${billing}` });
  }

  if (!terreiroId) {
    return res.status(400).json({ error: "terreiroId é obrigatório" });
  }

  try {
    const stripe = (await import('stripe')).default;
    const stripeClient = stripe(STRIPE_SECRET_KEY);

    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan,
        billing,
        terreiro_id: terreiroId,
        user_id: userId || '',
        type: 'plan_upgrade',
      },
      customer_email: email || undefined,
      success_url: successUrl || `${APP_URL}/dashboard?payment=success`,
      cancel_url: cancelUrl || `${APP_URL}/planos?payment=cancelled`,
    });

    console.log(`[create-checkout] Sessão: ${session.id} | ${plan} ${billing} | terreiro: ${terreiroId}`);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("[create-checkout] Erro:", err);
    return res.status(500).json({ error: String(err) });
  }
}

export const config = { api: { bodyParser: false } };
