import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { card_id, amount } = await req.json();

    if (!card_id || !amount) {
      throw new Error('card_id and amount are required');
    }

    console.log('Funding card:', card_id, 'with amount:', amount);

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from('strowallet_cards')
      .select('*')
      .eq('card_id', card_id)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      throw new Error('Card not found or access denied');
    }

    // Check if user has sufficient wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', card.currency)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    // Load fee settings from database
    const { data: feeSettings, error: feeError } = await supabase
      .from('fees_settings')
      .select('setting_key, setting_value');
    
    if (feeError) {
      console.error('Error loading fee settings:', feeError);
    }

    const fees: any = {};
    feeSettings?.forEach((fee: any) => {
      fees[fee.setting_key] = parseFloat(fee.setting_value);
    });

    const fundAmount = parseFloat(amount);
    
    // Validate minimum amount
    const minAmountKey = `min_card_reload_${card.currency.toLowerCase()}`;
    const minAmount = fees[minAmountKey] || (card.currency === 'XOF' ? 2500 : 1);
    
    if (fundAmount < minAmount) {
      throw new Error(`Le montant minimum pour recharger est de ${minAmount} ${card.currency}. Veuillez augmenter le montant.`);
    }

    // Calculate total with fees
    const fixedFeeKey = `card_reload_fixed_fee_${card.currency.toLowerCase()}`;
    const percentFeeKey = 'card_reload_percent_fee';
    const fixedFee = fees[fixedFeeKey] || 0;
    const percentFee = (fundAmount * (fees[percentFeeKey] || 0)) / 100;
    const totalAmount = fundAmount + fixedFee + percentFee;

    if (parseFloat(wallet.balance) < totalAmount) {
      throw new Error(`Solde insuffisant. Disponible: ${wallet.balance} ${card.currency}. Requis (avec frais): ${totalAmount.toFixed(2)} ${card.currency}`);
    }

    const publicKey = Deno.env.get('STROWALLET_PUBLIC_KEY');
    const baseUrls = [
      'https://strowallet.com/api/bitvcard',
      'https://strowallet.com/api'
    ];

    // Production payload - NO mode field
    const payload = {
      public_key: publicKey,
      card_id: card_id,
      amount: fundAmount,
      currency: card.currency,
    };

    console.log('Calling Strowallet API to fund card');

    let response;
    let result;
    let lastError;

    // Try both URLs with fallback
    for (const baseUrl of baseUrls) {
      try {
        const fullUrl = `${baseUrl}/fund-card/`;
        console.log('Trying URL:', fullUrl);

        response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        result = await response.json();
        console.log('Response from', baseUrl, ':', result);

        if (response.ok && result.success) {
          console.log('Success with URL:', baseUrl);
          break;
        } else {
          lastError = result.message || `Failed to fund card: HTTP ${response.status}`;
          console.log('Failed with', baseUrl, '- trying next URL');
        }
      } catch (error: any) {
        console.log('Error with', baseUrl, ':', error.message);
        lastError = error.message;
        continue;
      }
    }

    if (!response?.ok || !result?.success) {
      throw new Error(lastError || 'Failed to fund card with all URLs');
    }

    const fundedCard = result.response;
    const newBalance = fundedCard.balance_after || (parseFloat(card.balance) + fundAmount);

    // Update card balance in database
    const { error: updateCardError } = await supabase
      .from('strowallet_cards')
      .update({ 
        balance: newBalance,
        raw_response: fundedCard,
        updated_at: new Date().toISOString(),
      })
      .eq('card_id', card_id);

    if (updateCardError) {
      console.error('Failed to update card balance:', updateCardError);
    }

    // Deduct total amount (including fees) from wallet balance
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({ 
        balance: parseFloat(wallet.balance) - totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('currency', card.currency);

    if (updateWalletError) {
      console.error('Failed to update wallet balance:', updateWalletError);
      throw new Error('Failed to deduct from wallet');
    }

    // Record wallet transaction (debit with fees)
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        amount: -totalAmount,
        type: 'debit',
        description: `Rechargement carte ****${card.card_number} (${fundAmount} ${card.currency} + frais ${(fixedFee + percentFee).toFixed(2)} ${card.currency})`,
        reference: fundedCard.transaction_id || `fund_card_${Date.now()}`,
      });

    // Record card transaction (fund)
    await supabase
      .from('card_transactions')
      .insert({
        card_id: card_id,
        user_id: user.id,
        amount: fundAmount,
        type: 'fund',
        status: 'completed',
        description: 'Rechargement de carte',
        currency: card.currency,
        transaction_id: fundedCard.transaction_id,
        raw_data: fundedCard,
      });

    console.log('Card funded successfully. New balance:', newBalance);

    return new Response(
      JSON.stringify({ 
        success: true, 
        card: fundedCard,
        new_balance: newBalance,
        wallet_balance: parseFloat(wallet.balance) - totalAmount,
        transaction_id: fundedCard.transaction_id,
        fees: {
          fixed: fixedFee,
          percent: percentFee,
          total: fixedFee + percentFee
        },
        message: 'Card funded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in fund-strowallet-card:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        error_code: 'CARD_FUNDING_ERROR'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
