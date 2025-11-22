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

    const { 
      customer_id,
      first_name,
      last_name,
      phone_number
    } = await req.json();

    if (!customer_id) {
      throw new Error('customer_id is required');
    }

    console.log('Updating Strowallet customer:', customer_id, 'for user:', user.id);

    // Verify customer belongs to user
    const { data: customer, error: customerError } = await supabase
      .from('strowallet_customers')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('user_id', user.id)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found or unauthorized');
    }

    // At least one field must be provided for update
    if (!first_name && !last_name && !phone_number) {
      throw new Error('At least one field to update is required');
    }

    const publicKey = Deno.env.get('STROWALLET_PUBLIC_KEY');
    const baseUrls = [
      'https://strowallet.com/api',
      'https://strowallet.com/api/bitvcard'
    ];

    console.log('Public key present:', !!publicKey);

    let response;
    let result;
    let lastError;

    // Build query parameters
    const params = new URLSearchParams({
      public_key: publicKey || '',
      customerId: customer_id
    });

    if (first_name) params.append('firstName', first_name);
    if (last_name) params.append('lastName', last_name);
    if (phone_number) params.append('phoneNumber', phone_number);

    // Try both URLs with fallback
    for (const baseUrl of baseUrls) {
      try {
        const fullUrl = `${baseUrl}/updateCardCustomer/?${params.toString()}`;
        console.log('Trying URL:', baseUrl);

        response = await fetch(fullUrl, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
          },
        });

        result = await response.json();
        console.log('Response from', baseUrl, ':', result);

        if (response.ok && result.success) {
          console.log('Success with URL:', baseUrl);
          break; // Success, exit loop
        } else {
          lastError = result.message || 'Failed to update customer';
          console.log('Failed with', baseUrl, '- trying next URL');
        }
      } catch (error: any) {
        console.log('Error with', baseUrl, ':', error.message);
        lastError = error.message;
        continue; // Try next URL
      }
    }

    if (!response?.ok || !result?.success) {
      throw new Error(lastError || 'Failed to update customer with all URLs');
    }

    const updatedCustomer = result.response;

    // Update customer in database
    const { error: updateError } = await supabase
      .from('strowallet_customers')
      .update({
        first_name: first_name || customer.first_name,
        last_name: last_name || customer.last_name,
        phone_number: phone_number || customer.phone_number,
        data: updatedCustomer,
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customer_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Customer updated successfully:', customer_id);

    return new Response(
      JSON.stringify({ success: true, customer: updatedCustomer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-strowallet-customer:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
