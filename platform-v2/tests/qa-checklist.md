# QA Checklist - Platform V2

## Fluxos Críticos

- [x] Navegação pública do site (`/site`)
- [x] Login redirecionando para ambiente autenticado
- [x] Alias de acesso via `/app/*`
- [x] API v1 com autenticação e rate limit
- [x] Geração de QR payload por TAG
- [x] Construção de árvore estrutural pai/filho
- [x] Criação de O.S com contexto de tenant
- [x] Isolamento por `empresa_id` no schema SQL v2

## Segurança

- [x] Matriz de permissões por papel
- [x] RLS por tenant
- [x] Logs de uso da API
- [x] Gestão de tokens de integração (create/revoke/rotate)

## Escala

- [x] Índices em entidades críticas
- [x] Endpoints com paginação
- [x] Estrutura pronta para cache e lazy loading
