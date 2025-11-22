import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Non authentifié');
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      throw new Error('Accès refusé. Droits administrateur requis.');
    }

    const { action, userId, walletId, amount, description } = await req.json();

    if (!action || !userId || !walletId || !amount) {
      throw new Error('Paramètres manquants');
    }

    if (parseFloat(amount) <= 0) {
      throw new Error('Le montant doit être supérieur à 0');
    }

    // Get the wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet introuvable');
    }

    const amountValue = parseFloat(amount);
    let newBalance: number;
    let transactionType: string;
    let transactionDescription: string;

    if (action === 'add') {
      newBalance = parseFloat(wallet.balance) + amountValue;
      transactionType = 'credit';
      transactionDescription = description || `Ajout admin: +${amountValue} ${wallet.currency}`;
    } else if (action === 'subtract') {
      newBalance = parseFloat(wallet.balance) - amountValue;
      if (newBalance < 0) {
        throw new Error(`Solde insuffisant. Solde actuel: ${wallet.balance} ${wallet.currency}`);
      }
      transactionType = 'debit';
      transactionDescription = description || `Retrait admin: -${amountValue} ${wallet.currency}`;
    } else {
      throw new Error('Action invalide. Utilisez "add" ou "subtract"');
    }

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update wallet balance
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId);

    if (updateError) {
      console.error('Error updating wallet:', updateError);
      throw new Error('Erreur lors de la mise à jour du wallet');
    }

    // Record transaction
    const { error: transactionError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        amount: action === 'add' ? amountValue : -amountValue,
        type: transactionType,
        description: transactionDescription,
        reference: `admin-${action}-${Date.now()}`
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Don't throw here, wallet is already updated
    }

    console.log(`Admin ${action} successful:`, {
      userId,
      walletId,
      currency: wallet.currency,
      oldBalance: wallet.balance,
      newBalance,
      amount: amountValue
    });

    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          id: walletId,
          currency: wallet.currency,
          oldBalance: parseFloat(wallet.balance),
          newBalance,
          amountChanged: amountValue
        },
        message: action === 'add' 
          ? `Solde ajouté avec succès: +${amountValue} ${wallet.currency}`
          : `Solde retiré avec succès: -${amountValue} ${wallet.currency}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in admin-manage-wallet:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur interne du serveur'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
