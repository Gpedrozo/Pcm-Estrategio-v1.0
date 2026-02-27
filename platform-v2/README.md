# Platform V2

Nova geração da plataforma PCM com arquitetura modular e isolamento multiempresa.

## Estrutura

- `core`: contratos centrais de segurança, tenancy e observabilidade
- `domain`: entidades e regras de negócio
- `modules`: casos de uso por contexto de negócio
- `infrastructure`: integrações externas e persistência
- `api`: contratos e handlers da API pública
- `services`: serviços de aplicação
- `integrations`: conectores com sistemas externos
- `database`: schema e migrações da v2
- `web`: shell da aplicação de usuários
- `admin`: shell administrativo
- `tests`: smoke tests e cenários críticos

## Princípios

1. Nenhuma operação sem `empresa_id`
2. Segurança por padrão (auth, scopes, rate-limit, logs)
3. Camadas desacopladas (domain/application/infrastructure)
4. Compatibilidade com Supabase + React + TypeScript
5. Migração incremental sem quebrar `v1`
