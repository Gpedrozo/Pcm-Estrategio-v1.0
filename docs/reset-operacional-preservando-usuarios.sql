-- RESET OPERACIONAL (manual)
-- Objetivo: limpar dados operacionais mantendo identidade e acesso de usuários.
-- Preserva: auth.users, public.profiles, public.user_roles, public.empresas, public.planos_saas, public.assinaturas
-- Execute manualmente em janela de manutenção.

BEGIN;

-- 1) Limpa relacionamentos operacionais mais dependentes
TRUNCATE TABLE public.materiais_os RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.movimentacoes_materiais RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.execucoes_os RESTART IDENTITY CASCADE;

-- 2) Limpa tabelas de operação
TRUNCATE TABLE public.ordens_servico RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.solicitacoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.planos_preventivos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.analise_causa_raiz RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.fmea RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.ssma_registros RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.arquivos_equipamento RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.componentes_equipamento RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.equipamentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.materiais RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.mecanicos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.fornecedores RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.contratos RESTART IDENTITY CASCADE;

-- 3) Limpa trilhas de segurança e auditoria operacional
TRUNCATE TABLE public.auditoria RESTART IDENTITY CASCADE;

-- Tabelas novas de segurança (se existirem)
DO $$
BEGIN
  IF to_regclass('public.security_logs') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE public.security_logs RESTART IDENTITY CASCADE';
  END IF;
  IF to_regclass('public.rate_limits') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE public.rate_limits RESTART IDENTITY CASCADE';
  END IF;
  IF to_regclass('public.permissoes_granulares') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE public.permissoes_granulares RESTART IDENTITY CASCADE';
  END IF;
  IF to_regclass('public.configuracoes_sistema') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE public.configuracoes_sistema RESTART IDENTITY CASCADE';
  END IF;
END;
$$;

COMMIT;
