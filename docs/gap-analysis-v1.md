# Gap Analysis — `pcm-estrategico` (referência) vs `Pcm-Estrategio-v1.0`

## Resumo executivo

Status geral: **parcialmente convergente**.

- Base SaaS multiempresa: **presente**.
- Camada institucional + admin + sistema operacional: **presente**.
- Auditoria automática CRUD: **presente**.
- Branding por empresa: **presente**.
- Segurança avançada (security logs, rate limit, permissões granulares por usuário, configurações globais estruturadas): **implantada nesta etapa (migration)**.
- Módulos avançados do `Master TI` da referência (editor rico e gestão detalhada por aba especializada): **parcial**.

## Matriz de lacunas

| Domínio | Referência | Atual v1.0 | Situação |
|---|---|---|---|
| Master TI (abas avançadas especializadas) | Users/Permissions/Empresa/Logos/Database/Monitor/Settings/Audit/Security/Documents com componentes dedicados | Página única robusta com abas, porém sem todos os componentes avançados dedicados | Parcial |
| Segurança observável | `security_logs`, `rate_limits`, visão de falhas/rate events | Existia placeholder no UI | **Fechado nesta etapa** |
| Permissões granulares por usuário | `permissoes_granulares` e UI dedicada | Ajuste por plano/módulo existente; granular faltante | **Base de dados fechada nesta etapa** |
| Configurações globais | `configuracoes_sistema` | Info estática | **Base de dados fechada nesta etapa** |
| Templates/document engine avançado | `document_layouts`, `document_sequences`, editor de layout | Módulo documental operacional existente | Parcial |
| Preventiva avançada (templates/estrutura detalhada) | Fluxo rico em hooks e templates | Preventiva presente, sem mesma profundidade | Parcial |
| SSMA avançado | Incidentes + permissões de trabalho detalhadas | SSMA presente em formato simplificado | Parcial |
| Funções Edge de health-check | monitoramento externo dedicado | monitoramento interno no painel | Parcial |

## O que foi implantado agora

1. Migration nova: `20260226003000_master_security_foundation.sql`
   - tabelas: `security_logs`, `rate_limits`, `permissoes_granulares`, `configuracoes_sistema`
   - RLS/policies para ADMIN/MASTER_TI
   - funções: `check_rate_limit`, `cleanup_rate_limits`
   - índices e gatilhos de auditoria automática (quando função de auditoria existir)

2. `MasterTI` atualizado
   - remove placeholder de ausência de `security_logs`/`rate_limits`
   - mostra métricas reais de segurança/permissões/configurações

3. Tipagem Supabase atualizada
   - novas tabelas e funções adicionadas em `src/integrations/supabase/types.ts`

## Backlog de implantação (próximas ondas)

### Onda 1 — Admin 10x (dados e governança)
- CRUD visual completo para `permissoes_granulares` no admin global.
- CRUD de `configuracoes_sistema` com categoria/tipo/escopo por empresa.
- Painel de segurança com listagem paginada de `security_logs`.
- Rotina agendada para `cleanup_rate_limits`.

### Onda 2 — Paridade funcional Master TI
- Quebrar `MasterTI` em componentes dedicados (padrão da referência).
- Reintroduzir "Documents" avançado com layouts e sequências (se aprovado no escopo).
- Monitor de saúde com checagem de tempos por tabela/função.

### Onda 3 — Módulos operacionais avançados
- Preventiva: estrutura + templates + execução detalhada.
- SSMA: permissões de trabalho completas e estados de ciclo.
- Relatórios e custos com filtros executivos unificados.

## Critério de aceite sugerido

- Nenhuma rota interna quebrada.
- RLS ativo em todas as novas tabelas.
- Auditoria automática registrando CRUD das novas tabelas.
- Painel admin exibindo métricas reais sem placeholders.
- Tipagem sem erros TS.
