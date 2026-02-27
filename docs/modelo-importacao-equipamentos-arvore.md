# Modelo de importação em massa — Equipamentos + Árvore

A importação no módulo de Equipamentos agora usa um arquivo Excel com **2 abas**:

- **Equipamentos**
- **Componentes**

Use o botão **Baixar Modelo** na tela de equipamentos para gerar o arquivo padrão.

## Aba `Equipamentos`

Colunas esperadas:

1. `TAG` (obrigatório, único)
2. `Nome do Equipamento` (obrigatório)
3. `Setor/Localização`
4. `Fabricante`
5. `Modelo`
6. `Número de Série`
7. `Data de Instalação (DD/MM/AAAA)`
8. `Criticidade (A/B/C)`
9. `Nível de Risco (CRITICO/ALTO/MEDIO/BAIXO)`

## Aba `Componentes`

Colunas esperadas:

1. `TAG Equipamento` (obrigatório)
2. `Código Componente` (obrigatório)
3. `Nome Componente` (obrigatório)
4. `Código Componente Pai (opcional)`
5. `Tipo (opcional)`
6. `Criticidade (A/B/C opcional)`
7. `Ordem (opcional)`
8. `Observações (opcional)`

## Regras de montagem da árvore

- Componentes sem `Código Componente Pai` entram como **nós raiz**.
- Componentes com `Código Componente Pai` são vinculados ao pai pelo código dentro do mesmo equipamento.
- Se o pai não existir, o componente é rejeitado e registrado como ocorrência.

## Fluxo de uso

1. Abra `Cadastros > Equipamentos`.
2. Clique em **Baixar Modelo**.
3. Preencha as abas `Equipamentos` e `Componentes`.
4. Clique em **Importar Planilha**.
5. Confira o resumo de itens importados/rejeitados.
