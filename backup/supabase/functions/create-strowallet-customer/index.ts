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
      first_name, 
      last_name, 
      customer_email, 
      phone, 
      date_of_birth,
      address,
      city,
      state,
      zip_code,
      country,
      id_type,
      id_number,
      id_image,
      user_photo,
      house_number
    } = await req.json();

    console.log('Creating Strowallet customer for user:', user.id);

    const publicKey = Deno.env.get('STROWALLET_PUBLIC_KEY');
    const baseUrls = [
      'https://strowallet.com/api',
      'https://strowallet.com/api/bitvcard'
    ];

    console.log('Public key present:', !!publicKey);

    const payload = {
      public_key: publicKey,
      houseNumber: house_number || address?.split(' ')[0] || '1',
      firstName: first_name,
      lastName: last_name,
      idNumber: id_number || Math.floor(Math.random() * 1e9).toString(),
      customerEmail: customer_email,
      phoneNumber: phone,
      dateOfBirth: date_of_birth,
      idImage: id_image || '',
      userPhoto: user_photo || '',
      line1: address || '',
      state: state || 'Accra',
      zipCode: zip_code || '',
      city: city || 'Accra',
      country: country || 'Ghana',
      idType: id_type || 'PASSPORT',
    };

    console.log('Calling Strowallet API to create customer');
    console.log('Payload (masked):', { ...payload, public_key: '***', idNumber: '***' });

    let response;
    let result;
    let lastError;

    // Try both URLs with fallback
    for (const baseUrl of baseUrls) {
      try {
        const fullUrl = `${baseUrl}/create-user`;
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
          break; // Success, exit loop
        } else {
          lastError = result.message || 'Failed to create customer';
          console.log('Failed with', baseUrl, '- trying next URL');
        }
      } catch (error: any) {
        console.log('Error with', baseUrl, ':', error.message);
        lastError = error.message;
        continue; // Try next URL
      }
    }

    if (!response?.ok || !result?.success) {
      throw new Error(lastError || 'Failed to create customer with all URLs');
    }

    const customer = result.response;

    // Store customer in database
    const { error: insertError } = await supabase
      .from('strowallet_customers')
      .insert({
        user_id: user.id,
        customer_id: customer.customerId,
        customer_email: customer.customerEmail,
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone_number: customer.phoneNumber,
        id_image_url: id_image || null,
        user_photo_url: user_photo || null,
        data: customer,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Customer created successfully:', customer.customerId);

    return new Response(
      JSON.stringify({ success: true, customer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-strowallet-customer:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
