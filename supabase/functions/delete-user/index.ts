// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verifica autentificarea
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client cu token-ul utilizatorului (pentru a-i verifica identitatea)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verifica cine e utilizatorul logat
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client admin (service_role) pentru stergere
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const userId = user.id;

    // 1. Gaseste wedding-ul utilizatorului
    const { data: wedding } = await supabaseAdmin
      .from("weddings")
      .select("id")
      .eq("user_id", userId)
      .single();

    // 2. Sterge datele din tabele (ordine: copii mai intai)
    if (wedding) {
      const weddingId = wedding.id;
      await supabaseAdmin.from("guests").delete().eq("wedding_id", weddingId);
      await supabaseAdmin.from("tables").delete().eq("wedding_id", weddingId);
      await supabaseAdmin.from("budget_items").delete().eq("wedding_id", weddingId);
      await supabaseAdmin.from("tasks").delete().eq("wedding_id", weddingId);
      await supabaseAdmin.from("vendors").delete().eq("wedding_id", weddingId);
      await supabaseAdmin.from("weddings").delete().eq("id", weddingId);
    }

    // 3. Sterge user-ul din Authentication
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Delete user error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
