---
name: create-plan
description: Criar um Plan SDD como ledger de fases, progresso, evidências e handoff para uma Spec de feature.
---

# Criar Plan

Crie Plan somente quando a Spec `open` possuir fases dependentes, múltiplos
workspaces, migration relevante, risco elevado ou necessidade real de ledger.
Para Spec pequena, use `implement-spec` diretamente.

## Descoberta e propagação de Rules

Antes de escrever o Plan, leia integralmente `AGENTS.md`, `AGENTS.local.md`, o
router de Rules do repositório e cada Rule aplicável aos paths e comportamentos
previstos pela Spec. Registre no Plan uma seção **Rules aplicáveis** com o path
exato de cada Rule, as fases/tarefas que ela governa e as restrições relevantes.

Cada handoff para Builder e para o único Judge Implementation deve repetir as
Rules aplicáveis. Cada agente deve lê-las integralmente e informar quais carregou.
Repita a descoberta dinâmica quando um finding ou mudança de escopo alcançar
novo path, camada ou comportamento.

## Pencil e referências visuais

Quando a Spec possuir fonte Pencil, referência `design/*.pen`, node ID ou critério
visual, declare no Plan o uso obrigatório do Pencil MCP, os nodes, viewport e
evidências esperadas. Use o skill `pencil-design` antes do fluxo Pencil e chame
`mcp__pencil__get_editor_state` com `include_schema: true` antes de qualquer outra
operação quando o schema não for conhecido.

O Pencil é um hard gate. Antes de qualquer Builder iniciar implementação, confirme
que o editor está ativo, respondendo e com o arquivo exato referenciado pela Spec
aberto — neste caso, `design/hms.pen`. Confirme também o schema e os node IDs
necessários. Se o Pencil estiver inativo, falhar, estiver em outro arquivo ou não
permitir confirmar schema/nodes, bloqueie a implementação: não inicie Builders,
não marque fase como `in_progress` e não substitua a evidência por memória,
screenshot antigo, arquivo local ou inferência. Registre a causa e a próxima ação;
somente um novo preflight bem-sucedido libera o trabalho.

Inspecione os nodes citados, registre-os em `evaluation.md` e compare screenshots
com a implementação. Nunca leia, busque ou edite `.pen` por filesystem; não copie
hex, radius, shadow ou font fora dos tokens do repositório. Nodes design-only não
ampliam o escopo nem autorizam simular comportamento sem contrato.

## Browser Use e validação interativa

Quando a entrega envolver UI, rotas, autenticação, REST, responsividade ou
interação, declare o uso do skill `browser-use` com CDP junto ao Playwright MCP.
Exija accessibility tree, `wait_for_load()` após navegação, verificação após cada
ação, screenshots quando layout importar, viewport estreito, teclado, console e
network. Não trate apenas `curl` ou navegação bem-sucedida como evidência de UI.

O Orchestrator cria o Plan na task atual e mantém a relação com a revisão da
Spec:

```yaml
spec: ../spec.md
evaluation: ../evaluation.md
spec_revision: 1
status: pending
prd: <confluence-url, opcional>
jira_tickets:
  - <PROJ-123>
```

O PRD deve ser referenciado pela página do Confluence, nunca por milestone ou
arquivo local criado como fonte de verdade. Preserve todas as chaves Jira da
Spec e mantenha a rastreabilidade entre ticket, requisito, critério de aceite
e tarefa do Plan.

Inclua:

- objetivo, escopo e fora de escopo;
- Rules aplicáveis por fase/tarefa, com paths e restrições relevantes;
- fases ordenadas e dependências;
- tarefas com paths, resultado observável e IDs `RF-*`/`CA-*`;
- campo `parallelizable` e motivo quando aplicável;
- sensores e evidências esperados por fase;
- riscos, findings ativos, tentativas, estado e próxima ação;
- sensores e evidências por fase; o veredito do único Judge Implementation fica
  reservado para a implementação inteira.

## Formato linear obrigatório

Escreva fases e tarefas em formato linear, legível em viewport estreito e sem
tabelas largas. Para cada fase, use o título, dependências e estado. Para cada
tarefa, registre em blocos separados: ID/estado, dependências, paths, resultado
observável, RF/CA e `parallelizable` com o motivo.

Não use tabelas para decompor tarefas, fases, endpoints, riscos ou handoffs.
Use listas ou blocos lineares. Tabelas só são permitidas para matrizes compactas
quando forem materialmente mais claras e não exigirem colunas extensas ou quebra
excessiva de paths e resultados.

Cada handoff deve repetir linearmente tarefa, paths, Rules, dependências, sensores
e evidências esperadas; não remeta o agente a uma linha de tabela como único
contexto operacional.

Estados de tarefa: `pending`, `implementing`, `validating`, `verified`.
Estados de fase: `pending`, `in_progress`, `awaiting_judgment`, `failed`,
`accepted`.

Somente o Orchestrator atualiza o Plan. Builders implementam; Judges avaliam
read-only. Todos são subagentes da task atual. Não use nova thread.
