-- Fundação de segurança e governança para painel Master TI
-- Compatível com arquitetura SaaS multiempresa

CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT NULL,
  ip_address INET NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_empresa_id ON public.security_logs (empresa_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs (action);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  user_id UUID NULL,
  empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE SET NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (endpoint, user_id, empresa_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits (endpoint, user_id, empresa_id, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits (window_start DESC);

CREATE TABLE IF NOT EXISTS public.permissoes_granulares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  visualizar BOOLEAN NOT NULL DEFAULT true,
  criar BOOLEAN NOT NULL DEFAULT false,
  editar BOOLEAN NOT NULL DEFAULT false,
  excluir BOOLEAN NOT NULL DEFAULT false,
  alterar_status BOOLEAN NOT NULL DEFAULT false,
  imprimir BOOLEAN NOT NULL DEFAULT false,
  exportar BOOLEAN NOT NULL DEFAULT false,
  importar BOOLEAN NOT NULL DEFAULT false,
  acessar_indicadores BOOLEAN NOT NULL DEFAULT false,
  acessar_historico BOOLEAN NOT NULL DEFAULT false,
  ver_valores BOOLEAN NOT NULL DEFAULT false,
  ver_custos BOOLEAN NOT NULL DEFAULT false,
  ver_criticidade BOOLEAN NOT NULL DEFAULT true,
  ver_status BOOLEAN NOT NULL DEFAULT true,
  ver_obs_internas BOOLEAN NOT NULL DEFAULT false,
  ver_dados_financeiros BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, modulo)
);

CREATE INDEX IF NOT EXISTS idx_permissoes_granulares_user_id ON public.permissoes_granulares (user_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_granulares_empresa_id ON public.permissoes_granulares (empresa_id);

CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria TEXT NULL,
  chave TEXT NOT NULL,
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  tipo TEXT NOT NULL DEFAULT 'STRING',
  descricao TEXT NULL,
  editavel BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, chave)
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_sistema_empresa_id ON public.configuracoes_sistema (empresa_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_sistema_categoria ON public.configuracoes_sistema (categoria);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes_granulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_logs_select" ON public.security_logs;
CREATE POLICY "security_logs_select"
ON public.security_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
);

DROP POLICY IF EXISTS "security_logs_insert" ON public.security_logs;
CREATE POLICY "security_logs_insert"
ON public.security_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "security_logs_update" ON public.security_logs;
CREATE POLICY "security_logs_update"
ON public.security_logs FOR UPDATE
USING (public.has_role(auth.uid(), 'MASTER_TI'))
WITH CHECK (public.has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "rate_limits_select" ON public.rate_limits;
CREATE POLICY "rate_limits_select"
ON public.rate_limits FOR SELECT
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
);

DROP POLICY IF EXISTS "rate_limits_insert" ON public.rate_limits;
CREATE POLICY "rate_limits_insert"
ON public.rate_limits FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "rate_limits_update" ON public.rate_limits;
CREATE POLICY "rate_limits_update"
ON public.rate_limits FOR UPDATE
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
)
WITH CHECK (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
);

DROP POLICY IF EXISTS "permissoes_granulares_select" ON public.permissoes_granulares;
CREATE POLICY "permissoes_granulares_select"
ON public.permissoes_granulares FOR SELECT
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "permissoes_granulares_manage" ON public.permissoes_granulares;
CREATE POLICY "permissoes_granulares_manage"
ON public.permissoes_granulares FOR ALL
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
)
WITH CHECK (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
);

DROP POLICY IF EXISTS "configuracoes_sistema_select" ON public.configuracoes_sistema;
CREATE POLICY "configuracoes_sistema_select"
ON public.configuracoes_sistema FOR SELECT
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
  OR empresa_id = public.get_user_empresa_id()
);

DROP POLICY IF EXISTS "configuracoes_sistema_manage" ON public.configuracoes_sistema;
CREATE POLICY "configuracoes_sistema_manage"
ON public.configuracoes_sistema FOR ALL
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
)
WITH CHECK (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 120,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_empresa_id UUID;
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT empresa_id INTO v_empresa_id
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;

  v_window_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.rate_limits (endpoint, user_id, empresa_id, request_count, window_start)
  VALUES (p_endpoint, v_user_id, v_empresa_id, 1, v_window_start)
  ON CONFLICT (endpoint, user_id, empresa_id, window_start)
  DO UPDATE SET
    request_count = public.rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_count;

  IF v_count > p_max_requests THEN
    INSERT INTO public.security_logs (
      user_id,
      empresa_id,
      action,
      resource,
      success,
      error_message,
      metadata
    ) VALUES (
      v_user_id,
      v_empresa_id,
      'RATE_LIMIT_EXCEEDED',
      p_endpoint,
      false,
      'Limite de requisições excedido',
      jsonb_build_object('max_requests', p_max_requests, 'window_seconds', p_window_seconds, 'current_count', v_count)
    );

    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '7 days';
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'registrar_auditoria_automatica'
      AND pg_function_is_visible(oid)
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_auditoria_auto ON public.security_logs';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_auditoria_auto ON public.rate_limits';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_auditoria_auto ON public.permissoes_granulares';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_auditoria_auto ON public.configuracoes_sistema';

    EXECUTE 'CREATE TRIGGER trg_auditoria_auto AFTER INSERT OR UPDATE OR DELETE ON public.security_logs FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica()';
    EXECUTE 'CREATE TRIGGER trg_auditoria_auto AFTER INSERT OR UPDATE OR DELETE ON public.rate_limits FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica()';
    EXECUTE 'CREATE TRIGGER trg_auditoria_auto AFTER INSERT OR UPDATE OR DELETE ON public.permissoes_granulares FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica()';
    EXECUTE 'CREATE TRIGGER trg_auditoria_auto AFTER INSERT OR UPDATE OR DELETE ON public.configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria_automatica()';
  END IF;
END;
$$;
