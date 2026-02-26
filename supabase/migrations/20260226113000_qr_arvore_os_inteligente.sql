-- QR + Árvore estrutural + abertura inteligente de O.S.

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS componente text,
  ADD COLUMN IF NOT EXISTS local text,
  ADD COLUMN IF NOT EXISTS fotos jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ordens_servico_tag ON public.ordens_servico(tag);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_componente ON public.ordens_servico(componente);

-- Compatibilidade com nomenclatura solicitada sem duplicar lógica
CREATE OR REPLACE VIEW public.estrutura_componentes AS
SELECT
  id,
  equipamento_id,
  parent_id,
  codigo,
  nome,
  tipo,
  criticidade,
  observacoes,
  ativo,
  ordem,
  empresa_id,
  created_at,
  updated_at
FROM public.componentes_equipamento;

CREATE OR REPLACE VIEW public.componentes AS
SELECT
  id,
  equipamento_id,
  parent_id,
  codigo,
  nome,
  tipo,
  criticidade,
  observacoes,
  ativo,
  ordem,
  empresa_id,
  created_at,
  updated_at
FROM public.componentes_equipamento;

CREATE OR REPLACE VIEW public.ativos AS
SELECT
  id,
  tag,
  nome,
  criticidade,
  nivel_risco,
  localizacao,
  fabricante,
  modelo,
  numero_serie,
  data_instalacao,
  ativo,
  empresa_id,
  created_at,
  updated_at
FROM public.equipamentos;

CREATE OR REPLACE VIEW public.historico_ordens_servico AS
SELECT
  id,
  os_id,
  empresa_id,
  evento,
  status_anterior,
  status_novo,
  usuario,
  detalhes,
  metadata,
  created_at
FROM public.historico_os;
