-- Personalização visual por empresa
-- Permite definir nome do sistema, logo e paleta básica aplicada no frontend

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS nome_sistema TEXT NOT NULL DEFAULT 'PCM ESTRATÉGICO',
  ADD COLUMN IF NOT EXISTS cor_primaria TEXT NOT NULL DEFAULT '213 56% 24%',
  ADD COLUMN IF NOT EXISTS cor_secundaria TEXT NOT NULL DEFAULT '210 14% 89%';
