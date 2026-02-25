
-- ===== ETAPA 1: TABELA DE EMPRESAS =====
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  logo_url TEXT,
  plano TEXT NOT NULL DEFAULT 'BASICO',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== ETAPA 2: TABELA DE PLANOS SAAS =====
CREATE TABLE public.planos_saas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  modulos_ativos TEXT[] NOT NULL DEFAULT '{}',
  max_usuarios INTEGER NOT NULL DEFAULT 5,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== ETAPA 3: TABELA DE ASSINATURAS =====
CREATE TABLE public.assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos_saas(id),
  status TEXT NOT NULL DEFAULT 'ATIVA',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== ETAPA 4: ADICIONAR empresa_id NAS TABELAS EXISTENTES =====
ALTER TABLE public.profiles ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.user_roles ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.equipamentos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.ordens_servico ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.planos_preventivos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.lubrificacao ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.mecanicos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.materiais ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.fornecedores ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.contratos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.documentos_tecnicos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.solicitacoes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.fmea ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.analise_causa_raiz ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.melhorias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.ssma_registros ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.auditoria ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.execucoes_os ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.materiais_utilizados ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.movimentacoes_materiais ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.inspecoes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- ===== ETAPA 5: RLS NAS NOVAS TABELAS =====
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_saas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Função para obter empresa_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Empresas: usuários veem apenas sua empresa, MASTER_TI vê todas
CREATE POLICY "Users view own empresa" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.get_user_empresa_id() OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Master manage empresas" ON public.empresas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_TI'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_TI'));

-- Planos SaaS: todos autenticados podem ver, só MASTER_TI gerencia
CREATE POLICY "Auth read planos_saas" ON public.planos_saas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Master manage planos_saas" ON public.planos_saas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_TI'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_TI'));

-- Assinaturas: empresa vê suas assinaturas, MASTER_TI vê todas
CREATE POLICY "Users view own assinaturas" ON public.assinaturas
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Master manage assinaturas" ON public.assinaturas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'MASTER_TI'))
  WITH CHECK (public.has_role(auth.uid(), 'MASTER_TI'));

-- ===== ETAPA 6: PLANOS PADRÃO =====
INSERT INTO public.planos_saas (nome, preco, modulos_ativos, max_usuarios) VALUES
  ('Básico', 299, ARRAY['dashboard','equipamentos','ordens_servico'], 5),
  ('Profissional', 599, ARRAY['dashboard','equipamentos','ordens_servico','preventivas','lubrificacao','materiais','relatorios'], 15),
  ('Enterprise', 999, ARRAY['dashboard','equipamentos','ordens_servico','preventivas','lubrificacao','materiais','relatorios','fmea','rca','melhorias','ssma','contratos','preditiva','inspecoes','documentos'], 50);

-- ===== ETAPA 7: TRIGGERS DE UPDATED_AT =====
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planos_saas_updated_at BEFORE UPDATE ON public.planos_saas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assinaturas_updated_at BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
