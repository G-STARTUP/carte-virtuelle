import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid token");
    }

    const { card_id, action, reason } = await req.json();

    if (!card_id || !action || !["block", "unblock"].includes(action)) {
      throw new Error("Invalid request: card_id and action (block/unblock) required");
    }

    console.log(`${action} card request for card_id: ${card_id} by user: ${user.id}`);

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from("strowallet_cards")
      .select("*")
      .eq("card_id", card_id)
      .eq("user_id", user.id)
      .single();

    if (cardError || !card) {
      throw new Error("Card not found or unauthorized");
    }

    // Check if action is valid based on current status
    if (action === "block" && card.status === "blocked") {
      return new Response(
        JSON.stringify({ success: false, message: "Card is already blocked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (action === "unblock" && card.status !== "blocked") {
      return new Response(
        JSON.stringify({ success: false, message: "Card is not blocked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const publicKey = Deno.env.get("STROWALLET_PUBLIC_KEY");
    const baseUrls = [
      "https://strowallet.com/api/bitvcard",
      "https://strowallet.com/api"
    ];

    // Try to call Strowallet API with fallback mechanism
    let apiResult = null;
    let apiSuccess = false;
    let lastError;

    for (const baseUrl of baseUrls) {
      try {
        const endpoint = action === "block" ? "block-card/" : "unblock-card/";
        const payload: any = {
          public_key: publicKey,
          card_id: card_id,
        };

        if (action === "block" && reason) {
          payload.reason = reason;
        }

        console.log(`Trying Strowallet API: ${baseUrl}${endpoint}`);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log("Response from", baseUrl, ":", result);

        if (response.ok && result.success) {
          apiResult = result.response;
          apiSuccess = true;
          console.log("Success with URL:", baseUrl);
          break; // Success, exit loop
        } else {
          lastError = result.message || "API call failed";
          console.log("Failed with", baseUrl, "- trying next URL");
        }
        } catch (apiError: any) {
          console.log("Error with", baseUrl, ":", apiError.message);
          lastError = apiError.message;
        continue; // Try next URL
      }
    }

    if (!apiSuccess) {
      console.log("All Strowallet API attempts failed, will update locally only");
    }

    // Update local database regardless of API availability
    const newStatus = action === "block" ? "blocked" : "active";
    const timestamp = new Date().toISOString();

    const updateData: any = {
      status: newStatus,
      updated_at: timestamp,
    };

    if (apiResult) {
      updateData.raw_response = apiResult;
    }

    const { error: updateError } = await supabase
      .from("strowallet_cards")
      .update(updateData)
      .eq("card_id", card_id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(`Failed to update card status: ${updateError.message}`);
    }

    console.log(`Card ${card_id} status updated to ${newStatus}`);

    // Record transaction for audit trail
    await supabase
      .from("card_transactions")
      .insert({
        card_id: card_id,
        user_id: user.id,
        amount: 0,
        type: action,
        status: "completed",
        description: action === "block" 
          ? `Carte bloquée${reason ? `: ${reason}` : ""}`
          : "Carte débloquée",
        currency: card.currency,
        raw_data: { 
          action,
          reason: reason || null,
          api_success: apiSuccess,
          timestamp 
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        card_id,
        status: newStatus,
        action: action === "block" ? "blocked" : "unblocked",
        message: `Card ${action === "block" ? "blocked" : "unblocked"} successfully`,
        api_supported: apiSuccess,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in block-strowallet-card:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        error_code: "CARD_BLOCK_ERROR"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
