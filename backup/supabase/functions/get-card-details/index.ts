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

    const url = new URL(req.url);
    const cardId = url.searchParams.get('card_id');

    if (!cardId) {
      throw new Error('card_id is required');
    }

    console.log('Fetching card details for card:', cardId);

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from('strowallet_cards')
      .select('*')
      .eq('card_id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      throw new Error('Card not found or access denied');
    }

    const publicKey = Deno.env.get('STROWALLET_PUBLIC_KEY');
    const baseUrls = [
      'https://strowallet.com/api/bitvcard',
      'https://strowallet.com/api'
    ];

    // Production payload - NO mode field
    const payload = {
      public_key: publicKey,
      card_id: cardId,
    };

    console.log('Calling Strowallet API for card details');

    let response;
    let result;
    let lastError;

    // Try both URLs with fallback
    for (const baseUrl of baseUrls) {
      try {
        const fullUrl = `${baseUrl}/fetch-card-detail/`;
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
          lastError = result.message || `Failed to fetch card details: HTTP ${response.status}`;
          console.log('Failed with', baseUrl, '- trying next URL');
        }
      } catch (error: any) {
        console.log('Error with', baseUrl, ':', error.message);
        lastError = error.message;
        continue;
      }
    }

    if (!response?.ok || !result?.success) {
      throw new Error(lastError || 'Failed to fetch card details with all URLs');
    }

    const cardDetails = result.response.card_detail;

    // Update local card data with fresh data from API
    const { error: updateError } = await supabase
      .from('strowallet_cards')
      .update({
        balance: cardDetails.balance || card.balance,
        status: cardDetails.card_status || card.status,
        card_number: cardDetails.last4 || card.card_number,
        name_on_card: cardDetails.name_on_card || card.name_on_card,
        expiry_month: cardDetails.expiry?.split('/')?.[0] || card.expiry_month,
        expiry_year: cardDetails.expiry?.split('/')?.[1] || card.expiry_year,
        raw_response: cardDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('card_id', cardId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Don't throw - still return API data
    }

    console.log('Card details fetched and updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        card: cardDetails,
        message: 'Card details fetched successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in get-card-details:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        error_code: 'CARD_FETCH_ERROR'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
