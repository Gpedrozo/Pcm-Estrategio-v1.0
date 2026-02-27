# API V1 - Contrato Operacional

Base: `/api/v1`

- `GET /equipamentos`
- `GET /ordens-servico`
- `GET /execucoes`
- `GET /indicadores`
- `GET /usuarios`
- `GET /empresas`

## Segurança

- JWT (usuário) ou `x-api-token` (integração)
- Rate limit por empresa e endpoint
- Logs de consumo e auditoria
- Escopos mínimos por endpoint
