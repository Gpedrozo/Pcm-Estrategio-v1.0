-- Professional Maintenance Workflow Foundation

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'classificacao_falha'
  ) THEN
    CREATE TYPE public.classificacao_falha AS ENUM (
      'MECANICA',
      'ELETRICA',
      'AUTOMACAO',
      'OPERACIONAL',
      'LUBRIFICACAO',
      'DESGASTE',
      'OUTRO'
    );
  END IF;
END$$;

ALTER TABLE public.solicitacoes
  ADD COLUMN IF NOT EXISTS data_solicitacao timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS impacto_producao text,
  ADD COLUMN IF NOT EXISTS anexos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS prioridade_triagem prioridade_os,
  ADD COLUMN IF NOT EXISTS tipo_manutencao tipo_os,
  ADD COLUMN IF NOT EXISTS triagem_observacoes text,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS analisado_por text,
  ADD COLUMN IF NOT EXISTS data_analise timestamptz;

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS origem_solicitacao_id uuid REFERENCES public.solicitacoes(id),
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS impacto_producao text,
  ADD COLUMN IF NOT EXISTS responsavel_planejamento text,
  ADD COLUMN IF NOT EXISTS equipe_planejamento text,
  ADD COLUMN IF NOT EXISTS data_programada date,
  ADD COLUMN IF NOT EXISTS duracao_estimada integer,
  ADD COLUMN IF NOT EXISTS pecas_necessarias text,
  ADD COLUMN IF NOT EXISTS ferramentas_necessarias text,
  ADD COLUMN IF NOT EXISTS parada_programada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS causa_falha_classificacao classificacao_falha,
  ADD COLUMN IF NOT EXISTS servico_confirmado boolean,
  ADD COLUMN IF NOT EXISTS funcionamento_validado boolean,
  ADD COLUMN IF NOT EXISTS encerrado_por text,
  ADD COLUMN IF NOT EXISTS encerrado_em timestamptz;

ALTER TABLE public.execucoes_os
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date,
  ADD COLUMN IF NOT EXISTS tecnico_responsavel text,
  ADD COLUMN IF NOT EXISTS equipe text,
  ADD COLUMN IF NOT EXISTS fotos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS tempo_atendimento integer,
  ADD COLUMN IF NOT EXISTS tempo_reparo integer,
  ADD COLUMN IF NOT EXISTS tempo_maquina_parada integer;

CREATE TABLE IF NOT EXISTS public.historico_os (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id),
  evento text NOT NULL,
  status_anterior text,
  status_novo text,
  usuario text,
  detalhes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_os_os_id ON public.historico_os(os_id);
CREATE INDEX IF NOT EXISTS idx_historico_os_empresa ON public.historico_os(empresa_id);
CREATE INDEX IF NOT EXISTS idx_historico_os_created_at ON public.historico_os(created_at DESC);

ALTER TABLE public.historico_os ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'historico_os'
      AND policyname = 'historico_os_empresa_select'
  ) THEN
    CREATE POLICY historico_os_empresa_select
      ON public.historico_os
      FOR SELECT
      USING (empresa_id = public.get_user_empresa_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'historico_os'
      AND policyname = 'historico_os_empresa_insert'
  ) THEN
    CREATE POLICY historico_os_empresa_insert
      ON public.historico_os
      FOR INSERT
      WITH CHECK (empresa_id = public.get_user_empresa_id());
  END IF;
END$$;

CREATE OR REPLACE FUNCTION public.log_ordem_servico_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico_os (os_id, empresa_id, evento, status_novo, usuario, detalhes)
    VALUES (
      NEW.id,
      NEW.empresa_id,
      'OS_CRIADA',
      NEW.status::text,
      NEW.usuario_abertura,
      'Ordem de serviço criada'
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'FECHADA' AND (
      NEW.status IS DISTINCT FROM OLD.status
      OR NEW.problema IS DISTINCT FROM OLD.problema
      OR NEW.prioridade IS DISTINCT FROM OLD.prioridade
      OR NEW.tipo IS DISTINCT FROM OLD.tipo
      OR NEW.equipamento IS DISTINCT FROM OLD.equipamento
      OR NEW.tag IS DISTINCT FROM OLD.tag
      OR NEW.responsavel_planejamento IS DISTINCT FROM OLD.responsavel_planejamento
      OR NEW.data_programada IS DISTINCT FROM OLD.data_programada
    ) THEN
      RAISE EXCEPTION 'O.S fechada não pode ser editada';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.historico_os (os_id, empresa_id, evento, status_anterior, status_novo, usuario, detalhes)
      VALUES (
        NEW.id,
        NEW.empresa_id,
        'STATUS_ALTERADO',
        OLD.status::text,
        NEW.status::text,
        COALESCE(NEW.usuario_fechamento, NEW.usuario_abertura),
        'Status alterado no fluxo de manutenção'
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_ordem_servico_event ON public.ordens_servico;
CREATE TRIGGER trg_log_ordem_servico_event
AFTER INSERT OR UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.log_ordem_servico_event();
