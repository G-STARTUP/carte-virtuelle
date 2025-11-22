import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    
    console.log('Moneroo webhook received:', payload);

    // Extract payment information from webhook
    const { id: payment_id, status, amount, currency } = payload.data || payload;

    if (!payment_id) {
      console.error('No payment_id in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the payment in our database
    const { data: payment, error: paymentError } = await supabase
      .from('moneroo_payments')
      .select('*')
      .eq('payment_id', payment_id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('moneroo_payments')
      .update({
        status: status || 'completed',
        raw_response: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', payment_id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error updating payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment is successful, credit the wallet
    if (status === 'completed' || status === 'success') {
      console.log('Payment successful, crediting wallet');

      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', payment.wallet_id)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found:', walletError);
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance.toString()) + parseFloat(payment.amount.toString());
      
      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.wallet_id);

      if (balanceError) {
        console.error('Error updating wallet balance:', balanceError);
        return new Response(
          JSON.stringify({ error: 'Error updating wallet balance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: payment.wallet_id,
          amount: parseFloat(payment.amount.toString()),
          type: 'deposit',
          description: `Recharge via Moneroo - ${payment.currency}`,
          reference: `MONEROO-${payment_id}`,
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
      }

      console.log('Wallet credited successfully');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in moneroo-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});