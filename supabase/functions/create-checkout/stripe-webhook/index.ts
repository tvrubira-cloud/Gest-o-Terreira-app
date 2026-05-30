import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Mapeia price_id → plano
const PRICE_TO_PLAN: Record<string, string> = {
  'price_1TcScVHzk9cIblw9iVJRstc1': 'ile',
  'price_1TcSdbHzk9cIblw9Xkj4VaBP': 'ile',
  'price_1TcSeqHzk9cIblw9YM4HgFzd': 'axe',
  'price_1TcSgXHzk9cIblw9DGRhbAIQ': 'axe',
  'price_1TcShRHzk9cIblw9bjWj5XNY': 'orun',
  'price_1TcSiyHzk9cIblw9FkVZuo54': 'orun',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente ausentes');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    if (!sig) throw new Error('Stripe signature ausente');

    // Verifica assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature inválida:', err.message);
      return new Response(JSON.stringify({ error: 'Signature inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Stripe event recebido:', event.type);

    // ── Pagamento concluído ──
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { terreiroId, plan } = session.metadata || {};

      if (!terreiroId || !plan) {
        console.error('metadata ausente:', session.metadata);
        return new Response(JSON.stringify({ error: 'metadata ausente' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Atualiza o plano do terreiro no Supabase
      const { error } = await supabase
        .from('terreiros')
        .update({
          plan,
          plan_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_updated_at: new Date().toISOString(),
        })
        .eq('id', terreiroId);

      if (error) {
        console.error('Erro ao atualizar terreiro:', error);
        throw new Error(`Supabase update error: ${error.message}`);
      }

      console.log(`✅ Plano ${plan} ativado para terreiro ${terreiroId}`);
    }

    // ── Assinatura cancelada ──
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const terreiroId = subscription.metadata?.terreiroId;

      if (terreiroId) {
        await supabase
          .from('terreiros')
          .update({ plan: 'trial', plan_status: 'cancelled' })
          .eq('id', terreiroId);

        console.log(`⚠️ Assinatura cancelada para terreiro ${terreiroId}`);
      }
    }

    // ── Renovação / atualização de plano ──
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const terreiroId = subscription.metadata?.terreiroId;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = PRICE_TO_PLAN[priceId] || null;

      if (terreiroId && plan) {
        await supabase
          .from('terreiros')
          .update({ plan, plan_status: 'active' })
          .eq('id', terreiroId);

        console.log(`🔄 Renovação: plano ${plan} para terreiro ${terreiroId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('stripe-webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
