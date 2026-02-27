import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Token de autenticação ausente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const logSystem = async (level: string, event: string, message: string, metadata?: Record<string, unknown>) => {
      await supabaseAdmin.from("system_logs").insert({
        empresa_id: profile?.empresa_id ?? null,
        user_id: user?.id ?? null,
        level,
        event,
        message,
        metadata: metadata ?? {},
      });
    };

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("empresa_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.empresa_id) {
      await supabaseAdmin.from("system_logs").insert({
        empresa_id: null,
        user_id: user.id,
        level: "ERROR",
        event: "IA_ANALISE_TENANCY_DENIED",
        message: "Empresa do usuário não identificada para análise IA.",
        metadata: { user_id: user.id },
      });
      return new Response(JSON.stringify({ error: "Empresa do usuário não identificada." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const empresaId = profile.empresa_id;

    const { modo = "top-problemas", tag, data_inicio, data_fim } = await req.json();

    // Build queries based on mode
    let osQuery = supabaseAdmin.from("ordens_servico").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false });
    let execQuery = supabaseAdmin.from("execucoes_os").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false });

    if (modo === "equipamento" && tag) {
      osQuery = osQuery.eq("tag", tag);
      // execucoes don't have tag, we'll filter after joining with OS
    }

    if (modo === "periodo" && data_inicio && data_fim) {
      osQuery = osQuery.gte("data_solicitacao", data_inicio).lte("data_solicitacao", data_fim);
      execQuery = execQuery.gte("data_execucao", data_inicio.split("T")[0]).lte("data_execucao", data_fim.split("T")[0]);
    }

    const [osRes, equipRes, execRes, prevRes, lubRes, fmeaRes] = await Promise.all([
      osQuery.limit(300),
      supabaseAdmin.from("equipamentos").select("*").eq("empresa_id", empresaId).eq("ativo", true),
      execQuery.limit(200),
      supabaseAdmin.from("planos_preventivos").select("*").eq("empresa_id", empresaId).eq("ativo", true),
      supabaseAdmin.from("lubrificacao").select("*").eq("empresa_id", empresaId).eq("ativo", true),
      supabaseAdmin.from("fmea").select("*").eq("empresa_id", empresaId).limit(50),
    ]);

    const os = osRes.data || [];
    const equipamentos = equipRes.data || [];
    const execucoes = execRes.data || [];
    const preventivas = prevRes.data || [];
    const lubrificacao = lubRes.data || [];
    const fmea = fmeaRes.data || [];

    // Stats
    const totalOS = os.length;
    const abertas = os.filter((o: any) => o.status !== "FECHADA").length;
    const corretivas = os.filter((o: any) => o.tipo === "CORRETIVA").length;
    const preventiv = os.filter((o: any) => o.tipo === "PREVENTIVA").length;
    const urgentes = os.filter((o: any) => o.prioridade === "URGENTE").length;

    const custoTotal = execucoes.reduce((s: number, e: any) => s + (Number(e.custo_total) || 0), 0);
    const tempoTotal = execucoes.reduce((s: number, e: any) => s + (Number(e.tempo_execucao) || 0), 0);

    // Failure frequency by tag
    const falhasPorTag: Record<string, { count: number; problemas: string[] }> = {};
    os.filter((o: any) => o.tipo === "CORRETIVA").forEach((o: any) => {
      if (!falhasPorTag[o.tag]) falhasPorTag[o.tag] = { count: 0, problemas: [] };
      falhasPorTag[o.tag].count++;
      if (falhasPorTag[o.tag].problemas.length < 5) {
        falhasPorTag[o.tag].problemas.push(`${o.problema}${o.causa_raiz ? ` (Causa: ${o.causa_raiz})` : ""}${o.modo_falha ? ` [Modo: ${o.modo_falha}]` : ""}`);
      }
    });

    const topFalhas = Object.entries(falhasPorTag)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 15)
      .map(([t, d]) => `${t}: ${d.count} corretivas\n  Problemas: ${d.problemas.join("; ")}`);

    // All OS details
    const detalhesOS = os
      .slice(0, 80)
      .map((o: any) => `[${o.tag}|${o.tipo}|${o.prioridade}|${o.status}] ${o.problema}${o.causa_raiz ? ` → Causa: ${o.causa_raiz}` : ""}${o.modo_falha ? ` (Modo: ${o.modo_falha})` : ""}`)
      .join("\n");

    // FMEA
    const fmeaFiltered = modo === "equipamento" && tag
      ? fmea.filter((f: any) => f.tag === tag)
      : fmea;
    const fmeaContext = fmeaFiltered
      .sort((a: any, b: any) => b.rpn - a.rpn)
      .slice(0, 10)
      .map((f: any) => `[${f.tag}] ${f.modo_falha} - RPN: ${f.rpn} (S:${f.severidade} O:${f.ocorrencia} D:${f.deteccao}) ${f.acao_recomendada || ""}`)
      .join("\n");

    const now = new Date();
    const prevVencidas = preventivas.filter((p: any) => new Date(p.proxima_execucao) < now).length;
    const lubVencidas = lubrificacao.filter((l: any) => new Date(l.proxima_execucao) < now).length;

    // Build mode-specific prompt
    let modoInstrucao = "";
    if (modo === "equipamento") {
      const eq = equipamentos.find((e: any) => e.tag === tag);
      modoInstrucao = `FOCO DA ANÁLISE: Equipamento ${tag}${eq ? ` (${eq.nome}, Criticidade: ${eq.criticidade}, Risco: ${eq.nivel_risco}, Fabricante: ${eq.fabricante || "N/I"})` : ""}.
Analise ESPECIFICAMENTE este equipamento: histórico de falhas, padrões de problemas, causas recorrentes, custos associados e previsões.`;
    } else if (modo === "periodo") {
      modoInstrucao = `FOCO DA ANÁLISE: Período de ${data_inicio?.split("T")[0]} a ${data_fim?.split("T")[0]}.
Analise o que aconteceu NESTE PERÍODO: tendências, picos de falhas, comparações, causas predominantes.`;
    } else {
      modoInstrucao = `FOCO DA ANÁLISE: Identificar os equipamentos com MAIOR NÚMERO DE PROBLEMAS.
Para cada equipamento problemático, liste:
1. Quantidade total de OS (corretivas e outras)
2. As causas prováveis/recorrentes
3. Modos de falha predominantes
4. Recomendações específicas
Ordene do mais problemático para o menos.`;
    }

    const systemPrompt = `Você é um engenheiro especialista em manutenção industrial (PCM).
${modoInstrucao}

FORMATO DA RESPOSTA:

## 📊 Resumo da Análise
(Panorama geral com números concretos)

## 🔴 Ranking de Problemas
(Lista ordenada dos equipamentos/situações com mais problemas, mostrando QUANTIDADE de OS e tipos)

## 🔍 Causas Prováveis Identificadas
(Para cada equipamento problemático, liste as causas mais prováveis baseadas nos dados)

## 📈 Indicadores
- Quantidade de OS por tipo e status
- Taxa corretiva vs preventiva
- Custos envolvidos

## 🎯 Recomendações Prioritárias
(Ações concretas ordenadas por urgência)

## 📅 Previsões
(Baseado nos padrões, preveja próximas falhas prováveis)

Seja MUITO ESPECÍFICO: cite TAGs, quantidades exatas, percentuais. Nunca generalize.`;

    const userPrompt = `DADOS PARA ANÁLISE:

📌 RESUMO GERAL:
- Total de OS filtradas: ${totalOS} (${abertas} abertas, ${corretivas} corretivas, ${preventiv} preventivas, ${urgentes} urgentes)
- Custo total: R$ ${custoTotal.toFixed(2)}
- Tempo total de execução: ${tempoTotal} min
- Taxa corretiva: ${totalOS > 0 ? ((corretivas / totalOS) * 100).toFixed(1) : 0}%
- Preventivas vencidas: ${prevVencidas} | Lubrificação vencida: ${lubVencidas}

📊 EQUIPAMENTOS COM MAIS FALHAS (quantidade e problemas):
${topFalhas.join("\n\n") || "Nenhuma falha registrada"}

📋 DETALHES DAS OS:
${detalhesOS || "Nenhuma OS registrada"}

⚠️ FMEA (maiores RPNs):
${fmeaContext || "Nenhum FMEA"}

📅 EQUIPAMENTOS CRÍTICOS:
${equipamentos.filter((e: any) => e.criticidade === "A").map((e: any) => `${e.tag} - ${e.nome} (Risco: ${e.nivel_risco})`).join("\n") || "Nenhum"}

Faça a análise completa conforme instruído.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      await logSystem("ERROR", "IA_ANALISE_GATEWAY_ERROR", "Falha no gateway de IA.", {
        status: response.status,
        modo,
      });
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analise-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
