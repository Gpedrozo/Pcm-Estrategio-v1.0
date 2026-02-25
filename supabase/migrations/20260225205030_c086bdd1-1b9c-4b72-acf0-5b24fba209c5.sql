
-- Bucket público para manuais de equipamentos
INSERT INTO storage.buckets (id, name, public) VALUES ('manuais_equipamentos', 'manuais_equipamentos', true);

-- Policies de storage
CREATE POLICY "Authenticated users can upload manuals"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'manuais_equipamentos');

CREATE POLICY "Anyone can read manuals"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'manuais_equipamentos');

CREATE POLICY "Authenticated users can delete own manuals"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'manuais_equipamentos');

-- Tabela de controle para vincular arquivos a equipamentos
CREATE TABLE public.arquivos_equipamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'MANUAL',
  tamanho_bytes BIGINT,
  storage_path TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES public.empresas(id),
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_arquivos_equip ON public.arquivos_equipamento(equipamento_id);
CREATE INDEX idx_arquivos_empresa ON public.arquivos_equipamento(empresa_id);

ALTER TABLE public.arquivos_equipamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_read_arquivos" ON public.arquivos_equipamento
  FOR SELECT USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "empresa_insert_arquivos" ON public.arquivos_equipamento
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "admin_delete_arquivos" ON public.arquivos_equipamento
  FOR DELETE USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));
