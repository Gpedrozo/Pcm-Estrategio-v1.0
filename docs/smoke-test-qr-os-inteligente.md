# Smoke test — QR + Árvore + O.S Inteligente

## Objetivo

Validar o fluxo completo:

1. gerar QR do equipamento,
2. abrir página por TAG,
3. navegar/selecionar componente na árvore,
4. abrir O.S com pré-preenchimento,
5. confirmar persistência e regras de perfil.

## Pré-requisitos

- Migrations aplicadas:
  - `supabase/migrations/20260226103000_professional_os_workflow.sql`
  - `supabase/migrations/20260226113000_qr_arvore_os_inteligente.sql`
- Ambiente com usuário de teste por perfil:
  - `ADMIN` (ou perfil autorizado a emitir O.S.)
  - `USUARIO` (não autorizado a emitir O.S.)
- Pelo menos 1 equipamento com `tag` preenchida e árvore de componentes cadastrada.

## Cenário 1 — Geração e impressão de QR

1. Acesse Equipamentos e abra o detalhe de um equipamento com TAG.
2. Vá para a aba **QR**.
3. Gere/visualize o QR e valide se a URL codificada segue padrão `/equipamento/{TAG}`.
4. Teste impressão em:
   - formato 10x10;
   - formato 5x5.

### Esperado (Cenário 2)

- QR exibido sem erro.
- A etiqueta abre para impressão com os dois tamanhos.

## Cenário 2 — Abertura por TAG

1. Abra manualmente a rota `/equipamento/{TAG}` (ou simule scan).
2. Confirme carregamento dos dados do equipamento (nome, tag, contexto).

### Esperado (Cenário 3)

- Página de equipamento carrega sem fallback/erro.
- Dados correspondem ao equipamento da TAG.

## Cenário 3 — Árvore estrutural e seleção de componente

1. Na página por TAG, expanda nós da árvore estrutural.
2. Selecione um componente folha e um componente pai (quando aplicável).

### Esperado (Cenário 4)

- Árvore respeita hierarquia pai/filho.
- Seleção destaca componente escolhido para abertura da O.S.

## Cenário 4 — O.S inteligente (perfil autorizado)

1. Logado como `ADMIN` (ou autorizado), clique em abrir O.S.
2. Verifique campos pré-preenchidos:
   - equipamento/tag,
   - componente,
   - local,
   - data/usuário.
3. Preencha apenas problema/prioridade/foto e salve.

### Esperado (Cenário 5)

- O.S criada com sucesso.
- Registro em `ordens_servico` contém `componente`, `local` e `fotos` quando informado.

## Cenário 5 — Regra de perfil (USUARIO)

1. Logado como `USUARIO`, abra `/equipamento/{TAG}`.
2. Tente emitir O.S pela página.

### Esperado

- A emissão é bloqueada para `USUARIO`.
- Não ocorre criação de O.S indevida.

## Consulta rápida de conferência (SQL)

```sql
select id, equipamento, tag, componente, local, fotos, status, empresa_id, created_at
from ordens_servico
order by created_at desc
limit 20;
```

## Critério de aceite

- Todos os cenários acima passam sem erro de UI e sem violar regra de perfil.
- Dados persistidos corretamente em escopo da empresa.
- Fluxo QR → TAG → Árvore → O.S funcional de ponta a ponta.
