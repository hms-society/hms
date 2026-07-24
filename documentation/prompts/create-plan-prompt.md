---
description: Criar um plano de implementação do HMS a partir de uma spec técnica.
---

# Prompt: Criar Plano

**Objetivo:** decompor uma spec técnica do HMS em fases e tarefas atômicas,
com dependências explícitas, resultados observáveis e validação executável no
monorepo.

## Entrada

- **Spec:** `documentation/features/<modulo>/<feature>/specs/<nome>-spec.md`.
- **Tickets Jira:** os tickets listados no frontmatter da spec (`jira_tickets`),
  que podem ser um ou vários.
- **Contexto opcional:** limite de escopo, prioridade, tickets Jira ou arquivos
  já alterados.

Bug reports não entram diretamente neste fluxo. Derive uma spec de correção a
partir do report antes de criar o plano. Se a spec não for fornecida, estiver
incompleta ou tiver decisões bloqueadoras, registre a pendência e não invente
tarefas.

## Leitura obrigatória

Antes de planejar, leia `AGENTS.local.md` e a spec inteira. Depois consulte,
conforme o escopo:

- `documentation/modules.md` — responsabilidade do módulo;
- `documentation/architecture.md` — fronteiras e fluxos;
- `documentation/infrastructure.md` — stack e integrações aprovadas;
- `documentation/design.md` — se houver UI;
- `documentation/tooling.md` — scripts, filtros pnpm, migrations e arquivos
  gerados;
- `documentation/rules/core-package-rules.md` — se houver mudança em
  `packages/core`.

Leia todos os tickets Jira associados à spec quando houver acesso à integração.
Se houver vários, mantenha a relação entre cada ticket, seus critérios de
aceite e as tarefas do plano. Não misture requisitos conflitantes sem registrar
uma pendência.

Não referencie `studio`, Hono, Next.js, RPC ou regras que não existem no HMS.
O transporte HTTP da aplicação é REST via NestJS, salvo evidência explícita de
um novo padrão aprovado.

## Regras de planejamento

1. Use os workspaces reais: `core` (`packages/core`), `server`
   (`apps/server`) e `web` (`apps/web`). Omita os que não forem tocados.
2. Comece pelo contrato de domínio quando a mudança tiver domínio compartilhado.
   Uma mudança apenas de UI ou infraestrutura pode começar diretamente na fase
   aplicável.
3. Mantenha a ordem: core → persistência/providers → controllers REST → web.
   Fases independentes após o contrato comum podem rodar em paralelo.
4. Cada tarefa implementa ou modifica um artefato ou uma unidade coesa, não uma
   camada inteira.
5. Toda tarefa deve informar dependências, caminhos reais ou novos arquivos,
   resultado observável e workspace/camada.
6. Uma tarefa que cria ou altera comportamento testável deve ser seguida por
   uma tarefa de teste. Testes pertencem ao workspace do artefato e usam Vitest;
   rotas HTTP do server podem usar Supertest e testes de UI podem usar Testing
   Library quando já houver infraestrutura para isso.
7. Não crie tarefas de teste para migrations, mappers, configuração ou detalhes
   internos isolados. Cubra-os pelo use case, controller, rota ou widget que
   expõe o comportamento.
8. Não adicione bibliotecas sem justificar e sem consultar
   `documentation/infrastructure.md`.
9. Se a spec exigir alteração de arquitetura, tooling, design system ou limite
   de módulo, crie uma tarefa documental explícita.

## Camadas permitidas

Use somente os nomes abaixo no campo **Camada**:

- `core` — domínio e contratos em `packages/core`;
- `database` — Drizzle schema, repositories, mappers e migrations;
- `provision` — providers e integrações externas;
- `rest` — controllers, DTOs/schemas e adaptação HTTP NestJS;
- `ui` — widgets, hooks, contexts, stores e componentes web;
- `route` — arquivos de rota do TanStack Router;
- `test` — testes automatizados associados à tarefa;
- `docs` — arquitetura, rules, design ou tooling.

## Testes por tarefa

O plano deve descrever cenários, não apenas “adicionar testes”. Inclua casos
válidos, inválidos, transições, autorização/ownership, estados de UI e erros
relevantes derivados da spec. Use os comandos reais do workspace:

| Workspace | Lint/check-types | Testes |
|---|---|---|
| `packages/core` | `pnpm --filter @hms/core lint` e `pnpm --filter @hms/core check-types` | `pnpm --filter @hms/core test` |
| `apps/server` | `pnpm --filter server lint` e `pnpm --filter server check-types` | `pnpm --filter server test` ou `test:e2e` |
| `apps/web` | `pnpm --filter web lint` e `pnpm --filter web check-types` | `pnpm --filter web test` |

## Saída

Salve o plano ao lado da spec:

`documentation/features/<modulo>/<feature>/plans/<nome>-plan.md`

Preserve os segmentos intermediários entre `documentation/features/` e
`specs/`, trocando apenas `specs` por `plans` e `-spec.md` por `-plan.md`.

Use este formato:

```md
---
description: Plano de implementação da spec <nome> no HMS.
spec: documentation/features/<modulo>/<feature>/specs/<nome>-spec.md
jira_tickets:
  - PROJ-123
  - PROJ-456
status: open
---

## Pendências

- [ ] <pendência, impacto e ação necessária>

## Dependências de fases

| Fase | Objetivo | Depende de | Paralela com |
|---|---|---|---|
| F1 | <objetivo> | - | - |
| F2 | <objetivo> | F1 | F3 |

## F1 — Core: domínio e contratos

### Tarefas

- [ ] **T1.1** — <implementar ou alterar artefato em `packages/core/...`>
  - **Depende de:** -
  - **Resultado observável:** <comportamento verificável>
  - **Camada:** `core`

- [ ] **T1.1t** — <testar o artefato>
  - **Depende de:** T1.1
  - **Resultado observável:** <cenários cobertos>
  - **Camada:** `test`
  - **Workspace:** `@hms/core`

## F2 — Server: persistência e REST

### Tarefas

- [ ] **T2.1** — <migration/repository/provider em `apps/server/...`>
  - **Depende de:** T1.1
  - **Resultado observável:** <resultado verificável>
  - **Camada:** `database`

- [ ] **T2.2** — <controller REST em `apps/server/...`>
  - **Depende de:** T2.1
  - **Resultado observável:** <rota, status e payload esperados>
  - **Camada:** `rest`

- [ ] **T2.2t** — <testar controller/rota>
  - **Depende de:** T2.2
  - **Resultado observável:** <cenários HTTP cobertos>
  - **Camada:** `test`
  - **Workspace:** `server`

## F3 — Web: rota e interface

### Tarefas

- [ ] **T3.1** — <rota/widget/hook em `apps/web/src/...`>
  - **Depende de:** T2.2
  - **Resultado observável:** <estados e interação verificáveis>
  - **Camada:** `ui`

- [ ] **T3.1t** — <testar rota/widget>
  - **Depende de:** T3.1
  - **Resultado observável:** <cenários de comportamento e acessibilidade>
  - **Camada:** `test`
  - **Workspace:** `web`
```

Adapte o template ao escopo real: não crie fases vazias, não force uma fase
`core` quando a spec não toca domínio e não agrupe tarefas independentes apenas
para reduzir a quantidade de IDs.
