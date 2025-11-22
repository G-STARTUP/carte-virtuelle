import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting balance fetch...');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with service role to bypass RLS for admin check
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError?.message);
      throw new Error('Not authenticated');
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Check if user is admin using service role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('❌ Not an admin:', user.id);
      throw new Error('Unauthorized: Admin access required');
    }

    console.log(`✅ Admin verified: ${user.id}`);

    const rawPublicKey = Deno.env.get('STROWALLET_PUBLIC_KEY')?.trim();
    if (!rawPublicKey) {
      throw new Error('STROWALLET_PUBLIC_KEY not configured');
    }

    // Test avec et sans préfixe
    const publicKeyVariants = [
      rawPublicKey,
      `pk_live_${rawPublicKey}`
    ];

    const currency = 'USD';
    
    console.log(`📞 Calling Strowallet API for ${currency} balance...`);
    
    let balanceData = null;
    let lastError = null;

    for (let i = 0; i < publicKeyVariants.length; i++) {
      const publicKey = publicKeyVariants[i];
      const keyType = publicKey.startsWith('pk_live_') ? 'avec préfixe' : 'sans préfixe';
      
      console.log(`\n🔑 Tentative ${i + 1}/${publicKeyVariants.length} (${keyType})`);
      
      try {
        const url = `https://strowallet.com/api/wallet/balance/${currency}/?public_key=${encodeURIComponent(publicKey)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log(`  📥 Response status: ${response.status}`);
        
        const data = await response.json();
        console.log(`  📊 Response data:`, JSON.stringify(data).substring(0, 200));

        if (response.ok && data.balance !== undefined) {
          balanceData = {
            balance: data.balance,
            currency: currency,
            message: 'Successfully fetched account balance'
          };
          console.log(`  ✅ Balance récupéré avec succès:`, data.balance, currency);
          break;
        } else {
          lastError = data.message || 'Unable to fetch balance';
          console.log(`  ❌ Échec:`, lastError);
        }
      } catch (error: any) {
        lastError = error.message;
        console.log(`  ❌ Exception:`, error.message);
      }
    }

    if (!balanceData) {
      return new Response(
        JSON.stringify({
          success: false,
          balance: 0,
          message: lastError || 'Unable to fetch balance'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        ...balanceData
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        balance: 0,
        message: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
