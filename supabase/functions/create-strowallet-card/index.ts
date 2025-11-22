import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStartTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestBody = await req.json();
    const { amount, customer_email, name_on_card, currency, card_type } = requestBody;
    
    console.log('='.repeat(80));
    console.log('🚀 CARD CREATION REQUEST STARTED');
    console.log('='.repeat(80));
    console.log('📋 Request Details:');
    console.log('  - User ID:', user.id);
    console.log('  - Timestamp:', new Date().toISOString());
    console.log('  - Amount:', amount, currency || 'USD');
    console.log('  - Customer Email:', customer_email?.replace(/(.{3}).*(@.*)/, '$1***$2'));
    console.log('  - Name on Card:', name_on_card);
    console.log('  - Card Type:', card_type || 'visa');

    console.log('\n📊 STEP 1: Currency Validation');
    const allowedCurrencies = ['USD', 'XOF'];
    const requestCurrency = currency || 'USD';
    console.log('  - Requested Currency:', requestCurrency);
    console.log('  - Allowed Currencies:', allowedCurrencies.join(', '));
    if (!allowedCurrencies.includes(requestCurrency)) {
      console.error('  ❌ Currency validation FAILED');
      throw new Error(`Devise non supportée. Seules les devises USD et FCFA (XOF) sont acceptées.`);
    }
    console.log('  ✅ Currency validation PASSED');

    console.log('\n💰 STEP 2: Loading Fee Settings');
    const { data: feeSettings, error: feeError } = await supabase
      .from('fees_settings')
      .select('setting_key, setting_value');
    
    if (feeError) {
      console.error('  ❌ Error loading fee settings:', feeError);
    } else {
      console.log('  ✅ Fee settings loaded:', feeSettings?.length, 'entries');
    }

    const fees: any = {};
    feeSettings?.forEach((fee: any) => {
      fees[fee.setting_key] = parseFloat(fee.setting_value);
    });
    console.log('  - Parsed Fees:', Object.keys(fees).length, 'settings');

    console.log('\n💵 STEP 3: Amount & Fee Calculation');
    const cardAmount = parseFloat(amount);
    const minAmountKey = `min_card_creation_${requestCurrency.toLowerCase()}`;
    const configuredMinAmount = fees[minAmountKey] || (requestCurrency === 'XOF' ? 5000 : 1);
    console.log('  - Min Amount:', configuredMinAmount, requestCurrency);
    console.log('  - Requested Amount:', cardAmount, requestCurrency);
    
    if (cardAmount < configuredMinAmount) {
      console.error('  ❌ Amount validation FAILED');
      throw new Error(`Le montant minimum pour créer une carte est de ${configuredMinAmount} ${requestCurrency}.`);
    }

    const fixedFeeKey = `card_creation_fixed_fee_${requestCurrency.toLowerCase()}`;
    const percentFeeKey = 'card_creation_percent_fee';
    const fixedFee = fees[fixedFeeKey] || 0;
    const percentFee = (cardAmount * (fees[percentFeeKey] || 0)) / 100;
    const totalFees = fixedFee + percentFee;
    const totalRequired = cardAmount + totalFees;

    console.log('  - Fixed Fee:', fixedFee, requestCurrency);
    console.log('  - Percent Fee:', percentFee, requestCurrency);
    console.log('  - Total Fees:', totalFees, requestCurrency);
    console.log('  - Total Required:', totalRequired, requestCurrency);

    console.log('\n💳 STEP 4: Wallet Balance Check');
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', requestCurrency)
      .single();
    
    if (walletError || !wallet) {
      console.error('  ❌ Wallet not found:', walletError?.message);
      throw new Error(`Portefeuille ${requestCurrency} introuvable`);
    }
    
    console.log('  - Current Balance:', parseFloat(wallet.balance), requestCurrency);
    
    if (parseFloat(wallet.balance) < totalRequired) {
      console.error('  ❌ Insufficient funds');
      throw new Error(`Solde insuffisant. Requis: ${totalRequired.toFixed(2)} ${requestCurrency}, Disponible: ${parseFloat(wallet.balance).toFixed(2)} ${requestCurrency}`);
    }
    console.log('  ✅ Wallet balance sufficient');

    console.log('\n🃏 STEP 5: Card Limit Check');
    const { count: cardCount, error: countError } = await supabase
      .from('strowallet_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('  ❌ Error counting cards:', countError);
      throw new Error('Failed to verify card limit');
    }

    console.log('  - Current Card Count:', cardCount || 0);
    
    if (cardCount && cardCount >= 10) {
      console.error('  ❌ Card limit REACHED');
      throw new Error('Limite de 10 cartes maximum atteinte.');
    }
    console.log('  ✅ Card limit check PASSED');

    console.log('\n👤 STEP 6: Customer Verification');
    const { data: customer, error: customerError } = await supabase
      .from('strowallet_customers')
      .select('customer_id, customer_email')
      .eq('user_id', user.id)
      .eq('customer_email', customer_email)
      .single();

    if (customerError || !customer) {
      console.error('  ❌ Customer not found');
      throw new Error('Profil client introuvable. Créez votre profil d\'abord.');
    }
    console.log('  ✅ Customer found:', customer.customer_id);

    console.log('\n🔑 STEP 7: API Configuration & Validation');
    const rawPublicKey = Deno.env.get('STROWALLET_PUBLIC_KEY')?.trim();
    if (!rawPublicKey) {
      throw new Error('STROWALLET_PUBLIC_KEY not configured');
    }

    // Le test a montré que la clé fonctionne SANS préfixe
    const publicKey = rawPublicKey;

    // Validation stricte avant appel API
    const validationErrors: string[] = [];
    if (!name_on_card || name_on_card.trim().length < 2 || name_on_card.length > 40) {
      validationErrors.push('name_on_card invalide (2-40 caractères)');
    }
    if (typeof cardAmount !== 'number' || !isFinite(cardAmount) || cardAmount <= 0) {
      validationErrors.push('amount invalide (doit être > 0)');
    }
    if (!requestCurrency || !/^[A-Z]{3}$/.test(requestCurrency)) {
      validationErrors.push('currency invalide (format ISO 3 lettres)');
    }
    if (!customer_email || !/.+@.+\..+/.test(customer_email)) {
      validationErrors.push('customer_email invalide');
    }
    if (!customer.customer_id) {
      validationErrors.push('customer_id manquant');
    }

    if (validationErrors.length > 0) {
      console.error('  ❌ Validation failed:', validationErrors.join(', '));
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }
    console.log('  ✅ Validation passed');

    const apiUrl = 'https://strowallet.com/api/bitvcard/create-card/';
    const payload = {
      public_key: publicKey,
      name_on_card: name_on_card.trim(),
      card_type: card_type || 'visa',
      amount: cardAmount,
      customerEmail: customer_email,  // API expects camelCase
    };

    console.log('\n🔄 STEP 8: API Call');
    console.log('  🌐 URL:', apiUrl);
    console.log('  📤 Payload (masqué):', JSON.stringify({
      ...payload,
      public_key: `${publicKey.substring(0, 4)}***`,
      customerEmail: customer_email?.replace(/(.{3}).*(@.*)/, '$1***$2')
    }, null, 2));
    
    console.log('  ⏱️  Request start:', new Date().toISOString());
    const requestStart = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const requestDuration = Date.now() - requestStart;
    console.log(`  ⏱️  Request duration: ${requestDuration}ms`);
    console.log('  📡 HTTP Status:', response.status);
    console.log('  📋 Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('  📦 Response length:', responseText.length, 'bytes');
    console.log('  📦 Response body:', responseText.substring(0, 1000));
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('  ✅ JSON parsed successfully');
    } catch (parseError: any) {
      console.error('  ❌ JSON parse error:', parseError.message);
      console.error('  📄 Raw text:', responseText.substring(0, 500));
      throw new Error(`Invalid JSON from API: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      const apiMessage = result.message || result.error || 'Unknown API error';
      const mappedStatus = response.status >= 500 ? 'remote_server_error' : 'api_error';
      
      console.error('\n❌ API ERROR DETAILS:');
      console.error('  - Status:', response.status);
      console.error('  - Type:', mappedStatus);
      console.error('  - Message:', apiMessage);
      console.error('  - Full response:', JSON.stringify(result, null, 2));
      
      throw new Error(`Strowallet API (${response.status}): ${apiMessage}`);
    }

    if (!result.success) {
      console.error('\n❌ API returned success=false');
      console.error('  - Response:', JSON.stringify(result, null, 2));
      throw new Error(result.message || result.error || 'API returned success=false');
    }

    const cardData = result.response;
    if (!cardData || !cardData.card_id) {
      console.error('\n❌ Invalid card data');
      console.error('  - Result:', JSON.stringify(result, null, 2));
      throw new Error('Invalid card data from API');
    }
    
    console.log('  ✅ Card created successfully');
    console.log('  🎫 Card ID:', cardData.card_id);
    console.log('  💳 Type:', cardData.card_type);
    console.log('  💰 Balance:', cardData.balance || cardAmount);

    console.log('\n💾 STEP 9: Database Storage');
    const { error: insertError } = await supabase
      .from('strowallet_cards')
      .insert({
        user_id: user.id,
        customer_id: customer.customer_id,
        card_id: cardData.card_id,
        name_on_card: cardData.name_on_card,
        card_type: cardData.card_type,
        balance: cardData.balance || cardAmount,
        currency: cardData.currency || requestCurrency,
        status: cardData.card_status || 'active',
        card_number: cardData.last4 || '',
        expiry_month: cardData.expiry?.split('/')?.[0] || '',
        expiry_year: cardData.expiry?.split('/')?.[1] || '',
        cvv: '',
        raw_response: cardData,
      });

    if (insertError) {
      throw insertError;
    }
    console.log('  ✅ Card stored in database');

    console.log('\n💸 STEP 10: Debit Wallet');
    const newBalance = parseFloat(wallet.balance) - totalRequired;
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);
    
    if (walletUpdateError) {
      throw new Error('Erreur lors de la mise à jour du portefeuille');
    }
    console.log('  ✅ Wallet debited:', totalRequired, requestCurrency);
    console.log('  - New Balance:', newBalance, requestCurrency);
    
    console.log('\n📝 STEP 11: Record Transaction');
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'card_creation',
        amount: -totalRequired,
        description: `Création carte ${cardData.card_id} - ${cardAmount.toFixed(2)} ${requestCurrency} + ${totalFees.toFixed(2)} ${requestCurrency} frais`,
        reference: cardData.card_id
      });
    
    console.log('  ✅ Transaction recorded');

    console.log('\n' + '='.repeat(80));
    console.log('🎉 CARD CREATION COMPLETED');
    console.log('='.repeat(80));

    const totalDuration = Date.now() - requestStartTime;

    // Log to database
    await supabase
      .from('strowallet_api_logs')
      .insert({
        function_name: 'create-strowallet-card',
        user_id: user.id,
        request_payload: {
          public_key: `${publicKey.substring(0, 4)}***`,
          name_on_card,
          card_type: card_type || 'visa',
          amount: cardAmount,
          currency: requestCurrency,
          customer_email: customer_email?.replace(/(.{3}).*(@.*)/, '$1***$2'),
          customer_id: `${customer.customer_id.substring(0, 8)}***`
        },
        response_data: {
          success: true,
          card_id: cardData.card_id,
          card_type: cardData.card_type,
          balance: cardData.balance || cardAmount,
          currency: cardData.currency || requestCurrency
        },
        status_code: 200,
        duration_ms: totalDuration,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        card: cardData,
        wallet: {
          currency: requestCurrency,
          previous_balance: parseFloat(wallet.balance),
          amount_debited: totalRequired,
          new_balance: newBalance
        },
        fees: {
          fixed: fixedFee,
          percent: percentFee,
          total: totalFees
        },
        message: `Carte créée avec succès. ${totalRequired.toFixed(2)} ${requestCurrency} débités de votre portefeuille.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    
    const totalDuration = Date.now() - requestStartTime;

    // Log error to database
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const authHeader = req.headers.get('Authorization');
      let userId = null;
      let requestPayload = {};
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      }

      try {
        requestPayload = await req.clone().json();
      } catch {
        requestPayload = {};
      }

      await supabase
        .from('strowallet_api_logs')
        .insert({
          function_name: 'create-strowallet-card',
          user_id: userId,
          request_payload: requestPayload,
          response_data: { success: false, error: error.message },
          status_code: 400,
          duration_ms: totalDuration,
          error_message: error.message,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
