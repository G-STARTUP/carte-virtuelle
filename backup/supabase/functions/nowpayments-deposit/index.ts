import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositRequest {
  amount: number;
  wallet_id: string;
  sub_partner_id: string;
}

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

    const { amount, wallet_id, sub_partner_id }: DepositRequest = await req.json();

    console.log('Processing NOWPayments deposit:', { amount, wallet_id, sub_partner_id, user_id: user.id });

    // Verify wallet belongs to user and is USD
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', wallet_id)
      .eq('user_id', user.id)
      .eq('currency', 'USD')
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found or not USD');
    }

    const nowpaymentsApiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!nowpaymentsApiKey) {
      throw new Error('NOWPAYMENTS_API_KEY not configured');
    }

    // Call NOWPayments API to create deposit
    const nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/sub-partner/deposit', {
      method: 'POST',
      headers: {
        'x-api-key': nowpaymentsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'usdttrc20', // USDT TRC20
        amount: amount,
        sub_partner_id: sub_partner_id,
      }),
    });

    if (!nowpaymentsResponse.ok) {
      const errorText = await nowpaymentsResponse.text();
      console.error('NOWPayments API error:', nowpaymentsResponse.status, errorText);
      throw new Error(`NOWPayments API error: ${nowpaymentsResponse.status}`);
    }

    const depositData = await nowpaymentsResponse.json();
    console.log('NOWPayments deposit created:', depositData);

    // Store transaction in database
    const { data: transaction, error: txError } = await supabase
      .from('nowpayments_transactions')
      .insert({
        user_id: user.id,
        wallet_id: wallet_id,
        transfer_id: depositData.result.id,
        sub_partner_id: sub_partner_id,
        amount: amount,
        currency: 'usdttrc20',
        status: depositData.result.status,
        type: 'deposit',
        raw_response: depositData,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error storing transaction:', txError);
      throw new Error('Failed to store transaction');
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction: transaction,
        nowpayments_data: depositData.result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in nowpayments-deposit:', error);
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
