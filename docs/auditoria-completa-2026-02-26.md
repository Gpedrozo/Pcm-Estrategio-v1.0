# Auditoria Completa do Sistema — 26/02/2026

## Escopo analisado
- Arquitetura de rotas e guards: `App.tsx`, `AppLayout.tsx`, `AdminLayout.tsx`, `routeModules.ts`.
- Contextos e segurança de sessão/multiempresa: `AuthContext.tsx`, `EmpresaContext.tsx`, `useEmpresaQuery.ts`, `empresaQueryService.ts`.
- Fluxos críticos de manutenção: `Solicitacoes.tsx`, `NovaOS.tsx`, `FecharOS.tsx`, `Equipamentos.tsx` + módulos de ativos/árvore/manuais.
- Indicadores e performance de dados: `useDashboardData.ts`, `useIndicadores.ts`, serviços de OS/execuções/indicadores.
- Camada Supabase: migrations de segurança/OS/QR e edge function `supabase/functions/analise-ia/index.ts`.
- Qualidade estática: diagnóstico global de erros no workspace.

## Resultado executivo
- Sistema funcional e com boa cobertura de fluxo operacional principal.
- Sem erros de TypeScript nos arquivos de aplicação auditados.
- Foram encontrados **riscos críticos de segurança e confiabilidade** que precisam de correção antes de produção ampla.

---

## Achados por prioridade

### CRÍTICO

1. **Risco de acesso indevido na Edge Function de IA**
   - Arquivo: `supabase/functions/analise-ia/index.ts`
   - A função aceita `empresa_id` no body e usa `SUPABASE_SERVICE_ROLE_KEY` sem validação explícita do usuário/empresa pelo JWT.
   - O frontend envia `Authorization` com a `VITE_SUPABASE_PUBLISHABLE_KEY` (não token de usuário).
   - Impacto: potencial leitura cruzada de dados entre empresas se endpoint for chamado diretamente.
   - Ação recomendada:
     - Exigir JWT de usuário (`Authorization: Bearer <access_token>`).
     - Validar `auth.uid()` e `empresa_id` via `profiles` antes de consultar dados.
     - Ignorar `empresa_id` do cliente e derivar empresa do usuário autenticado.

2. **Uso de `service_role` com consultas amplas sem guard de tenancy dentro da função**
   - Mesmo arquivo da IA.
   - Impacto: bypass de RLS por desenho (service role ignora políticas), exigindo validações manuais obrigatórias.
   - Ação: encapsular todas as consultas com validação de pertença da empresa.

### IMPORTANTE

3. **Cobertura de testes insuficiente**
   - Situação atual: apenas teste exemplo (`src/test/example.test.ts`).
   - Impacto: regressões de rota/permissão e fluxos críticos podem passar despercebidas.
   - Ação: adotar suíte mínima por domínio (rotas, autenticação, fluxo OS, ativos).

4. **Múltiplas páginas com uso extensivo de `any`**
   - Principalmente páginas operacionais/admin.
   - Impacto: reduz segurança de tipos, aumenta risco de erro lógico em runtime.
   - Ação: tipar entidades de tela com `Database['public']['Tables']` e DTOs de formulário.

5. **Métricas de custo/indicadores misturam janela temporal em alguns pontos**
   - `useIndicadores.ts` soma custos de `execucoes` sem recorte de mês, mas rotula como “mês”.
   - Impacto: KPI pode apresentar valor incorreto para tomada de decisão.
   - Ação: filtrar por mês na origem (query) ou no hook antes de agregar.

6. **Confirmações destrutivas com `confirm()` nativo**
   - Em diversos módulos (exclusões/remoções).
   - Impacto: UX inconsistente e maior risco de erro operacional.
   - Ação: padronizar com `AlertDialog` (já existe no stack Radix).

7. **Ações de exclusão física em ativos**
   - `Equipamentos.tsx` com `delete()` direto.
   - Impacto: risco de quebra de histórico e integridade em cenários com vínculos.
   - Ação: preferir soft delete (`ativo=false`) para ativos em produção.

### MELHORIA FUTURA

8. **Paginação e lazy loading**
   - Listagens carregam conjuntos amplos por padrão.
   - Impacto: degradação em bases grandes.
   - Ação: paginação server-side e filtros com índice.

9. **Padronização visual e de componentes em páginas legadas**
   - Há telas com trechos mais monolíticos e variação de padrões.
   - Ação: extrair blocos reutilizáveis e manter design system uniforme.

10. **Documentação de execução técnica**
- README sem procedimentos de QA e homologação detalhados.
- Ação: incluir “Runbook de QA” e smoke tests por módulo.

---

## Auditoria de arquitetura

### Pontos fortes
- Separação clara entre camadas: público, operacional e admin global.
- Guard de rota por módulo/plano em `AppLayout`.
- Multiempresa centralizada por `EmpresaContext` + `useEmpresaQuery`.
- Estrutura de módulos evoluindo para isolamento funcional (ex.: ativos).

### Fragilidades
- Guard crítico de IA está fora do padrão de segurança (edge function).
- Domínio ainda depende de tipagem frouxa em várias telas.
- Testabilidade ainda inicial.

---

## Auditoria de rotas e permissões (resumo)

- Rotas operacionais e admin presentes e coerentes com menu.
- Regra de perfil aplicada:
  - `SOLICITANTE`: acesso restrito a dashboard/solicitações.
  - `USUARIO`: bloqueio de emissão de O.S (`/os/nova`).
- Rota dinâmica `/equipamento/:tag` mapeada ao módulo de cadastros.

Risco observado:
- Permissões de interface estão boas, mas devem sempre ser espelhadas no banco (RLS/policies/funções seguras).

---

## Fluxo de manutenção (simulação)

Fluxo revisado:
1. Solicitação
2. Triagem/aprovação
3. Geração de O.S
4. Execução
5. Fechamento + histórico

Resultado:
- Fluxo está funcional no código e com consistência de campos principais.
- Pontos de atenção: validações de borda e cobertura automática de testes.

---

## Banco de dados e migrações

- Migrations relevantes presentes para segurança, fluxo OS e QR/árvore.
- Índices adicionados em campos críticos de O.S (tag/componente).
- Tabela `historico_os` com RLS e trigger de eventos da O.S.

Riscos:
- Necessidade de revisar periodicamente políticas para novas views/funções.
- Funções com privilégios elevados exigem validações explícitas de tenancy.

---

## Performance

Principais pontos:
- Algumas consultas sem paginação.
- Agregações no frontend em listas grandes.
- Potencial render pesado em páginas monolíticas sem memoização granular.

Ações recomendadas:
- Paginação server-side.
- Pré-agregações no banco para dashboards pesados.
- Split de componentes e memoização seletiva.

---

## BOT interno de verificação (implementado)

Arquivo: `src/test/auditoria.bot.test.ts`

Cobertura inicial do BOT:
- Verifica mapeamento de rotas operacionais para módulos.
- Verifica rotas administrativas para módulo ADMIN.
- Verifica comportamento para rotas desconhecidas.
- Verifica consistência de regras de perfil crítico (`SOLICITANTE`, `USUARIO`).

Execução:
- `npm test`
- ou `npm test -- src/test/auditoria.bot.test.ts`

Próxima evolução do BOT:
- Adicionar smoke de render por rota com providers mockados.
- Adicionar simulação de fluxos críticos (solicitação → O.S → fechamento).
- Adicionar validação de estados vazios/loading em páginas-chave.

---

## Plano recomendado de correção

### Sprint 1 (bloqueadores)
- Corrigir autenticação/tenancy da edge function `analise-ia`.
- Substituir envio de publishable key por access token de usuário.

### Sprint 2 (estabilidade)
- Aumentar cobertura de testes (rotas + fluxos críticos).
- Corrigir KPIs temporais (custos mensais reais).
- Reduzir `any` em módulos críticos.

### Sprint 3 (escala)
- Paginação e otimização de consultas.
- Padronização final de UX em operações destrutivas.

