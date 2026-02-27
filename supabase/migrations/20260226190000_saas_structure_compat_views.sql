-- Compatibilidade de nomenclatura para auditorias e integrações SaaS
-- Não remove tabelas existentes; apenas expõe views canônicas esperadas

-- usuarios (a partir de profiles + user_roles)
CREATE OR REPLACE VIEW public.usuarios AS
SELECT
  p.id,
  p.nome,
  p.empresa_id,
  COALESCE(r.role::text, 'USUARIO') AS perfil,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = p.id
    AND (ur.empresa_id = p.empresa_id OR ur.empresa_id IS NULL)
  ORDER BY ur.empresa_id NULLS LAST
  LIMIT 1
) r ON TRUE;

-- componentes (alias direto)
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

-- anexos (a partir de arquivos_equipamento)
CREATE OR REPLACE VIEW public.anexos AS
SELECT
  id,
  equipamento_id,
  nome_arquivo,
  nome_original,
  storage_path,
  tipo,
  tamanho_bytes,
  descricao,
  uploaded_by,
  empresa_id,
  created_at
FROM public.arquivos_equipamento;

-- planos_manutencao (alias operacional de planos_preventivos)
CREATE OR REPLACE VIEW public.planos_manutencao AS
SELECT
  id,
  nome,
  tag,
  equipamento,
  periodicidade,
  proxima_execucao,
  ultima_execucao,
  responsavel,
  checklist,
  ativo,
  empresa_id,
  created_at,
  updated_at
FROM public.planos_preventivos;
