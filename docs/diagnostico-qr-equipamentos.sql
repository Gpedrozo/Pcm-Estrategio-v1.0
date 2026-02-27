-- Diagnóstico de dados para fluxo QR de equipamentos
-- Executar no Supabase SQL Editor do ambiente alvo

-- 1) Estrutura mínima esperada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'equipamentos'
  AND column_name IN ('id', 'tag', 'nome', 'empresa_id')
ORDER BY column_name;

-- 2) Equipamentos com TAG nula ou vazia
SELECT id, nome, tag, empresa_id, created_at
FROM public.equipamentos
WHERE tag IS NULL OR btrim(tag) = ''
ORDER BY created_at DESC;

-- 3) Duplicidade de TAG global
SELECT upper(btrim(tag)) AS tag_normalizada, COUNT(*) AS total
FROM public.equipamentos
GROUP BY upper(btrim(tag))
HAVING COUNT(*) > 1
ORDER BY total DESC, tag_normalizada;

-- 4) Duplicidade por empresa
SELECT empresa_id, upper(btrim(tag)) AS tag_normalizada, COUNT(*) AS total
FROM public.equipamentos
GROUP BY empresa_id, upper(btrim(tag))
HAVING COUNT(*) > 1
ORDER BY empresa_id, total DESC, tag_normalizada;

-- 5) Amostra de equipamentos para validação manual do fluxo
SELECT id, tag, nome, empresa_id, ativo, created_at
FROM public.equipamentos
WHERE tag IS NOT NULL AND btrim(tag) <> ''
ORDER BY created_at DESC
LIMIT 50;

-- 6) Conferência de O.S por TAG (últimos registros)
SELECT id, equipamento, tag, componente, local, fotos, status, empresa_id, created_at
FROM public.ordens_servico
ORDER BY created_at DESC
LIMIT 20;
