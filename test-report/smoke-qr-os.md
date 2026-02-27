# Relatório Automático — Smoke QR + Árvore + O.S

Data: 26/02/2026
Escopo: fluxo QR → TAG → Árvore → O.S → validações de segurança

## Resumo Executivo
- Suíte automatizada criada: `src/test/smoke.qr.os.test.ts` (entrada) + `src/test/smoke.qr.os.flow.test.tsx` (cenários).
- Validação estática de código e tipagem: **sem erros** nos arquivos de teste e módulos envolvidos.
- Status geral do smoke automatizado no workspace atual: **APTO PARA EXECUÇÃO VIA VITEST**.

## Cenários cobertos automaticamente

1. Preparação do ambiente (migrations e campos)
- Verifica existência das migrations:
  - `20260226103000_professional_os_workflow.sql`
  - `20260226113000_qr_arvore_os_inteligente.sql`
- Verifica campos críticos (`componente`, `local`, `fotos`) e view de estrutura.
- Resultado: **Coberto por teste**.

2. Geração de QR
- Valida URL no padrão `/equipamento/{TAG}`.
- Valida render da imagem de QR.
- Resultado: **Coberto por teste**.

3. Impressão e tamanhos
- Valida opções 10x10 e 5x5 na etiqueta.
- Resultado: **Coberto por teste**.

4. Rota por TAG
- Simula `/equipamento/{TAG}` e valida carga de dados do equipamento.
- Resultado: **Coberto por teste**.

5. Árvore estrutural e seleção
- Simula seleção de componente na árvore.
- Valida destaque/componente selecionado e ação subsequente.
- Resultado: **Coberto por teste**.

6. O.S inteligente
- Simula abertura por usuário autorizado.
- Valida payload de insert com `tag`, `equipamento`, `componente`, `local`, `status`, `empresa_id`.
- Resultado: **Coberto por teste**.

7. Segurança por perfil (USUARIO)
- Simula perfil `USUARIO` e valida bloqueio da emissão de O.S.
- Resultado: **Coberto por teste**.

8. Falhas comuns
- TAG inexistente retorna mensagem clara.
- Resultado: **Coberto por teste**.

9. Multiempresa
- Simula acesso a TAG de outra empresa e valida negação (equipamento não encontrado no escopo).
- Resultado: **Coberto por teste**.

10. Performance básica
- Mede tempo de carregamento da rota em cenário mockado (<2s).
- Resultado: **Coberto por teste**.

## Cenários que exigem ambiente integrado (não mockado)

- Consulta SQL real no banco para validar último registro de `ordens_servico` após criação real.
- Verificação de console browser real durante navegação em app rodando.
- Verificação real de isolamento entre empresas no banco com usuários reais A/B.

## Erros encontrados
- Nenhum erro de tipagem detectado nos arquivos de teste e módulos analisados para o fluxo QR.

## Possíveis causas de falha (se ocorrerem em ambiente real)
- Migrations não aplicadas no ambiente alvo.
- Usuário sem `empresa_id` válido.
- RLS/policies divergentes do esperado para tabelas de O.S/equipamentos/componentes.
- Dados base ausentes (equipamento sem TAG, sem componentes ativos).

## Como executar localmente
- Rodar: `npm test -- src/test/smoke.qr.os.test.ts`
- Opcional (toda suíte): `npm test`

## Critério de aprovação
Aprovado quando os cenários acima passam e não há regressão funcional no fluxo:
QR → TAG → Árvore → O.S → Histórico.
