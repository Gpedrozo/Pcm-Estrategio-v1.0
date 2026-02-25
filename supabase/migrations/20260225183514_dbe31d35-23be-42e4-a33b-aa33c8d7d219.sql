
CREATE TABLE public.historico_analises_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id),
  modo TEXT NOT NULL DEFAULT 'top-problemas',
  tag TEXT,
  data_inicio DATE,
  data_fim DATE,
  resultado TEXT NOT NULL,
  usuario_id UUID,
  usuario_nome TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.historico_analises_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_read_historico_ia" ON public.historico_analises_ia
  FOR SELECT USING (
    (empresa_id = get_user_empresa_id()) OR has_role(auth.uid(), 'MASTER_TI'::app_role)
  );

CREATE POLICY "empresa_insert_historico_ia" ON public.historico_analises_ia
  FOR INSERT WITH CHECK (
    (empresa_id = get_user_empresa_id()) OR has_role(auth.uid(), 'MASTER_TI'::app_role)
  );

CREATE POLICY "admin_delete_historico_ia" ON public.historico_analises_ia
  FOR DELETE USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'MASTER_TI'::app_role)
  );
