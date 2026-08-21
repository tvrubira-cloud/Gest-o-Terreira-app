import Stripe from 'https://esm.sh/stripe@14?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Price IDs por plano e período
const PRICE_IDS: Record<string, Record<string, string>> = {
  ile:  { month: 'price_1U6hpWRgmFiYs7THhXwCCcm1', year: 'price_1U6htjRgmFiYs7THekJDgMWi' },
  axe:  { month: 'price_1U6hwZRgmFiYs7THxOdmSNRB', year: 'price_1U6hzVRgmFiYs7THqBBxDKsn' },
  orun: { month: 'price_1U6i21RgmFiYs7THHqdJdtjJ', year: 'price_1U6i4WRgmFiYs7THWtT1jIUL' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada');

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

    const { plan, billing, terreiroId, email, userId, successUrl, cancelUrl } = await req.json();

    if (!plan || !billing || !terreiroId || !email) {
      throw new Error('Parâmetros obrigatórios ausentes: plan, billing, terreiroId, email');
    }

    const priceId = PRICE_IDS[plan]?.[billing];
    if (!priceId) throw new Error(`Plano inválido: ${plan}/${billing}`);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/planos?payment=cancelled`,
      metadata: {
        terreiroId,
        userId: userId || '',
        plan,
        billing,
      },
      subscription_data: {
        metadata: {
          terreiroId,
          userId: userId || '',
          plan,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('create-checkout error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
