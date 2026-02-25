
-- ===========================================
-- PCM ESTRATÉGICO - Complete Database Schema
-- ===========================================

-- Enum types
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'USUARIO', 'MASTER_TI');
CREATE TYPE public.tipo_mecanico AS ENUM ('PROPRIO', 'TERCEIRIZADO');
CREATE TYPE public.criticidade_abc AS ENUM ('A', 'B', 'C');
CREATE TYPE public.nivel_risco AS ENUM ('CRITICO', 'ALTO', 'MEDIO', 'BAIXO');
CREATE TYPE public.tipo_os AS ENUM ('CORRETIVA', 'PREVENTIVA', 'PREDITIVA', 'INSPECAO', 'MELHORIA');
CREATE TYPE public.status_os AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_MATERIAL', 'AGUARDANDO_APROVACAO', 'FECHADA');
CREATE TYPE public.prioridade_os AS ENUM ('URGENTE', 'ALTA', 'MEDIA', 'BAIXA');
CREATE TYPE public.periodicidade_plano AS ENUM ('DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Usuário',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'USUARIO',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 3. EQUIPAMENTOS
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  criticidade criticidade_abc NOT NULL DEFAULT 'C',
  nivel_risco nivel_risco NOT NULL DEFAULT 'BAIXO',
  localizacao TEXT,
  fabricante TEXT,
  modelo TEXT,
  numero_serie TEXT,
  data_instalacao DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

-- 4. MECÂNICOS
CREATE TABLE public.mecanicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  tipo tipo_mecanico NOT NULL DEFAULT 'PROPRIO',
  especialidade TEXT,
  custo_hora NUMERIC(10,2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mecanicos ENABLE ROW LEVEL SECURITY;

-- 5. MATERIAIS
CREATE TABLE public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'UN',
  estoque_atual NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  localizacao TEXT,
  tags_associadas TEXT[] DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

-- 6. FORNECEDORES
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  especialidade TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- 7. CONTRATOS
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2),
  data_inicio DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- 8. ORDENS DE SERVIÇO
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os SERIAL,
  tipo tipo_os NOT NULL DEFAULT 'CORRETIVA',
  prioridade prioridade_os NOT NULL DEFAULT 'MEDIA',
  tag TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  solicitante TEXT NOT NULL,
  problema TEXT NOT NULL,
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  status status_os NOT NULL DEFAULT 'ABERTA',
  usuario_abertura_id UUID REFERENCES auth.users(id),
  usuario_abertura TEXT NOT NULL,
  data_fechamento TIMESTAMPTZ,
  usuario_fechamento TEXT,
  tempo_estimado INTEGER,
  custo_estimado NUMERIC(10,2),
  plano_preventivo_id UUID,
  modo_falha TEXT,
  causa_raiz TEXT,
  acao_corretiva TEXT,
  licoes_aprendidas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- 9. EXECUÇÕES DE OS
CREATE TABLE public.execucoes_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  mecanico_id UUID REFERENCES public.mecanicos(id),
  mecanico_nome TEXT NOT NULL,
  hora_inicio TEXT,
  hora_fim TEXT,
  tempo_execucao INTEGER DEFAULT 0,
  servico_executado TEXT,
  custo_mao_obra NUMERIC(10,2) DEFAULT 0,
  custo_materiais NUMERIC(10,2) DEFAULT 0,
  custo_terceiros NUMERIC(10,2) DEFAULT 0,
  custo_total NUMERIC(10,2) DEFAULT 0,
  data_execucao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.execucoes_os ENABLE ROW LEVEL SECURITY;

-- 10. MATERIAIS UTILIZADOS
CREATE TABLE public.materiais_utilizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execucao_id UUID NOT NULL REFERENCES public.execucoes_os(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materiais(id),
  material_nome TEXT NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materiais_utilizados ENABLE ROW LEVEL SECURITY;

-- 11. PLANOS PREVENTIVOS
CREATE TABLE public.planos_preventivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tag TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  periodicidade periodicidade_plano NOT NULL DEFAULT 'MENSAL',
  duracao_estimada INTEGER DEFAULT 60,
  ultima_execucao TIMESTAMPTZ,
  proxima_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  checklist JSONB DEFAULT '[]',
  responsavel TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planos_preventivos ENABLE ROW LEVEL SECURITY;

-- 12. SOLICITAÇÕES
CREATE TABLE public.solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante TEXT NOT NULL,
  tag TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  prioridade prioridade_os NOT NULL DEFAULT 'MEDIA',
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  os_gerada_id UUID REFERENCES public.ordens_servico(id),
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- 13. FMEA
CREATE TABLE public.fmea (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL,
  componente TEXT NOT NULL,
  modo_falha TEXT NOT NULL,
  efeito_falha TEXT NOT NULL,
  causa_potencial TEXT NOT NULL,
  severidade INTEGER NOT NULL DEFAULT 1,
  ocorrencia INTEGER NOT NULL DEFAULT 1,
  deteccao INTEGER NOT NULL DEFAULT 1,
  rpn INTEGER NOT NULL DEFAULT 1,
  acao_recomendada TEXT,
  responsavel TEXT,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fmea ENABLE ROW LEVEL SECURITY;

-- 14. AUDITORIA
CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  usuario_nome TEXT NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- 15. MOVIMENTAÇÃO DE MATERIAIS
CREATE TABLE public.movimentacoes_materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'ENTRADA',
  quantidade NUMERIC(10,2) NOT NULL,
  os_id UUID REFERENCES public.ordens_servico(id),
  usuario TEXT NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movimentacoes_materiais ENABLE ROW LEVEL SECURITY;

-- 16. LUBRIFICAÇÃO
CREATE TABLE public.lubrificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL,
  equipamento TEXT NOT NULL,
  ponto TEXT NOT NULL,
  lubrificante TEXT NOT NULL,
  quantidade TEXT,
  periodicidade periodicidade_plano NOT NULL DEFAULT 'MENSAL',
  ultima_execucao TIMESTAMPTZ,
  proxima_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  responsavel TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lubrificacao ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read equipamentos" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert equipamentos" ON public.equipamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update equipamentos" ON public.equipamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete equipamentos" ON public.equipamentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read mecanicos" ON public.mecanicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert mecanicos" ON public.mecanicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update mecanicos" ON public.mecanicos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete mecanicos" ON public.mecanicos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read materiais" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert materiais" ON public.materiais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update materiais" ON public.materiais FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete materiais" ON public.materiais FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert fornecedores" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update fornecedores" ON public.fornecedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete fornecedores" ON public.fornecedores FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete contratos" ON public.contratos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read os" ON public.ordens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert os" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update os" ON public.ordens_servico FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read execucoes" ON public.execucoes_os FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert execucoes" ON public.execucoes_os FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update execucoes" ON public.execucoes_os FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read mat_util" ON public.materiais_utilizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert mat_util" ON public.materiais_utilizados FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read planos" ON public.planos_preventivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert planos" ON public.planos_preventivos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update planos" ON public.planos_preventivos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete planos" ON public.planos_preventivos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert solicitacoes" ON public.solicitacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update solicitacoes" ON public.solicitacoes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read fmea" ON public.fmea FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert fmea" ON public.fmea FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update fmea" ON public.fmea FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete fmea" ON public.fmea FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth insert auditoria" ON public.auditoria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin read auditoria" ON public.auditoria FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "Auth read movimentacoes" ON public.movimentacoes_materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert movimentacoes" ON public.movimentacoes_materiais FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read lubrificacao" ON public.lubrificacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert lubrificacao" ON public.lubrificacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update lubrificacao" ON public.lubrificacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete lubrificacao" ON public.lubrificacao FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'MASTER_TI'));

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'USUARIO');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mecanicos_updated_at BEFORE UPDATE ON public.mecanicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materiais_updated_at BEFORE UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planos_preventivos_updated_at BEFORE UPDATE ON public.planos_preventivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fmea_updated_at BEFORE UPDATE ON public.fmea FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lubrificacao_updated_at BEFORE UPDATE ON public.lubrificacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
