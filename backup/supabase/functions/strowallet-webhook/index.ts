import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-strowallet-signature, x-strowallet-timestamp',
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

    const signature = req.headers.get('X-Strowallet-Signature');
    const timestamp = req.headers.get('X-Strowallet-Timestamp');
    const webhookSecret = Deno.env.get('STROWALLET_WEBHOOK_SECRET');

    console.log('='.repeat(80));
    console.log('📨 WEBHOOK RECEIVED');
    console.log('='.repeat(80));
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', {
      signature: signature ? '✓ présent' : '✗ absent',
      timestamp: timestamp ? '✓ présent' : '✗ absent',
      secret_configured: webhookSecret ? '✓ configuré' : '✗ absent'
    });

    // Read body
    const body = await req.text();
    console.log('Body length:', body.length, 'bytes');
    
    let payload;
    try {
      payload = JSON.parse(body);
      console.log('Payload parsed successfully');
    } catch (e: any) {
      console.error('❌ Failed to parse payload:', e.message);
      throw new Error('Invalid JSON payload');
    }

    // Verify signature if provided
    let signatureValid = false;
    if (signature && timestamp && webhookSecret) {
      const drift = Math.abs(Date.now() - Number(timestamp));
      if (drift > 5 * 60 * 1000) {
        console.warn('Timestamp drift too large');
      } else {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        signatureValid = signature === expectedSignature;
        console.log('Signature validation:', signatureValid);
      }
    } else {
      console.warn('No signature verification headers provided');
      signatureValid = true; // Accept without signature if not configured
    }

    const eventId = payload.id || payload.event_id || crypto.randomUUID();
    const eventType = payload.event || payload.type || 'unknown';
    const cardId = payload.cardId || payload.card_id;

    console.log('\n📋 EVENT DETAILS:');
    console.log('  - Event ID:', eventId);
    console.log('  - Event Type:', eventType);
    console.log('  - Card ID:', cardId || 'N/A');
    console.log('  - Payload keys:', Object.keys(payload).join(', '));

    // Check for duplicate event
    console.log('\n🔍 Checking for duplicates...');
    const { data: existing } = await supabase
      .from('strowallet_webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log('⚠️ Duplicate event detected, ignoring');
      return new Response(
        JSON.stringify({ success: true, duplicate: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✓ No duplicate found');

    // Find user_id from card_id if available
    let userId = null;
    if (cardId) {
      console.log('\n👤 Looking up user from card_id...');
      const { data: card } = await supabase
        .from('strowallet_cards')
        .select('user_id')
        .eq('card_id', cardId)
        .single();
      
      if (card) {
        userId = card.user_id;
        console.log('✓ User found:', userId);
      } else {
        console.log('⚠️ No user found for this card');
      }
    }

    // Insert webhook event
    console.log('\n💾 Storing webhook event...');
    const { error: insertError } = await supabase
      .from('strowallet_webhook_events')
      .insert({
        event_id: eventId,
        card_id: cardId,
        user_id: userId,
        event_type: eventType,
        payload: payload,
        signature_valid: signatureValid,
        processed: false,
      });

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw insertError;
    }
    console.log('✓ Event stored successfully');

    // Process specific event types
    console.log('\n⚙️ Processing event type:', eventType);
    
    if (eventType === 'transaction' || eventType === 'card.transaction') {
      console.log('  → Processing transaction event');
      
      // Store transaction
      const { error: txError } = await supabase
        .from('card_transactions')
        .insert({
          card_id: cardId,
          user_id: userId,
          transaction_id: payload.transactionId || payload.transaction_id,
          amount: payload.amount || 0,
          type: payload.transactionType || 'charge',
          status: payload.status || 'completed',
          description: payload.description || payload.merchant,
          merchant_name: payload.merchant || payload.merchantName,
          currency: payload.currency || 'USD',
          merchant_category: payload.merchantCategory || payload.merchant_category,
          raw_data: payload,
        });

      if (txError) {
        console.error('  ❌ Transaction insert error:', txError);
      } else {
        console.log('  ✓ Transaction stored');
      }

      // Update card balance if provided
      if (payload.newBalance !== undefined) {
        await supabase
          .from('strowallet_cards')
          .update({ balance: payload.newBalance })
          .eq('card_id', cardId);
        console.log('  ✓ Card balance updated:', payload.newBalance);
      }
    }

    // Process card status updates
    if (eventType === 'card.status_changed' || eventType === 'card.blocked' || eventType === 'card.unblocked') {
      console.log('  → Processing card status event');
      
      const newStatus = payload.status || (eventType === 'card.blocked' ? 'blocked' : 'active');
      await supabase
        .from('strowallet_cards')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('card_id', cardId);
      console.log('  ✓ Card status updated to:', newStatus);
    }

    // Process balance updates
    if (eventType === 'card.funded' || eventType === 'card.balance_changed') {
      console.log('  → Processing balance update event');
      
      if (payload.balance !== undefined || payload.newBalance !== undefined) {
        const newBalance = payload.balance || payload.newBalance;
        await supabase
          .from('strowallet_cards')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('card_id', cardId);
        console.log('  ✓ Balance updated to:', newBalance);
      }
    }

    // Mark as processed
    await supabase
      .from('strowallet_webhook_events')
      .update({ processed: true })
      .eq('event_id', eventId);

    console.log('\n' + '='.repeat(80));
    console.log('✅ WEBHOOK PROCESSED SUCCESSFULLY');
    console.log('='.repeat(80));

    return new Response(
      JSON.stringify({ success: true, event_id: eventId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in strowallet-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
