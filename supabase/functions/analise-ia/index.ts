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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { empresa_id } = await req.json();
    if (!empresa_id) throw new Error("empresa_id é obrigatório");

    // Fetch comprehensive data for analysis
    const [osRes, equipRes, execRes, prevRes, lubRes, fmeaRes] = await Promise.all([
      supabase.from("ordens_servico").select("*").eq("empresa_id", empresa_id).order("created_at", { ascending: false }).limit(200),
      supabase.from("equipamentos").select("*").eq("empresa_id", empresa_id).eq("ativo", true),
      supabase.from("execucoes_os").select("*").eq("empresa_id", empresa_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("planos_preventivos").select("*").eq("empresa_id", empresa_id).eq("ativo", true),
      supabase.from("lubrificacao").select("*").eq("empresa_id", empresa_id).eq("ativo", true),
      supabase.from("fmea").select("*").eq("empresa_id", empresa_id).limit(50),
    ]);

    const os = osRes.data || [];
    const equipamentos = equipRes.data || [];
    const execucoes = execRes.data || [];
    const preventivas = prevRes.data || [];
    const lubrificacao = lubRes.data || [];
    const fmea = fmeaRes.data || [];

    // Build comprehensive context
    const totalOS = os.length;
    const abertas = os.filter((o: any) => o.status !== "FECHADA").length;
    const corretivas = os.filter((o: any) => o.tipo === "CORRETIVA").length;
    const preventiv = os.filter((o: any) => o.tipo === "PREVENTIVA").length;
    const urgentes = os.filter((o: any) => o.prioridade === "URGENTE").length;
    const criticosA = equipamentos.filter((e: any) => e.criticidade === "A").length;

    // Calculate costs
    const custoTotal = execucoes.reduce((sum: number, e: any) => sum + (Number(e.custo_total) || 0), 0);
    const tempoTotal = execucoes.reduce((sum: number, e: any) => sum + (Number(e.tempo_execucao) || 0), 0);

    // Equipment failure frequency
    const falhasPorTag: Record<string, number> = {};
    os.filter((o: any) => o.tipo === "CORRETIVA").forEach((o: any) => {
      falhasPorTag[o.tag] = (falhasPorTag[o.tag] || 0) + 1;
    });
    const topFalhas = Object.entries(falhasPorTag)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => `${tag}: ${count} corretivas`);

    // Problems summary
    const problemas = os
      .slice(0, 50)
      .map((o: any) => `[${o.tag}|${o.tipo}|${o.prioridade}] ${o.problema}${o.causa_raiz ? ` → Causa: ${o.causa_raiz}` : ""}${o.modo_falha ? ` (Modo: ${o.modo_falha})` : ""}`)
      .join("\n");

    // FMEA context
    const fmeaContext = fmea
      .sort((a: any, b: any) => b.rpn - a.rpn)
      .slice(0, 10)
      .map((f: any) => `[${f.tag}] ${f.modo_falha} - RPN: ${f.rpn} (S:${f.severidade} O:${f.ocorrencia} D:${f.deteccao})`)
      .join("\n");

    // Overdue preventives
    const now = new Date();
    const prevVencidas = preventivas.filter((p: any) => new Date(p.proxima_execucao) < now).length;
    const lubVencidas = lubrificacao.filter((l: any) => new Date(l.proxima_execucao) < now).length;

    const systemPrompt = `Você é um engenheiro especialista em manutenção industrial (PCM - Planejamento e Controle de Manutenção). 
Analise os dados abaixo e forneça uma análise detalhada e estruturada em português brasileiro.

FORMATO OBRIGATÓRIO da resposta:
## 📊 Resumo Executivo
(Panorama geral da manutenção)

## 🔴 Pontos Críticos
(Problemas urgentes que precisam atenção imediata)

## 📈 Indicadores de Performance
- MTBF estimado, MTTR, Disponibilidade
- Taxa corretiva vs preventiva
- Backlog e tendências

## 🔧 Equipamentos com Maior Risco de Falha
(Lista dos equipamentos que mais falham com previsão de próximas falhas)

## 🎯 Recomendações Estratégicas
(Ações concretas priorizadas por impacto)

## 📅 Previsões para os Próximos 30 Dias
(Baseado nos padrões históricos, preveja possíveis falhas e necessidades)

## 💰 Análise de Custos
(Eficiência dos gastos e oportunidades de economia)

Seja específico, cite TAGs dos equipamentos, use números e percentuais. Evite generalizações.`;

    const userPrompt = `DADOS DA EMPRESA PARA ANÁLISE:

📌 RESUMO:
- Total de OS: ${totalOS} (${abertas} abertas, ${corretivas} corretivas, ${preventiv} preventivas)
- OS Urgentes: ${urgentes}
- Equipamentos ativos: ${equipamentos.length} (${criticosA} criticidade A)
- Planos preventivos ativos: ${preventivas.length} (${prevVencidas} vencidos)
- Planos de lubrificação ativos: ${lubrificacao.length} (${lubVencidas} vencidos)
- Custo total de execuções: R$ ${custoTotal.toFixed(2)}
- Tempo total de execução: ${tempoTotal} minutos
- Taxa corretiva: ${totalOS > 0 ? ((corretivas / totalOS) * 100).toFixed(1) : 0}%

📊 TOP EQUIPAMENTOS COM MAIS FALHAS:
${topFalhas.join("\n") || "Nenhuma falha registrada"}

📋 ÚLTIMAS ORDENS DE SERVIÇO (problema, causa, modo de falha):
${problemas || "Nenhuma OS registrada"}

⚠️ ANÁLISE FMEA (maiores RPNs):
${fmeaContext || "Nenhuma análise FMEA registrada"}

📅 EQUIPAMENTOS CRÍTICOS (Criticidade A):
${equipamentos.filter((e: any) => e.criticidade === "A").map((e: any) => `${e.tag} - ${e.nome} (Risco: ${e.nivel_risco})`).join("\n") || "Nenhum equipamento crítico"}

Com base nesses dados, faça uma análise completa e detalhada seguindo o formato especificado.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analise-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
