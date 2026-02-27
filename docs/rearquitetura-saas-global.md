# Rearquitetura SaaS Global — Blueprint Enterprise

## Objetivo

Preparar o sistema para operação multi-tenant de alta escala com segurança, observabilidade e crescimento internacional.

## Camadas implementadas (primeira onda)

### Domain Layer

- `src/core/domain/entities.ts`
- Entidades e tipos canônicos: empresa, usuário, equipamento, componente e O.S.

### Application Layer

- `src/core/application/ports.ts`
- `src/core/application/useCases/getEquipamentoByTag.ts`
- `src/core/application/useCases/gerarQrUrlEquipamento.ts`
- `src/core/application/useCases/abrirOrdemServicoInteligente.ts`
- `src/core/application/saas/planPolicy.ts`

### Infrastructure Layer

- `src/core/infrastructure/tenancy/tenantGuard.ts`
- `src/core/infrastructure/repositories/supabaseEquipamentoRepository.ts`
- `src/core/infrastructure/repositories/supabaseOrdemServicoRepository.ts`
- `src/core/infrastructure/observability/systemLogger.ts`

### Presentation Layer

- `src/core/presentation/useEnterpriseServices.ts`
- `src/core/presentation/i18n/formatters.ts`

## Migração aplicada no fluxo crítico

Fluxo migrado para arquitetura em camadas:

1. TAG via QR
2. Leitura por rota `/equipamento/:tag`
3. Seleção de componente
4. Abertura inteligente de O.S

Arquivos integrados:

- `src/modules/equipamentos/EquipamentoPage.tsx`
- `src/modules/equipamentos/GerarQRCode.tsx`
- `src/modules/equipamentos/AbrirOrdemServico.tsx`

## Multi-tenant profissional (estado atual)

- Tenant obrigatório no fluxo crítico via `requireTenantContext`.
- Repositórios com filtro explícito por `empresa_id`.
- Sem query de O.S crítica diretamente no componente após refatoração.

## Segurança enterprise (estado atual)

- Trilhas de ação crítica em `system_logs` no caso de uso de abertura de O.S.
- Contexto de usuário/empresa validado antes de executar operações críticas.

## Escalabilidade (fundação)

- Contratos de repositório habilitam troca de fonte de dados sem quebrar UI.
- Política de planos e limites pronta para enforcement progressivo por use case.
- Formatação por locale/timezone pronta para expansão internacional.

## Próxima onda recomendada

1. Migrar CRUD operacional legado para use cases/repositories.
2. Aplicar paginação server-side obrigatória em todos os módulos de listagem.
3. Centralizar cache e invalidação por domínio com query keys estáveis.
4. Integrar monitor de erro/performance (Sentry/OpenTelemetry) no frontend e edge functions.
5. Adicionar testes de carga e contratos para casos de uso críticos.
