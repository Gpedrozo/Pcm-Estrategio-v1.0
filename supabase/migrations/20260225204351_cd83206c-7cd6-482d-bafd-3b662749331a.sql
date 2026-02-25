
-- Tabela de componentes hierárquicos (árvore estrutural dos equipamentos)
CREATE TABLE public.componentes_equipamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.componentes_equipamento(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'COMPONENTE',
  criticidade TEXT NOT NULL DEFAULT 'C',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  empresa_id UUID REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast tree traversal
CREATE INDEX idx_componentes_parent ON public.componentes_equipamento(parent_id);
CREATE INDEX idx_componentes_equip ON public.componentes_equipamento(equipamento_id);
CREATE INDEX idx_componentes_empresa ON public.componentes_equipamento(empresa_id);

-- RLS
ALTER TABLE public.componentes_equipamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_read_componentes" ON public.componentes_equipamento
  FOR SELECT USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "empresa_insert_componentes" ON public.componentes_equipamento
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "empresa_update_componentes" ON public.componentes_equipamento
  FOR UPDATE USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

CREATE POLICY "admin_delete_componentes" ON public.componentes_equipamento
  FOR DELETE USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI'));

-- Trigger updated_at
CREATE TRIGGER update_componentes_updated_at
  BEFORE UPDATE ON public.componentes_equipamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
