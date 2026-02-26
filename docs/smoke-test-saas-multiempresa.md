# Smoke Test SaaS Multiempresa

## Pré-requisitos
- Migration aplicada: `20260226003000_master_security_foundation.sql`
- Migration aplicada: `20260226012000_add_solicitante_role.sql`
- Pelo menos 2 empresas ativas com planos distintos
- Usuários de teste:
  - `master.ti` (MASTER_TI)
  - `admin.empresa.a` (ADMIN da empresa A)
  - `usuario.empresa.a` (USUARIO da empresa A)
  - `solicitante.empresa.a` (SOLICITANTE da empresa A)

## Cenários críticos

### 1) Isolamento por empresa
1. Login com `admin.empresa.a`.
2. Em `Equipamentos`, validar que só aparecem registros da empresa A.
3. Tentar acessar dados de empresa B via filtros/URL direta.
4. Resultado esperado: sem vazamento de dados, apenas empresa A.

### 2) Branding por empresa
1. Login em empresa A e anotar logo/nome/cores.
2. Logout e login em empresa B.
3. Resultado esperado: tema e identidade visual mudam conforme empresa.

### 3) Restrição de módulo por plano
1. Associar plano sem módulo de análises para empresa A.
2. Login com `usuario.empresa.a`.
3. Tentar acessar rotas de análises (`/fmea`, `/rca`, `/melhorias`).
4. Resultado esperado: bloqueio com redirecionamento para dashboard.

### 4) Papel SOLICITANTE
1. Definir role `SOLICITANTE` para `solicitante.empresa.a`.
2. Login com esse usuário.
3. Tentar abrir `/os/nova`, `/os/historico`, `/equipamentos`.
4. Resultado esperado: redirecionamento para `/solicitacoes` e bloqueio de acesso.
5. Em `Solicitações`, criar nova solicitação.
6. Resultado esperado: operação permitida e registro salvo.

### 5) Fluxo Solicitação -> O.S
1. Login com `admin.empresa.a`.
2. Em `Solicitações`, aprovar uma solicitação pendente.
3. Na solicitação aprovada, clicar em `Abrir O.S desta solicitação`.
4. Na tela `Emitir O.S`, validar pré-preenchimento dos campos.
5. Criar a O.S.
6. Resultado esperado:
   - O.S criada com sucesso
   - Solicitação atualizada com `os_gerada_id`
   - Status da solicitação alterado para `EM_OS`

### 6) Segurança administrativa
1. Login com `master.ti`.
2. Abrir `Admin > Logs Segurança`.
3. Aplicar filtros por ação, usuário, período e sucesso.
4. Resultado esperado: paginação e filtros funcionando sem erro.

## Critérios de aceite
- Nenhum dado cruza empresas.
- Usuário `SOLICITANTE` não emite O.S.
- Admin consegue converter solicitação aprovada em O.S.
- Logs e permissões admin continuam operacionais.
