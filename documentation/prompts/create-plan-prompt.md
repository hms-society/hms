---
name: create-plan
description: Criar um Plan SDD como ledger de fases, progresso, evidências e handoff para uma Spec de feature.
---

# Criar Plan

Crie Plan somente quando a Spec `open` possuir fases dependentes, múltiplos
workspaces, migration relevante, risco elevado ou necessidade real de ledger.
Para Spec pequena, use `implement-spec` diretamente.

Antes de escrever o Plan, leia `AGENTS.local.md`, `documentation/sdd.md`,
`documentation/modules.md`, `documentation/tooling.md`,
`documentation/infrastructure.md`, a Spec, o PRD/ticket de origem e as Rules
descobertas por `documentation/rules/rules.md`. Inspecione os paths reais da
codebase. No HMS, considere explicitamente as fronteiras entre
`packages/core`, `apps/server` e `apps/web`; inclua database, Auth, REST,
provision, UI e validação de browser somente quando o escopo os tocar.

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
- fases ordenadas e dependências;
- tarefas com paths, resultado observável e IDs `RF-*`/`CA-*`;
- campo `parallelizable` e motivo quando aplicável;
- sensores e evidências esperados por fase;
- riscos, findings ativos, tentativas, estado e próxima ação;
- sensores e evidências oficiais por fase, usando os comandos de
  `documentation/tooling.md` e reservando build para o Quality Gate final,
  salvo exceção justificada;
- veredito do `Judge Plan` antes de iniciar a implementação;
- um veredito do `Judge Implementation` para a entrega integrada após todas as
  fases e sensores.

Estados de tarefa: `pending`, `implementing`, `validating`, `verified`.
Estados de fase: `pending`, `in_progress`, `awaiting_judgment`, `failed`,
`accepted`.

Somente o Orchestrator atualiza o Plan. Builders implementam; Judges avaliam
read-only. Depois de criar o Plan, acione `judge-plan-agent` como subagente
irmão read-only na task atual. Em `failed`, registre os findings, ajuste o Plan
e execute o Judge novamente; em `accepted`, altere o estado operacional para
`pending`/pronto e roteie para `implement-plan`. O `Judge Plan` não avalia
código e não substitui `Judge Spec` ou `Judge Implementation`. Todos são
subagentes da task atual. Não use nova thread.
