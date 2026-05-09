import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Substitua pelas suas chaves reais do Stripe
// const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
// const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    // Validação do Stripe
    // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    // Para simplificar, vamos assumir que o payload já está no formato certo (substitua pela validação real)
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const userId = session.client_reference_id;
      const amountTotal = session.amount_total; // ex: 8700 para R$87, 29700 para R$297

      if (!userId) {
        throw new Error("No client_reference_id found in session");
      }

      let role = 'free';
      let credits = 20;

      // Logica de planos básica (ajuste de acordo com o price_id se preferir)
      if (amountTotal === 8700) {
        role = 'plus';
        credits = 100;
      } else if (amountTotal === 29700) {
        role = 'premium';
        credits = 999999; // ilimitado (ou represente de outra forma no seu BD)
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Atualiza o user profile com o novo plano e reseta os créditos
      const { error } = await supabaseClient
        .from('profiles')
        .update({ 
          role: role, 
          credits: credits 
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      
      console.log(`Plan upgraded for user ${userId} to ${role}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 400 }
    )
  }
})

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
