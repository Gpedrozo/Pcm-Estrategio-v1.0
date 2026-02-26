-- Normalize module names to lowercase_snake_case canonical values
WITH normalized AS (
  SELECT
    id,
    ARRAY(
      SELECT DISTINCT mapped
      FROM (
        SELECT CASE
          WHEN lower(trim(module_name)) = 'dashboard' THEN 'dashboard'

          WHEN lower(trim(module_name)) IN ('ordens_servico','solicitacoes','emitir_os','fechar_os','historico_os','backlog') THEN 'ordens_servico'

          WHEN lower(trim(module_name)) IN ('planejamento','programacao','preventiva','preditiva','inspecoes','lubrificacao') THEN 'planejamento'

          WHEN lower(trim(module_name)) IN ('analises','fmea','rca','melhorias') THEN 'analises'
          WHEN lower(trim(module_name)) IN ('analise_ia','analise-ia') THEN 'analise_ia'

          WHEN lower(trim(module_name)) IN ('cadastros','hierarquia','equipamentos','mecanicos','materiais','fornecedores','contratos','documentos') THEN 'cadastros'

          WHEN lower(trim(module_name)) IN ('relatorios','custos') THEN 'relatorios'

          WHEN lower(trim(module_name)) = 'ssma' THEN 'ssma'

          WHEN lower(trim(module_name)) IN ('admin','usuarios','auditoria') THEN 'admin'

          WHEN lower(trim(module_name)) = 'master_ti' THEN 'master_ti'
          ELSE NULL
        END AS mapped
        FROM unnest(coalesce(modulos_ativos, '{}'::text[])) AS module_name
      ) normalized_values
      WHERE mapped IS NOT NULL
      ORDER BY mapped
    ) AS canonical_modules
  FROM public.planos_saas
)
UPDATE public.planos_saas p
SET modulos_ativos = normalized.canonical_modules
FROM normalized
WHERE p.id = normalized.id;
