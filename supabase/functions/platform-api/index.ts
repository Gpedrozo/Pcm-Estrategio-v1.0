import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-token",
};

type TenantContext = {
  empresaId: string;
  userId: string;
  userName: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const path = new URL(req.url).pathname.replace(/^\/+/, "");
  const route = path.replace(/^functions\/v1\/platform-api\/?/, "");
  const authHeader = req.headers.get("Authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Token JWT ausente." }, 401);
  }

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userRes, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !userRes.user) {
    return json({ error: "Usuário não autenticado." }, 401);
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("empresa_id, nome")
    .eq("id", userRes.user.id)
    .maybeSingle();

  if (!profile?.empresa_id) {
    return json({ error: "Empresa do usuário não identificada." }, 403);
  }

  const tenant: TenantContext = {
    empresaId: profile.empresa_id,
    userId: userRes.user.id,
    userName: profile.nome || userRes.user.email || "Usuário",
  };

  const endpointKey = `/api/v1/${route || ""}`;
  const { data: rlData, error: rlError } = await supabaseAdmin.rpc("check_rate_limit", {
    p_endpoint: endpointKey,
    p_max_requests: 300,
    p_window_seconds: 60,
  });

  if (rlError || rlData !== true) {
    return json({ error: "Rate limit excedido." }, 429);
  }

  const logUsage = async (statusCode: number) => {
    await supabaseAdmin.from("api_usage_logs").insert({
      empresa_id: tenant.empresaId,
      user_id: tenant.userId,
      endpoint: endpointKey,
      method: req.method,
      status_code: statusCode,
      response_time_ms: 0,
      metadata: {},
    });
  };

  try {
    if (route === "openapi" && req.method === "GET") {
      await logUsage(200);
      return json({ ok: true, spec: "docs/openapi/platform-api.yaml" });
    }

    if (route === "equipamentos" && req.method === "GET") {
      const url = new URL(req.url);
      const page = Number(url.searchParams.get("page") || "1");
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")));
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabaseAdmin
        .from("equipamentos")
        .select("id, tag, nome, criticidade, nivel_risco, localizacao, ativo", { count: "exact" })
        .eq("empresa_id", tenant.empresaId)
        .order("tag")
        .range(from, to);

      if (error) {
        await logUsage(500);
        return json({ error: error.message }, 500);
      }

      await logUsage(200);
      return json({ items: data || [], page, limit, total: count || 0 });
    }

    if (route === "ordens-servico" && req.method === "GET") {
      const url = new URL(req.url);
      const page = Number(url.searchParams.get("page") || "1");
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "20")));
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabaseAdmin
        .from("ordens_servico")
        .select("id, numero_os, tag, equipamento, tipo, prioridade, status, data_solicitacao", { count: "exact" })
        .eq("empresa_id", tenant.empresaId)
        .order("numero_os", { ascending: false })
        .range(from, to);

      if (error) {
        await logUsage(500);
        return json({ error: error.message }, 500);
      }

      await logUsage(200);
      return json({ items: data || [], page, limit, total: count || 0 });
    }

    if (route === "execucoes" && req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("execucoes_os")
        .select("id, os_id, data_execucao, mecanico_nome, custo_total, tempo_execucao")
        .eq("empresa_id", tenant.empresaId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        await logUsage(500);
        return json({ error: error.message }, 500);
      }

      await logUsage(200);
      return json({ items: data || [] });
    }

    if (route === "indicadores" && req.method === "GET") {
      const [osRes, execRes] = await Promise.all([
        supabaseAdmin.from("ordens_servico").select("id, tipo, status").eq("empresa_id", tenant.empresaId),
        supabaseAdmin.from("execucoes_os").select("custo_total, tempo_execucao").eq("empresa_id", tenant.empresaId),
      ]);

      if (osRes.error || execRes.error) {
        await logUsage(500);
        return json({ error: osRes.error?.message || execRes.error?.message || "Erro de indicadores" }, 500);
      }

      const os = osRes.data || [];
      const exec = execRes.data || [];
      const custoTotal = exec.reduce((acc, item) => acc + (Number(item.custo_total) || 0), 0);
      const tempoTotal = exec.reduce((acc, item) => acc + (Number(item.tempo_execucao) || 0), 0);

      await logUsage(200);
      return json({
        total_os: os.length,
        abertas: os.filter((o) => o.status !== "FECHADA").length,
        corretivas: os.filter((o) => o.tipo === "CORRETIVA").length,
        custo_total: custoTotal,
        tempo_total_execucao: tempoTotal,
      });
    }

    if (route === "usuarios" && req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("usuarios")
        .select("id, nome, perfil")
        .eq("empresa_id", tenant.empresaId)
        .limit(500);

      if (error) {
        await logUsage(500);
        return json({ error: error.message }, 500);
      }

      await logUsage(200);
      return json({ items: data || [] });
    }

    if (route === "empresas" && req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("empresas")
        .select("id, nome, plano, ativo")
        .eq("id", tenant.empresaId)
        .maybeSingle();

      if (error) {
        await logUsage(500);
        return json({ error: error.message }, 500);
      }

      await logUsage(200);
      return json({ item: data });
    }

    await logUsage(404);
    return json({ error: "Endpoint não encontrado." }, 404);
  } catch (error) {
    await logUsage(500);
    return json({ error: error instanceof Error ? error.message : "Erro inesperado." }, 500);
  }
});
