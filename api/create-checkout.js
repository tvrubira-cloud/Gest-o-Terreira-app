// =============================================================
//  /api/create-checkout.js
//  Vercel Serverless Function — Cria sessão Stripe Checkout
// =============================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const PLAN_PRICE_IDS = {
  ile_month: 'price_1TcScVHzk9cIblw9iVJRstc1',
  ile_year: 'price_1TcSdbHzk9cIblw9Xkj4VaBP',
  axe_month: 'price_1TcSeqHzk9cIblw9YM4HgFzd',
  axe_year: 'price_1TcSgXHzk9cIblw9DGRhbAIQ',
  orun_month: 'price_1TcShRHzk9cIblw9bjWj5XNY',
  orun_year: 'price_1TcSiyHzk9cIblw9FkVZuo54',
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe não configurado (STRIPE_SECRET_KEY ausente)' });
  }

  // O Vercel faz parse automático do JSON quando Content-Type é application/json
  const payload = req.body;

  if (!payload || typeof payload !== 'object') {
    console.error('[create-checkout] Body recebido:', payload);
    return res.status(400).json({ error: 'Body inválido ou não é JSON' });
  }

  const { plan, billing = 'month', terreiroId, email, userId, successUrl, cancelUrl } = payload;

  if (!plan) return res.status(400).json({ error: 'Plano é obrigatório' });

  const priceId = PLAN_PRICE_IDS[`${plan}_${billing}`];
  if (!priceId) return res.status(400).json({ error: `Preço não encontrado para ${plan} ${billing}` });
  if (!terreiroId) return res.status(400).json({ error: 'terreiroId é obrigatório' });

  try {
    const { default: Stripe } = await import('stripe');
    const stripeClient = new Stripe(STRIPE_SECRET_KEY);

    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
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
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('[create-checkout] Erro Stripe:', err);
    return res.status(500).json({ error: String(err) });
  }
}
