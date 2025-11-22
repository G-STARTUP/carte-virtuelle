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
    const monerooSecretKey = Deno.env.get('MONEROO_SECRET_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { wallet_id, amount, currency, fees, total_amount } = await req.json();

    if (!wallet_id || !amount || !currency) {
      return new Response(
        JSON.stringify({ error: 'wallet_id, amount et currency sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use total_amount (amount + fees) for Moneroo payment
    const paymentAmount = total_amount || amount;

    // Verify wallet belongs to user
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', wallet_id)
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      console.error('Wallet error:', walletError);
      return new Response(
        JSON.stringify({ error: 'Wallet non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profil utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare return URL
    const returnUrl = `${req.headers.get('origin') || 'https://115ed089-2593-4423-9efd-554980b692a4.lovableproject.com'}/wallets?payment=success`;

    // Initialize Moneroo payment
    const monerooPayload = {
      amount: parseFloat(paymentAmount),
      currency: currency,
      description: `Recharge de wallet ${currency} (Montant: ${amount}, Frais: ${fees || 0})`,
      customer: {
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || undefined,
      },
      return_url: returnUrl,
      metadata: {
        wallet_id: wallet_id,
        user_id: user.id,
        base_amount: amount,
        fees: fees || 0,
        total_amount: paymentAmount,
      },
    };

    console.log('Initializing Moneroo payment:', monerooPayload);

    const monerooResponse = await fetch('https://api.moneroo.io/v1/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${monerooSecretKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(monerooPayload),
    });

    const monerooData = await monerooResponse.json();
    
    console.log('Moneroo response:', monerooData);

    if (!monerooResponse.ok) {
      console.error('Moneroo API error:', monerooData);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'initialisation du paiement', details: monerooData }),
        { status: monerooResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save payment to database (store the base amount that will be credited to wallet)
    const { error: insertError } = await supabase
      .from('moneroo_payments')
      .insert({
        user_id: user.id,
        wallet_id: wallet_id,
        payment_id: monerooData.data.id,
        amount: parseFloat(amount), // Store base amount (what gets credited to wallet)
        currency: currency,
        status: 'pending',
        checkout_url: monerooData.data.checkout_url,
        return_url: returnUrl,
        metadata: {
          ...monerooPayload.metadata,
          payment_amount: parseFloat(paymentAmount), // Total amount paid by user
        },
        raw_response: monerooData,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'enregistrement du paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: monerooData.data.id,
        checkout_url: monerooData.data.checkout_url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in initialize-moneroo-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});