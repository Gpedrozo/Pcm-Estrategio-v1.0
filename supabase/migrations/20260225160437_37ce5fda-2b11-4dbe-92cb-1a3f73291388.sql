
-- Tabela de Inspeções
CREATE TABLE public.inspecoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  tipo_inspecao TEXT NOT NULL DEFAULT 'VISUAL',
  responsavel TEXT,
  data_inspecao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  proxima_inspecao TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  observacoes TEXT,
  resultado TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.inspecoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read inspecoes" ON public.inspecoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert inspecoes" ON public.inspecoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update inspecoes" ON public.inspecoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete inspecoes" ON public.inspecoes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));

-- Tabela de Análise de Causa Raiz
CREATE TABLE public.analise_causa_raiz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  descricao_falha TEXT NOT NULL,
  data_falha DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo TEXT NOT NULL DEFAULT '5_PORQUES',
  porque_1 TEXT,
  porque_2 TEXT,
  porque_3 TEXT,
  porque_4 TEXT,
  porque_5 TEXT,
  causa_raiz_identificada TEXT,
  acao_corretiva TEXT,
  responsavel TEXT,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'EM_ANALISE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.analise_causa_raiz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read rca" ON public.analise_causa_raiz FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert rca" ON public.analise_causa_raiz FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update rca" ON public.analise_causa_raiz FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete rca" ON public.analise_causa_raiz FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));

-- Tabela de Melhorias
CREATE TABLE public.melhorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  area TEXT,
  tag TEXT,
  beneficio_esperado TEXT,
  custo_estimado NUMERIC DEFAULT 0,
  responsavel TEXT,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'PROPOSTA',
  prioridade TEXT NOT NULL DEFAULT 'MEDIA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.melhorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read melhorias" ON public.melhorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert melhorias" ON public.melhorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update melhorias" ON public.melhorias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete melhorias" ON public.melhorias FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));

-- Tabela de Documentos Técnicos
CREATE TABLE public.documentos_tecnicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'POP',
  descricao TEXT,
  versao TEXT DEFAULT '1.0',
  tags_associadas TEXT[] DEFAULT '{}',
  responsavel TEXT,
  data_validade DATE,
  status TEXT NOT NULL DEFAULT 'VIGENTE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_tecnicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read docs" ON public.documentos_tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert docs" ON public.documentos_tecnicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update docs" ON public.documentos_tecnicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete docs" ON public.documentos_tecnicos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));

-- Tabela de SSMA
CREATE TABLE public.ssma_registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'INCIDENTE',
  descricao TEXT NOT NULL,
  local TEXT,
  data_ocorrencia DATE NOT NULL DEFAULT CURRENT_DATE,
  gravidade TEXT NOT NULL DEFAULT 'BAIXA',
  acao_tomada TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'ABERTO',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ssma_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read ssma" ON public.ssma_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert ssma" ON public.ssma_registros FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ssma" ON public.ssma_registros FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete ssma" ON public.ssma_registros FOR DELETE TO authenticated USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));

-- Triggers de updated_at
CREATE TRIGGER update_inspecoes_updated_at BEFORE UPDATE ON public.inspecoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rca_updated_at BEFORE UPDATE ON public.analise_causa_raiz FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_melhorias_updated_at BEFORE UPDATE ON public.melhorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_docs_updated_at BEFORE UPDATE ON public.documentos_tecnicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ssma_updated_at BEFORE UPDATE ON public.ssma_registros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
