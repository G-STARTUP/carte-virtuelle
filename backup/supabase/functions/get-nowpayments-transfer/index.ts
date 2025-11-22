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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { transfer_id } = await req.json();

    console.log('Fetching NOWPayments transfer status:', { transfer_id, user_id: user.id });

    const nowpaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!nowpaymentsApiKey) {
      throw new Error('NOWPAYMENTS_API_KEY not configured');
    }

    // Call NOWPayments API to get transfer status
    const nowpaymentsResponse = await fetch(
      `https://api.nowpayments.io/v1/sub-partner/transfer/${transfer_id}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': nowpaymentsApiKey,
        },
      }
    );

    if (!nowpaymentsResponse.ok) {
      const errorText = await nowpaymentsResponse.text();
      console.error('NOWPayments API error:', nowpaymentsResponse.status, errorText);
      throw new Error(`NOWPayments API error: ${nowpaymentsResponse.status}`);
    }

    const transferData = await nowpaymentsResponse.json();
    console.log('NOWPayments transfer status:', transferData);

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('nowpayments_transactions')
      .update({
        status: transferData.result.status,
        raw_response: transferData,
        updated_at: new Date().toISOString(),
      })
      .eq('transfer_id', transfer_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
    }

    // If status is FINISHED, update wallet balance
    if (transferData.result.status === 'FINISHED') {
      const { data: transaction } = await supabase
        .from('nowpayments_transactions')
        .select('wallet_id, amount')
        .eq('transfer_id', transfer_id)
        .eq('user_id', user.id)
        .single();

      if (transaction) {
        // Update wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', transaction.wallet_id)
          .single();

        if (wallet) {
          const newBalance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
          
          await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', transaction.wallet_id);

          // Create wallet transaction record
          await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: transaction.wallet_id,
              amount: transaction.amount,
              type: 'deposit',
              description: `Dépôt USDT via NOWPayments`,
              reference: transfer_id,
            });

          console.log('Wallet balance updated:', { wallet_id: transaction.wallet_id, new_balance: newBalance });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer: transferData.result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-nowpayments-transfer:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
