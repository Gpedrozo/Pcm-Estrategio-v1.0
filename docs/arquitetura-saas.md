# Diretriz Obrigatória de Arquitetura SaaS

Este projeto segue, de forma obrigatória, uma arquitetura SaaS multiempresa.

## Camadas da plataforma

### 1) Site Institucional (camada externa)

Responsável por:

- apresentação da empresa
- apresentação dos sistemas
- portal de acesso
- administração global da plataforma

### 2) Painel Administrativo Global (da plataforma)

Responsável por:

- gerenciar empresas
- gerenciar usuários
- gerenciar permissões
- gerenciar identidade visual por empresa
- controlar acessos globais

Observação: o painel global **não** pertence aos sistemas operacionais.

### 3) Sistemas Operacionais (camada interna)

Exemplos:

- PCM Estratégico
- Gestão de Lubrificação
- Indicadores Industriais
- futuros sistemas

Esses sistemas consomem configurações da plataforma e não devem conter administração global embutida.

## Regras obrigatórias

1. Manter isolamento por `empresa_id` em dados e operações.
2. Não mover administração global para dentro dos sistemas.
3. Não misturar dados entre empresas.
4. Preservar o fluxo de plataforma:

Site/Plataforma → Administração Global → Empresas → Usuários → Sistemas

## Objetivo de produto

A arquitetura deve permanecer preparada para:

- escala multiempresa
- comercialização como SaaS
- expansão com novos sistemas sem quebra estrutural
