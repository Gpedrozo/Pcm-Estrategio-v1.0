import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateApiToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const base64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `pcm_live_${base64}`;
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Token JWT ausente." }, 401);
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return json({ error: "Usuário não autenticado." }, 401);
    }

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleRow?.role !== "MASTER_TI") {
      return json({ error: "Acesso negado. Requer perfil MASTER_TI." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "list");

    if (action === "list") {
      const empresaId = body.empresaId ? String(body.empresaId) : null;
      let query = supabaseAdmin
        .from("api_tokens")
        .select("id, empresa_id, name, scopes, active, expires_at, created_at, created_by")
        .order("created_at", { ascending: false });

      if (empresaId) query = query.eq("empresa_id", empresaId);

      const { data, error } = await query.limit(500);
      if (error) return json({ error: error.message }, 500);
      return json({ items: data || [] });
    }

    if (action === "create") {
      const empresaId = String(body.empresaId || "");
      const name = String(body.name || "").trim();
      const scopes = Array.isArray(body.scopes) ? body.scopes.map((s: unknown) => String(s)) : [];
      const expiresAt = body.expiresAt ? String(body.expiresAt) : null;

      if (!empresaId || !name || scopes.length === 0) {
        return json({ error: "Parâmetros inválidos para criação de token." }, 400);
      }

      const plainToken = generateApiToken();
      const tokenHash = await sha256Hex(plainToken);

      const { data, error } = await supabaseAdmin
        .from("api_tokens")
        .insert({
          empresa_id: empresaId,
          name,
          token_hash: tokenHash,
          scopes,
          active: true,
          expires_at: expiresAt,
          created_by: user.id,
        })
        .select("id, empresa_id, name, scopes, active, expires_at, created_at")
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ item: data, plainToken });
    }

    if (action === "revoke") {
      const tokenId = String(body.tokenId || "");
      if (!tokenId) return json({ error: "tokenId é obrigatório." }, 400);

      const { data, error } = await supabaseAdmin
        .from("api_tokens")
        .update({ active: false })
        .eq("id", tokenId)
        .select("id, active")
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ item: data });
    }

    if (action === "rotate") {
      const tokenId = String(body.tokenId || "");
      if (!tokenId) return json({ error: "tokenId é obrigatório." }, 400);

      const plainToken = generateApiToken();
      const tokenHash = await sha256Hex(plainToken);

      const { data, error } = await supabaseAdmin
        .from("api_tokens")
        .update({ token_hash: tokenHash, active: true })
        .eq("id", tokenId)
        .select("id, empresa_id, name, scopes, active, expires_at, created_at")
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ item: data, plainToken });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado." }, 500);
  }
});
