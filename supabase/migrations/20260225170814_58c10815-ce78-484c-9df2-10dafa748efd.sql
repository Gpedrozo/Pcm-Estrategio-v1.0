
-- =====================================================
-- BLOCO 6: Reforçar RLS com filtro por empresa_id
-- =====================================================

-- EQUIPAMENTOS
DROP POLICY IF EXISTS "Auth read equipamentos" ON equipamentos;
CREATE POLICY "empresa_read_equipamentos" ON equipamentos
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert equipamentos" ON equipamentos;
CREATE POLICY "empresa_insert_equipamentos" ON equipamentos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update equipamentos" ON equipamentos;
CREATE POLICY "empresa_update_equipamentos" ON equipamentos
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- ORDENS_SERVICO
DROP POLICY IF EXISTS "Auth read os" ON ordens_servico;
CREATE POLICY "empresa_read_os" ON ordens_servico
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert os" ON ordens_servico;
CREATE POLICY "empresa_insert_os" ON ordens_servico
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update os" ON ordens_servico;
CREATE POLICY "empresa_update_os" ON ordens_servico
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- SOLICITACOES
DROP POLICY IF EXISTS "Auth read solicitacoes" ON solicitacoes;
CREATE POLICY "empresa_read_solicitacoes" ON solicitacoes
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert solicitacoes" ON solicitacoes;
CREATE POLICY "empresa_insert_solicitacoes" ON solicitacoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update solicitacoes" ON solicitacoes;
CREATE POLICY "empresa_update_solicitacoes" ON solicitacoes
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- PLANOS_PREVENTIVOS
DROP POLICY IF EXISTS "Auth read planos" ON planos_preventivos;
CREATE POLICY "empresa_read_planos" ON planos_preventivos
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert planos" ON planos_preventivos;
CREATE POLICY "empresa_insert_planos" ON planos_preventivos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update planos" ON planos_preventivos;
CREATE POLICY "empresa_update_planos" ON planos_preventivos
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- LUBRIFICACAO
DROP POLICY IF EXISTS "Auth read lubrificacao" ON lubrificacao;
CREATE POLICY "empresa_read_lubrificacao" ON lubrificacao
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert lubrificacao" ON lubrificacao;
CREATE POLICY "empresa_insert_lubrificacao" ON lubrificacao
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update lubrificacao" ON lubrificacao;
CREATE POLICY "empresa_update_lubrificacao" ON lubrificacao
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- MECANICOS
DROP POLICY IF EXISTS "Auth read mecanicos" ON mecanicos;
CREATE POLICY "empresa_read_mecanicos" ON mecanicos
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert mecanicos" ON mecanicos;
CREATE POLICY "empresa_insert_mecanicos" ON mecanicos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update mecanicos" ON mecanicos;
CREATE POLICY "empresa_update_mecanicos" ON mecanicos
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- MATERIAIS
DROP POLICY IF EXISTS "Auth read materiais" ON materiais;
CREATE POLICY "empresa_read_materiais" ON materiais
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert materiais" ON materiais;
CREATE POLICY "empresa_insert_materiais" ON materiais
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update materiais" ON materiais;
CREATE POLICY "empresa_update_materiais" ON materiais
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- FORNECEDORES
DROP POLICY IF EXISTS "Auth read fornecedores" ON fornecedores;
CREATE POLICY "empresa_read_fornecedores" ON fornecedores
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert fornecedores" ON fornecedores;
CREATE POLICY "empresa_insert_fornecedores" ON fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update fornecedores" ON fornecedores;
CREATE POLICY "empresa_update_fornecedores" ON fornecedores
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- CONTRATOS
DROP POLICY IF EXISTS "Auth read contratos" ON contratos;
CREATE POLICY "empresa_read_contratos" ON contratos
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert contratos" ON contratos;
CREATE POLICY "empresa_insert_contratos" ON contratos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update contratos" ON contratos;
CREATE POLICY "empresa_update_contratos" ON contratos
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- DOCUMENTOS_TECNICOS
DROP POLICY IF EXISTS "Auth read docs" ON documentos_tecnicos;
CREATE POLICY "empresa_read_docs" ON documentos_tecnicos
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert docs" ON documentos_tecnicos;
CREATE POLICY "empresa_insert_docs" ON documentos_tecnicos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update docs" ON documentos_tecnicos;
CREATE POLICY "empresa_update_docs" ON documentos_tecnicos
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- FMEA
DROP POLICY IF EXISTS "Auth read fmea" ON fmea;
CREATE POLICY "empresa_read_fmea" ON fmea
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert fmea" ON fmea;
CREATE POLICY "empresa_insert_fmea" ON fmea
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update fmea" ON fmea;
CREATE POLICY "empresa_update_fmea" ON fmea
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- ANALISE_CAUSA_RAIZ
DROP POLICY IF EXISTS "Auth read rca" ON analise_causa_raiz;
CREATE POLICY "empresa_read_rca" ON analise_causa_raiz
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert rca" ON analise_causa_raiz;
CREATE POLICY "empresa_insert_rca" ON analise_causa_raiz
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update rca" ON analise_causa_raiz;
CREATE POLICY "empresa_update_rca" ON analise_causa_raiz
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- MELHORIAS
DROP POLICY IF EXISTS "Auth read melhorias" ON melhorias;
CREATE POLICY "empresa_read_melhorias" ON melhorias
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert melhorias" ON melhorias;
CREATE POLICY "empresa_insert_melhorias" ON melhorias
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update melhorias" ON melhorias;
CREATE POLICY "empresa_update_melhorias" ON melhorias
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- SSMA_REGISTROS
DROP POLICY IF EXISTS "Auth read ssma" ON ssma_registros;
CREATE POLICY "empresa_read_ssma" ON ssma_registros
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert ssma" ON ssma_registros;
CREATE POLICY "empresa_insert_ssma" ON ssma_registros
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update ssma" ON ssma_registros;
CREATE POLICY "empresa_update_ssma" ON ssma_registros
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- INSPECOES
DROP POLICY IF EXISTS "Auth read inspecoes" ON inspecoes;
CREATE POLICY "empresa_read_inspecoes" ON inspecoes
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert inspecoes" ON inspecoes;
CREATE POLICY "empresa_insert_inspecoes" ON inspecoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update inspecoes" ON inspecoes;
CREATE POLICY "empresa_update_inspecoes" ON inspecoes
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- EXECUCOES_OS
DROP POLICY IF EXISTS "Auth read execucoes" ON execucoes_os;
CREATE POLICY "empresa_read_execucoes" ON execucoes_os
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert execucoes" ON execucoes_os;
CREATE POLICY "empresa_insert_execucoes" ON execucoes_os
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth update execucoes" ON execucoes_os;
CREATE POLICY "empresa_update_execucoes" ON execucoes_os
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- MATERIAIS_UTILIZADOS
DROP POLICY IF EXISTS "Auth read mat_util" ON materiais_utilizados;
CREATE POLICY "empresa_read_mat_util" ON materiais_utilizados
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert mat_util" ON materiais_utilizados;
CREATE POLICY "empresa_insert_mat_util" ON materiais_utilizados
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- MOVIMENTACOES_MATERIAIS
DROP POLICY IF EXISTS "Auth read movimentacoes" ON movimentacoes_materiais;
CREATE POLICY "empresa_read_movimentacoes" ON movimentacoes_materiais
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

DROP POLICY IF EXISTS "Auth insert movimentacoes" ON movimentacoes_materiais;
CREATE POLICY "empresa_insert_movimentacoes" ON movimentacoes_materiais
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() OR has_role(auth.uid(), 'MASTER_TI'));

-- AUDITORIA - filter by empresa_id for read
DROP POLICY IF EXISTS "Admin read auditoria" ON auditoria;
CREATE POLICY "empresa_read_auditoria" ON auditoria
  FOR SELECT TO authenticated
  USING (
    (empresa_id = get_user_empresa_id() AND (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MASTER_TI')))
    OR has_role(auth.uid(), 'MASTER_TI')
  );
