-- System logs table for operational observability

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE SET NULL,
  user_id UUID NULL,
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR')),
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_empresa_id ON public.system_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_event ON public.system_logs(event);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_logs_select" ON public.system_logs;
CREATE POLICY "system_logs_select"
ON public.system_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'MASTER_TI')
  OR public.has_role(auth.uid(), 'ADMIN')
  OR empresa_id = public.get_user_empresa_id()
);

DROP POLICY IF EXISTS "system_logs_insert" ON public.system_logs;
CREATE POLICY "system_logs_insert"
ON public.system_logs FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    empresa_id IS NULL
    OR empresa_id = public.get_user_empresa_id()
    OR public.has_role(auth.uid(), 'MASTER_TI')
  )
);

-- Read-only health snapshot for dashboard/endpoint page
CREATE OR REPLACE VIEW public.system_health AS
SELECT
  now() AS checked_at,
  (SELECT count(*)::int FROM public.empresas WHERE ativo = true) AS empresas_ativas,
  (SELECT count(*)::int FROM public.ordens_servico WHERE status <> 'FECHADA') AS os_abertas,
  (SELECT count(*)::int FROM public.system_logs WHERE level = 'ERROR' AND created_at >= now() - interval '24 hours') AS erros_24h;
