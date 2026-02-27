# Auditoria Completa do Sistema — 26/02/2026

## Escopo analisado

- Arquitetura de rotas e guards: `App.tsx`, `AppLayout.tsx`, `AdminLayout.tsx`, `routeModules.ts`.
- Contextos e segurança de sessão/multiempresa: `AuthContext.tsx`, `EmpresaContext.tsx`, `useEmpresaQuery.ts`, `empresaQueryService.ts`.
- Fluxos críticos: `Solicitacoes.tsx`, `NovaOS.tsx`, `FecharOS.tsx`, `Equipamentos.tsx`, QR/árvore/O.S.
- Camada Supabase: migrations, RLS e edge function `supabase/functions/analise-ia/index.ts`.
- Qualidade estática: diagnóstico global de erros no workspace.

## Resultado executivo

- Base operacional está funcional para fluxo principal do produto.
- Foram identificados riscos de segurança/consistência e aplicada correção nos pontos críticos.
- Pendências restantes concentram-se em melhoria contínua (tipagem ampla e padronização de páginas legadas).

---

## Achados por prioridade

### Crítico

1. **Tenancy em funções privilegiadas**
   - Funções com privilégios elevados exigem validação explícita de empresa/usuário.
   - Correção aplicada no fluxo sensível e reforço de guardas no frontend.

2. **Fluxo de QR desacoplado da UI em refatoração anterior**
   - Componentes de QR existiam, mas não estavam acessíveis no diálogo principal.
   - Correção aplicada com reintegração da aba QR no fluxo de visualização.

### Importante

1. **Tipagem frouxa em módulos operacionais**
   - Uso extensivo de `any` em páginas antigas aumenta risco de regressão.
   - Correção parcial aplicada nos módulos críticos de QR/O.S.

2. **Permissões de perfil sem regra explícita para GESTOR em telas críticas**
   - Correção aplicada com bloqueio de rotas administrativas críticas para `GESTOR`.

3. **Importação em massa sem todos os guards de borda**
   - Correção aplicada para listas vazias, validação de TAG e relacionamento de componentes.

### Melhoria futura

1. **Paginação e otimização de consultas em módulos legados**
2. **Refatoração gradual para reduzir `any` nas páginas restantes**
3. **Ampliação de testes de integração com banco real**

---

## Rotas e permissões (resumo)

- Rotas principais auditadas: login, dashboard, equipamentos, QR/tag, árvore, abertura de O.S, histórico e admin.
- Regras críticas validadas:
  - `SOLICITANTE` restrito ao fluxo de solicitações.
  - `USUARIO` sem emissão administrativa de O.S.
  - `GESTOR` sem acesso a configurações críticas administrativas.
  - `ADMIN` e `MASTER_TI` com acesso conforme escopo.

---

## Fluxo QR → Árvore → O.S

1. Equipamento com TAG.
2. Geração e exibição de QR.
3. Abertura por rota `/equipamento/:tag`.
4. Seleção de componente na árvore.
5. Abertura inteligente de O.S com pré-preenchimento.

Resultado atual:

- Fluxo funcional no código com tratamento de erro reforçado.
- Cobertura de teste de smoke adicionada para evitar regressão do fluxo.

---

## Banco de dados (visão técnica)

- Estruturas operacionais existentes e ativas para multiempresa.
- Views de compatibilidade adicionadas para nomenclatura SaaS esperada:
  - `usuarios`
  - `componentes`
  - `anexos`
  - `planos_manutencao`

Arquivo da compatibilidade:

- `supabase/migrations/20260226190000_saas_structure_compat_views.sql`

---

## Plano recomendado de continuidade

### Sprint 1

- Executar migrations novas em homologação e validar RLS/tenancy.
- Rodar smoke completo de rotas críticas com usuários por perfil.

### Sprint 2

- Expandir tipagem forte em páginas legadas com maior tráfego.
- Cobrir CRUD principal com testes de integração.

### Sprint 3

- Consolidar performance (paginação, pré-agregações e memoização seletiva).
- Fechar padronização visual/arquitetural restante.
