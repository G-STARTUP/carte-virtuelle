import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawPublicKey = Deno.env.get('STROWALLET_PUBLIC_KEY')?.trim();
    const rawSecretKey = Deno.env.get('STROWALLET_SECRET_KEY')?.trim();

    if (!rawPublicKey || !rawSecretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Clés API Strowallet non configurées',
          details: {
            public_key: rawPublicKey ? 'Configurée' : 'Manquante',
            secret_key: rawSecretKey ? 'Configurée' : 'Manquante'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test avec les différentes variantes de clés
    const publicKeyVariants = [
      `pk_live_${rawPublicKey}`,
      rawPublicKey
    ];

    const secretKeyVariants = [
      `sk_live_${rawSecretKey}`,
      rawSecretKey
    ];

    const testResults = [];

    // Test 1: Récupérer le solde avec la clé publique
    console.log('🧪 Test 1: Balance API avec clé publique');
    for (const publicKey of publicKeyVariants) {
      try {
        const currency = 'USD';
        const url = `https://strowallet.com/api/wallet/balance/${currency}/?public_key=${encodeURIComponent(publicKey)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        const result = await response.json();
        
        testResults.push({
          test: 'Balance API (Public Key)',
          key_variant: publicKey.startsWith('pk_live_') ? 'avec préfixe' : 'sans préfixe',
          status: response.status,
          success: response.ok && result.balance !== undefined,
          message: result.message || 'OK',
          balance: result.balance
        });

        if (response.ok && result.balance !== undefined) {
          break; // Success, pas besoin de tester les autres variantes
        }
      } catch (error: any) {
        testResults.push({
          test: 'Balance API (Public Key)',
          key_variant: publicKey.startsWith('pk_live_') ? 'avec préfixe' : 'sans préfixe',
          success: false,
          error: error.message
        });
      }
    }

    // Test 2: Vérifier avec la clé secrète si nécessaire
    console.log('🧪 Test 2: Test création de customer (clé secrète)');
    for (const secretKey of secretKeyVariants) {
      try {
        // Test simple: essayer de créer un customer fictif pour vérifier la clé
        const response = await fetch('https://strowallet.com/api/create-user/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            secret_key: secretKey,
            first_name: 'Test',
            last_name: 'Connection',
            customer_email: `test-${Date.now()}@example.com`,
            phone: '+1234567890',
            date_of_birth: '1990-01-01',
            address: 'Test Address',
            // Champs minimaux pour tester la connexion
          }),
        });

        const result = await response.json();
        
        // On vérifie juste si la clé est valide (peut échouer sur duplicate mais status sera différent)
        const isValidKey = response.status !== 401 && response.status !== 403;
        
        testResults.push({
          test: 'Test Customer Creation (Secret Key)',
          key_variant: secretKey.startsWith('sk_live_') ? 'avec préfixe' : 'sans préfixe',
          status: response.status,
          success: isValidKey,
          message: result.message || result.error || (isValidKey ? 'Clé secrète valide' : 'Clé secrète invalide')
        });

        if (isValidKey) {
          break; // La clé fonctionne
        }
      } catch (error: any) {
        testResults.push({
          test: 'Test Customer Creation (Secret Key)',
          key_variant: secretKey.startsWith('sk_live_') ? 'avec préfixe' : 'sans préfixe',
          success: false,
          error: error.message
        });
      }
    }

    // Déterminer le statut global
    const hasSuccess = testResults.some(r => r.success);
    const overallStatus = hasSuccess ? 'success' : 'error';

    return new Response(
      JSON.stringify({ 
        success: hasSuccess,
        status: overallStatus,
        message: hasSuccess 
          ? '✅ Connexion Strowallet réussie' 
          : '❌ Échec de connexion à Strowallet',
        tests: testResults,
        recommendations: hasSuccess 
          ? ['Les clés API sont valides et fonctionnelles']
          : [
            'Vérifiez que les clés API sont correctes',
            'Assurez-vous d\'utiliser les clés de production (live)',
            'Contactez le support Strowallet si le problème persiste'
          ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
