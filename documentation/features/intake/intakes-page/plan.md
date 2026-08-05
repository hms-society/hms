---
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 3
status: completed
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2719765/PRD+M+dulo+de+Intake
jira_tickets:
  - SCRUM-133
---

# Plan — Listagem operacional de Intakes

## Objetivo

Entregar a fila operacional autenticada de Intakes em `/intakes`, com busca,
tabs de status, filtros combináveis, paginação, projeções autorizadas,
navegação ao boundary de detalhe e estados de UI acessíveis, preservando as
fronteiras entre Intake e Identidade.

## Escopo

Inclui os requisitos `REQ-01` a `REQ-12`, os critérios `CA-01` a `CA-20`, o
endpoint `GET /intakes`, a autenticação comum, o adapter REST, a rota
web `/intakes`, a rota dinâmica `/intakes/$intakeId`, testes automatizados e a
validação final com navegador real. A divergência de compatibilidade do status
`registered` permanece limitada à consulta e à evidência da feature.

## Fora de escopo

Criação ou edição de Intake, ficha completa do detalhe, Kanban, próxima ação,
alteração do cadastro de Cliente, gestão de agenda, migração de dados e adoção
da query composta como convenção global. Nenhuma migration é prevista: os
readers devem consultar as tabelas existentes sem alterar o modelo persistido.

## Dependências e ordem

```text
F1 contratos core
  ├── F2 readers proprietários + autorização
  │     └── F3 use cases + REST
  │             └── F4 web adapter, rotas e UI
  │                     └── F5 sensores integrados + navegador + Quality Gate
```

As tarefas `RF-04` e `RF-05` são paralelizáveis depois de `F1`, porque possuem
ownership de módulo e paths sem sobreposição. As demais fases dependem dos
contratos e da resposta anterior; não há outro paralelismo real seguro.

## Fases

### F1 — Contratos core e ports públicos

**Dependência:** nenhuma. **Estado:** `completed`.
**Tarefas:** `RF-01`–`RF-03` em `verified`.

| ID | Tarefa e paths | Resultado observável | Rastreabilidade | Parallelizable |
| --- | --- | --- | --- | --- |
| RF-01 | Criar `IntakeListQuery`, `IntakeListRow`, `IntakeListItem`, `IntakeListResult`, `StatusCounts` e projeções de Cliente/responsável em arquivos separados sob `packages/core/src/intake/domain/structures/` e `packages/core/src/identity/domain/structures/`; manter em `packages/core/src/intake/interfaces/` e `packages/core/src/identity/interfaces/` somente os ports e atualizar barrels. | O contrato expressa busca OR entre protocolo/Cliente, filtros AND, paginação, `statusCounts`, seis status públicos e compatibilidade `registered`, sem expor dados integrais de Identidade; a linha do reader é distinguida do item REST já hidratado. | `REQ-03`–`REQ-06`, `REQ-11`, `REQ-12`, `CA-03`, `CA-07`, `CA-08`, `CA-18`, `CA-19` | Não |
| RF-02 | Criar os ports read-only de Identidade em `packages/core/src/identity/interfaces/` para resolver Clientes por nome, ler resumos mascarados e listar opções mínimas de responsáveis; atualizar `packages/core/src/intake/interfaces/intake-service.ts` com `listIntakes` e `listIntakeResponsibles`. | Os contratos permitem composição por IDs, filtro de responsável e endpoint de opções sem importar models ou repositories de outro módulo. | `REQ-04`, `REQ-07`, `REQ-12`, `CA-05`, `CA-09`, `CA-19` | Não |
| RF-03 | Cobrir apenas use cases novos de autorização em testes do core; validar estruturas passivas por `lint`, `check-types` e barrels, respeitando um tipo exportado por arquivo e as regras de naming. | Core compila e os tipos de consulta, projeção, serviço e autorização ficam reutilizáveis por server e web, sem testes unitários artificiais para tipos/interfaces. | `REQ-03`–`REQ-07`, `REQ-11`, `REQ-12`, `CA-05`, `CA-18`, `CA-19` | Não |

**Sensores oficiais da fase:**

- `pnpm --filter @hms/core lint`
- `pnpm --filter @hms/core check-types`
- `pnpm --filter @hms/core test`

**Evidências esperadas:** diff dos contratos/barrels, testes de normalização
de estruturas quando aplicável e logs dos três sensores. Não executar build
nesta fase.

**Evidência F1 — 2026-08-03:** Builder F1 entregou os contratos em
`domain/structures`, ports read-only, extensão de `IntakeService` e
`AuthorizeAttendantUseCase` com teste. Sensores locais passaram:
`pnpm --filter @hms/core lint`, `check-types` e `test` (19 arquivos, 97
testes). `git diff --check` passou.

### F2 — Readers proprietários e autorização de atendente

**Dependência:** `F1`. **Estado:** `completed`.
**Tarefas:** `RF-04`–`RF-07` em `verified`.

| ID | Tarefa e paths | Resultado observável | Rastreabilidade | Parallelizable |
| --- | --- | --- | --- | --- |
| RF-04 | Implementar `DrizzleIntakeListRepository` separado em `apps/server/src/intake/database/drizzle/repositories/`, com token próprio em `apps/server/src/intake/constants/` e registro em `apps/server/src/intake/database/intake-database.module.ts`; não alterar `DrizzleIntakesRepository` nem `IntakesRepository`. | O repository recebe IDs de Cliente resolvidos, pagina por `createdAt DESC, sequenceNumber DESC`, aplica status/filtros/protocolo e retorna `IntakeListRow`/contagens sem ler tabelas de Identidade. | `REQ-03`–`REQ-06`, `REQ-12`, `CA-03`, `CA-04`, `CA-07`, `CA-08`, `CA-18`, `CA-19` | Sim, independente de RF-05 e RF-06 |
| RF-05 | Implementar `DrizzleIntakeClientsRepository` e `DrizzleIntakeResponsiblesRepository` separados em `apps/server/src/identity/database/drizzle/repositories/`, com tokens próprios em `apps/server/src/identity/constants/` e registro em `apps/server/src/identity/database/identity-database.module.ts`; limitar queries a models de Identidade. | A busca resolve clientes por nome, a hidratação em lote devolve nome autorizado/documento mascarado e `listResponsibleOptions` devolve somente opções mínimas de colaboradores ativos, acessíveis à política da listagem. | `REQ-03`, `REQ-04`, `REQ-07`, `REQ-12`, `CA-03`, `CA-05`, `CA-09`, `CA-19` | Sim, independente de RF-04 e RF-06 |
| RF-06 | Criar `AuthorizeAttendantUseCase` e teste em `packages/core/src/identity/use-cases/`; criar `ActiveAttendantGuard` em `apps/server/src/identity/guards/`, registrá-lo/exportá-lo em `apps/server/src/identity/identity.module.ts` e importar `IdentityModule` no `apps/server/src/intake/intake.module.ts`, removendo a wiring ambígua de `AuthModule`. | `AuthGuard` mantém `401`; o use case/guard exige usuário ativo + colaborador ativo + perfil `attendant` e retorna `403` para admin, perfis jurídicos, convidado/desativado e qualquer sessão sem colaborador. O middleware web correspondente compõe `requireAuthMiddleware`, consulta `getCurrentCollaborator` e redireciona ao home. | `REQ-07`, `REQ-11`, `CA-17` | Sim, paths distintos de RF-04/RF-05 |
| RF-07 | Atualizar fixtures de `apps/server/src/intake/fixtures/` e `apps/server/src/identity/fixtures/` para semear Clientes, usuários, colaboradores, opções de responsável e Intakes distinguíveis com infraestrutura real; cobrir o use case de autorização com mocks tipados conforme Rule. | Os cenários de leitura podem validar interseção, máscara, ordenação, opções do filtro e a matriz de autorização sem mocks de repository/banco nos controllers. | `CA-03`, `CA-05`, `CA-07`, `CA-08`, `CA-09`, `CA-17`, `CA-19` | Não; depende de RF-04/RF-05/RF-06 |

**Sensores oficiais da fase:**

- `pnpm --filter @hms/core lint`
- `pnpm --filter @hms/core check-types`
- `pnpm --filter @hms/core test`
- `pnpm --filter server check:code`
- `pnpm --filter server check:types`
- `pnpm --filter server test` com foco nos fixtures/readers e autorização afetados

**Evidências esperadas:** testes de integração com banco/fixtures reais,
prova de queries module-owned, revisão de imports e confirmação de que não foi
gerada migration. Não executar build nesta fase.

**Evidência F2 — 2026-08-03:** RF-04, RF-05 e RF-06 foram entregues
pelos Builders irmãos. Após corrigir os imports de tipo cross-package para
caminhos relativos, `server check:code`, `server check:types` e `server test`
passaram (20 arquivos, 65 testes); os sensores do core permanecem verdes.
RF-07 foi completada com fixtures reais e cenários de repositories/autorização. Após
os dois fixes de fixture, os sensores completos passaram: core lint,
check-types e test (19 arquivos, 97 testes); server check:code, check:types e
test (22 arquivos, 69 testes). Não foi criada migration.

**Finding F2-01 — 2026-08-03:** o teste de autorização com perfil `lawyer`
falha na construção da fixture porque o mapper exige uma referência de área
jurídica existente. Criar `Builder Fix RF-07`, sem alterar produção, para
semear/usar uma área jurídica válida e repetir somente os sensores de F2.

**Finding F2-02 — 2026-08-03:** o novo teste do reader revelou que
`IntakeModuleFixture.createIntake` preserva campos de encerramento aleatórios
quando o status é sobrescrito para `contracted`; o banco rejeita a linha pela
constraint `intakes_closure_fields_check`. Acionar Builder Fix para normalizar
esses campos apenas no fixture e repetir o sensor focado.

### F3 — Use cases e contrato REST

**Dependência:** `F2`. **Estado:** `completed`.
**Tarefas:** `RF-08`–`RF-10` em `verified`.

| ID | Tarefa e paths | Resultado observável | Rastreabilidade | Parallelizable |
| --- | --- | --- | --- | --- |
| RF-08 | Criar `ListIntakesUseCase` e `ListIntakeResponsiblesUseCase` em `packages/core/src/intake/use-cases/`, conectando somente os ports públicos dos módulos. | As consultas de aplicação normalizam defaults, consultam Clientes quando necessário, preservam match por protocolo, buscam a página no reader de Intake e hidratam em lote; `IntakeListRow` é explicitamente a saída ref não hidratada, enquanto `IntakeListItem` é a projeção final, sem N+1, join cruzado ou snapshot persistido. Os use cases possuem testes unitários no core. | `REQ-03`–`REQ-07`, `REQ-11`, `REQ-12`, `CA-03`, `CA-07`–`CA-09`, `CA-18`, `CA-19` | Não |
| RF-09 | Criar `ListIntakesController` e `ListIntakeResponsiblesController`, DTOs e documentação Swagger em `apps/server/src/intake/rest/controllers/` e `apps/server/src/intake/rest/dtos/`; aplicar somente `AuthGuard` nos três endpoints. | `GET /intakes` retorna `PaginationResponse<IntakeListItem>` com `statusCounts`, `200/401`, parâmetros validados e `pageSize` limitado a 100; `GET /intakes/responsibles` fornece opções mínimas ao filtro; o endpoint individual segue a mesma política. | `REQ-01`, `REQ-04`, `REQ-06`, `REQ-07`, `REQ-11`, `CA-01`, `CA-05`, `CA-07`–`CA-09`, `CA-11`, `CA-17`, `CA-18` | Não |
| RF-10 | Fazer wiring em `apps/server/src/intake/intake.module.ts`, atualizar `apps/server/rest-client/intake/intakes.rest` e criar testes de cada controller em `apps/server/src/intake/rest/controllers/tests/`; ajustar cobertura de autenticação. | O contrato HTTP é exercitado via Nest + Supertest + banco real, cobrindo filtros combinados, contagens, opções de responsável, máscara, ordenação, paginação, status inválido e acesso de qualquer usuário autenticado. | `REQ-01`–`REQ-07`, `REQ-11`, `REQ-12`, `CA-01`, `CA-03`–`CA-09`, `CA-17`, `CA-18`, `CA-19` | Não |

**Sensores oficiais da fase:**

- `pnpm --filter server check:code`
- `pnpm --filter server check:types`
- `pnpm --filter server test` com foco em `list-intakes.controller.test.ts` e `get-intake.controller.test.ts`

**Evidências esperadas:** resposta HTTP e payload sanitizado dos testes,
matriz de `401/403/200`, fixture REST real, exemplo `.rest` atualizado e
revisão arquitetural dos imports. Não executar build nesta fase.

**Evidência F3 — 2026-08-03:** use cases do core, controllers, DTOs, wiring,
REST client example e testes HTTP foram integrados. Após três fixes de
composição/exportação, `server check:code`, `server check:types` e `server
test` passaram (24 arquivos, 72 testes); os testes focados de listagem,
responsáveis e detalhe passaram (3 arquivos, 5 testes). Findings F3-01 e
F3-02 foram resolvidos; nenhuma migration foi criada.

**Finding F3-01 — 2026-08-03:** os testes HTTP de F3 não inicializam porque
`ActiveAttendantGuard` não resolve `IDENTITY_REPOSITORIES.collaborators` na
`IntakeModuleFixture`. Acionar Builder Fix para corrigir apenas a composição
da fixture/módulo e completar a cobertura HTTP de `GET /intakes` e
`GET /intakes/responsibles`; repetir os sensores de F3.

**Finding F3-02 — 2026-08-03:** após o primeiro fix, Nest rejeitou a exportação
direta dos tokens de repositório de Intake em `IdentityModule`, pois os
providers pertencem ao `IdentityDatabaseModule`. Corrigir a exportação do módulo
proprietário e repetir os testes HTTP; não exportar token que não está no
provider map local.

### F4 — Adapter, rotas e UI da listagem/detalhe

**Dependência:** `F3`. **Estado:** `completed`.
**Tarefas:** `RF-11`–`RF-16` em `verified`.

| ID | Tarefa e paths | Resultado observável | Rastreabilidade | Parallelizable |
| --- | --- | --- | --- | --- |
| RF-11 | Estender `apps/web/src/rest/services/intake-service.ts` e seus testes para `listIntakes` e `listIntakeResponsibles`; sincronizar `apps/web/src/ui/shared/contexts/rest-context/` se o contrato exigir alteração. | O adapter monta query strings tipadas para os dois endpoints, preserva `RestResponse` e não implementa regras de negócio ou auth própria. | `REQ-01`, `REQ-03`–`REQ-07`, `REQ-11`, `CA-01`, `CA-03`–`CA-09`, `CA-17`, `CA-18` | Não |
| RF-12 | Criar a validação de search params em `apps/web/src/routes/intakes/index.tsx`, atualizar `apps/web/src/routes/intakes/route.tsx` e `apps/web/src/constants/routes.ts`, usando `requireAuthMiddleware`. | URL, request e estado visível usam um único contrato; filtros/status/página inválidos têm fallback determinístico, mudanças resetam página conforme Spec e qualquer sessão autenticada pode consultar a fila. | `REQ-04`, `REQ-05`, `REQ-07`, `REQ-11`, `CA-04`–`CA-06`, `CA-17`, `CA-18` | Não |
| RF-13 | Implementar a composição em `apps/web/src/ui/intake/widgets/pages/intakes-page/` com hooks semânticos, incluindo a consulta das opções de responsável e sincronização `nuqs`, e tokens de `documentation/design.md`; usar shadcn, `Anchor`, `Icon` e acessibilidade para tabela, tabs, popover, calendário, cópia, skeleton, vazio, erro/retry e paginação. | A listagem cobre sucesso, carregamento, vazio inicial, vazio filtrado e erro recuperável; exibe somente colunas do Contract, oferece opções reais de responsável, copia ID sem navegar, preserva Cliente/ID/status em viewport reduzida e comunica estado por texto/semântica. | `REQ-01`–`REQ-10`, `CA-01`–`CA-16` | Não |
| RF-14 | Criar o boundary mínimo em `apps/web/src/routes/intakes/$intakeId.tsx` e `apps/web/src/ui/intake/widgets/pages/intake-details-page/`; atualizar a árvore apenas via gerador. | Link de linha, link principal e `Ver detalhes` chegam a `/intakes/$intakeId`, o parâmetro alcança `GET /intakes/:intakeId` e a página autenticada renderiza apenas o conteúdo mínimo sem prometer a ficha completa. | `REQ-08`, `REQ-09`, `CA-10`–`CA-14`, `CA-17` | Não |
| RF-15 | Criar/atualizar testes de widget e hooks sob `apps/web/src/ui/intake/widgets/pages/intakes-page/tests/` e `apps/web/src/ui/intake/widgets/pages/intake-details-page/tests/`, além dos testes REST adapter, cobrindo a query de responsáveis e erro/retry dessa consulta. | A composição real cobre a matriz de estados, filtros, nuqs/URL, opções de responsável, cópia, teclado e ação de navegação; testes não dependem apenas de hooks mockados. | `CA-01`–`CA-16`, `CA-20` | Não |
| RF-16 | Criar `apps/web/tests/routes/intake/intakes.index.test.tsx` e `apps/web/tests/routes/intake/intakes.$intakeId.test.tsx` como browser integration com transporte mockado stateful. | Cada rota testa middleware real, URL final, request/query, loading/error/retry, autorizado/não autorizado, parâmetro dinâmico, teclado e viewport estreita; a evidência é identificada como transporte mockado. | `REQ-01`–`REQ-11`, `CA-01`–`CA-18`, `CA-20` | Não |

**Sensores oficiais da fase:**

- `pnpm --filter web generate-routes`
- `pnpm --filter web check:code`
- `pnpm --filter web check:types`
- `pnpm --filter web test`
- `pnpm --filter web test:integration tests/routes/intake/intakes.index.test.tsx`
- `pnpm --filter web test:integration 'tests/routes/intake/intakes.$intakeId.test.tsx'`

**Evidências esperadas:** diff gerado de `apps/web/src/routeTree.gen.ts`,
testes focados de adapter/widget/rota, snapshots de acessibilidade e matriz
de estados. Não editar `routeTree.gen.ts` manualmente e não executar build
nesta fase.

**Finding F4-01 — 2026-08-03:** Builder entregou RF-11–RF-14 parcialmente,
mas não concluiu RF-15/RF-16 nem os sensores de F4. Executar checks web reais,
corrigir erros concretos e completar testes de adapter/widget/rotas antes de
marcar a fase verificada.

**Finding F4-02 — 2026-08-03:** `web check:types` falhou em
`intake-date-range-filter` (`initialFocus` não existe no `Calendar`) e em
`intakes-filters` (opção `unknown` usada como `ReactNode`). Acionar Builder Fix
para corrigir os tipos e completar RF-15/RF-16.

**Finding F4-03 — 2026-08-03:** os testes adicionados para RF-15/RF-16 têm
falhas de validação próprias: fixture mockada omite
`statusCounts.compatibility` e Biome aponta formatação/non-null assertions.
Acionar Builder Fix para corrigir somente os testes e repetir os sensores web.

**Finding F4-04 — 2026-08-03:** a integração real do índice falhou em 3/4
casos: clipboard sem permissão no teste, estado de erro/vazio não encontrado;
o redirect sem sessão passou. A integração do detalhe não foi descoberta pelo
comando literal devido ao `$` no nome do arquivo. Acionar Builder Fix para
diagnosticar o transporte/mock e estabilizar as asserções sem remover cobertura.

**Finding F4-05 — 2026-08-03:** a instrumentação revelou que o adapter
serializa `null` como texto (`search=null`, `responsibleId=null`), quebrando o
vazio inicial; o mock de erro também permanece 500 durante retries automáticos.
Corrigir o adapter para omitir nulos e o mock para falhar uma única vez.

**Finding F4-06 — 2026-08-03:** após `retry: false` na listagem, o índice
passou; o detalhe ainda falha apenas no estado de erro porque seu hook mantém
retry automático. Aplicar a mesma configuração ao detalhe e repetir o teste.
O navegador também registrou hydration mismatch no redirect para login; manter
como finding de integração para classificação no Quality Gate.

**Finding F5-01 — 2026-08-03:** no navegador real autenticado como
`attendant@hmsadvogados.com.br`, `Limpar filtros` não removeu `search=INT-`
nem disparou nova consulta. O REST/Auth real respondeu `200` e a página
renderizou; corrigir a limpeza de `nuqs` antes do Quality Gate.

**Evidência F5 parcial — 2026-08-03:** Docker/Auth/server preflight passou;
Nest iniciou sem `UnknownDependenciesException` e `/health` retornou 200.
Atendente seed autenticou e `/intakes` real renderizou; REST real retornou
200 sem 4xx/5xx. Após F5-02, a limpeza confirmou navegação para `/intakes` sem
filtro. Console registrou apenas hydration mismatch existente no shell/home.

**Evidência F4 — 2026-08-03:** `generate-routes` passou; `web check:code`
passou com seis warnings preexistentes; `web check:types` passou; suíte web
passou (29 arquivos, 123 testes); integração do índice passou 4/4; integração
do detalhe passou 4/4 quando executada com `$intakeId` escapado. RF-15/RF-16
estão cobertas por testes unitários, stateful route integration, teclado e
viewport estreita. O único finding de navegador é hydration mismatch no
redirect para login, observado também fora da feature.

### F5 — Integração, navegador real e Quality Gate

**Dependência:** `F1`–`F4` aceitas. **Estado:** `completed`.
**Tarefas:** `RF-17`–`RF-19` em `verified`.

| ID | Tarefa e paths | Resultado observável | Rastreabilidade | Parallelizable |
| --- | --- | --- | --- | --- |
| RF-17 | Executar preflight antes do navegador: `docker compose ps -a`, `curl http://localhost:8000/auth/v1/health`, `curl http://localhost:3333/health`; iniciar `pnpm --filter server dev` e `pnpm --filter web dev` em sessões persistentes. | DB/Auth saudáveis e Nest bootstrap sem `UnknownDependenciesException`; credencial seed é conferida em `apps/server/src/identity/database/identity-seeder.ts` e no env, sem persistir segredo no repositório. | `CA-01`, `CA-03`–`CA-11`, `CA-16`, `CA-17`, `CA-20` | Não |
| RF-18 | Validar com Playwright MCP a autenticação real e `/intakes`: snapshot novo após cada navegação/interação, busca, tab, combinação/limpeza, paginação, cópia, detalhe, teclado e viewport reduzida; inspecionar console e requests ao final. | O navegador real confirma dados REST/Auth reais e cada erro, warning de hidratação, 4xx/5xx ou refresh é classificado como corrigido, preexistente ou bloqueante. | `REQ-01`–`REQ-11`, `CA-01`–`CA-18`, `CA-20` | Não |
| RF-19 | Executar `pnpm format`; depois o Quality Gate com `pnpm --filter @hms/core lint`, `pnpm --filter @hms/core check-types`, `pnpm --filter @hms/core test`, `pnpm --filter server check:code`, `pnpm --filter server check:types`, `pnpm --filter server test`, `pnpm --filter web generate-routes`, `pnpm --filter web check:code`, `pnpm --filter web check:types`, `pnpm --filter web test`, `pnpm --filter web test:integration tests/routes/intake/intakes.index.test.tsx` e `pnpm --filter web test:integration 'tests/routes/intake/intakes.$intakeId.test.tsx'`; somente após tudo passar, executar `pnpm build` quando aplicável ao CI. | Todos os sensores aplicáveis passam; a evidência real e o único veredito do `Judge Implementation` ficam em `evaluation.md`. | `REQ-01`–`REQ-12`, `CA-01`–`CA-20` | Não |

**Evidências esperadas:** logs versionados na sessão, preflight de serviços,
resultado do navegador real, inspeção arquitetural final, Quality Gate e build
do CI registrados em `evaluation.md`. Encerrar as sessões Web/Server após a
validação; deixar Docker compartilhado intacto.

## Riscos e findings ativos

| ID | Finding/risco | Estado | Tratamento/next action |
| --- | --- | --- | --- |
| FND-01 | `registered` existe no código, mas não é tab do PRD. | aceito | Manter em `Todos`, mascarar como `Registrado`, expor apenas em `compatibility.registered` e registrar a divergência em `evaluation.md`; não alterar criação nem PRD. |
| FND-02 | A composição de consultas estava em `apps/server/src/shared/queries/**`, fora do módulo Intake. | resolvido | Use cases movidos para `packages/core/src/intake/use-cases/`, com testes unitários no core. |
| FND-03 | Não existia repository público para busca de Cliente e a política de atendente ainda era exclusiva. | resolvido | Repositories read-only foram criados em Identidade; por decisão do usuário, todos os usuários autenticados acessam a listagem e os artefatos exclusivos de atendente foram removidos. |
| FND-07 | O filtro de responsável precisa de opções acessíveis a atendentes, mas a listagem administrativa existente usa `ActiveAdminGuard`. | resolvido no Plan | Criar `listResponsibleOptions` no reader público de Identidade, `GET /intakes/responsibles`, adapter/hook web e testes sob a mesma política de atendente ativo. |
| FND-04 | A rota `/intakes` era introdutória e sem consulta operacional. | resolvido | Listagem, detalhe mínimo, adapter REST e middleware de autenticação foram implementados; `/intakes/novo` permanece preservado. |
| FND-05 | O worktree já contém alteração não relacionada em `.codex/skills/create-pr/SKILL.md`. | monitorado | Não tocar, reverter ou incluir no Plan/commit da feature. |
| FND-06 | A validação com REST/Auth real depende de Docker, seed e sessões persistentes. | resolvido | Preflight, sessões persistentes e navegador real executados; Docker compartilhado deixado intacto. |

**Ajuste de regra — 2026-08-03:** por decisão explícita do usuário, a restrição
de perfil/status de atendente foi removida. Os endpoints e rotas de Intake usam
somente autenticação; os artefatos exclusivos (`ActiveAttendantGuard`,
`AuthorizeAttendantUseCase` e `requireAttendantMiddleware`) foram removidos.

**Evidência final da revisão 3 — 2026-08-03:** core passou com 20 arquivos/91
testes; server passou code/types e a suíte completa com 21 arquivos/60 testes;
web passou code/types, índice 6/6 e detalhe 4/4. O build de server e web também
passou. Os seis warnings web são preexistentes e fora da feature. Não restam
referências aos artefatos removidos.

## Tentativas e estado operacional

- **Tentativa 1 — descoberta:** concluída. Foram lidos `AGENTS.local.md`,
  `documentation/sdd.md`, `documentation/modules.md`, `documentation/tooling.md`,
  `documentation/infrastructure.md`, `documentation/design.md`, o router e as
  Rules de core, código, REST, controllers, banco, provision, UI, routing,
  widgets e use cases; a codebase e os paths reais foram inspecionados.
- **Tentativa 2 — fontes:** concluída. PRD canônico `PRD — Módulo de Intake`
  (Confluence, versão 2, atualizado em 2026-08-02) e Jira `SCRUM-133`
  (Implementar tela de listagem de Intakes) foram lidos. A Spec revisão 2
  mantém rastreabilidade com ambos.
- **Tentativa 3 — implementação:** iniciada em 2026-08-03. F1–F5 e RF-17/RF-19
  estão verificadas; os use cases foram posteriormente movidos para o core e
  revalidados com testes unitários.

**Estado atual:** `completed`, F1–F5 e RF-17–RF-19 verificadas após
`Judge Plan: accepted` e `Judge Implementation: accepted`.

**Próxima ação:** nenhuma para a implementação; entrega pronta para revisão
ou commit/PR quando autorizado.

**Evidência RF-19 — 2026-08-03:** core lint, types e tests passaram (20 arquivos,
91 testes); server code, types e tests passaram (21 arquivos, 60 testes); web
route generation, code, types e tests passaram (29 arquivos, 125 testes);
integração do índice passou 6/6; a integração do detalhe passou 4/4 via
`--grep`, pois o runner não encontrou o nome literal contendo `$intakeId`;
`pnpm build` passou para server e web. Os seis warnings do Biome permanecem
preexistentes e fora da feature.

## Vereditos

### Judge Plan

- **Estado:** `accepted` na tentativa 2
- **Agente:** `judge-plan-agent` (read-only)
- **Escopo:** necessidade do Plan, decomposição, dependências, ownership dos
  paths, fronteiras core/server/web, rastreabilidade REQ/CA e sensores.
- **Implementação iniciada:** não.

#### Tentativa 1 — 2026-08-02

- **Veredito:** `failed`
- **Findings:** `JP-01` autorização/wiring incompletos; `JP-02` opções do
  responsável não planejadas; `JP-03` estruturas passivas em `interfaces`;
  `JP-04` reader transacional/produtor-consumidor ambíguos; `JP-05` comandos
  finais não executáveis por workspace; `JP-06` handoff usa IDs inexistentes.
- **Ação:** corrigir o ledger antes de nova avaliação; sem Builder e sem
  sensores executados.

#### Tentativa 2 — 2026-08-02

- **Veredito:** `accepted`
- **Findings:** nenhum bloqueante; `JP-01` a `JP-06` resolvidos.
- **Confirmações:** autorização core/server/web, opções de responsáveis,
  estruturas versus ports, readers separados, comandos por workspace, build
  somente após o Quality Gate e handoff com IDs `RF-*` existentes.
- **Ação:** Plan pronto para `implement-plan`; não iniciar Builder nesta task de
  criação do Plan.

### Judge Implementation

- **Estado:** `accepted` na tentativa 2
- **Escopo:** entrega integrada contra a Spec revisão 2, Rules, arquitetura,
  testes, sensores, navegador, Quality Gate e segurança proporcional ao risco.

#### Tentativa 1 — 2026-08-03

- **Veredito:** `failed`
- **Findings:** `JI-02` linha sem navegação por clique/teclado; `JI-03`
  imports diretos de `Link`; `JI-04` middleware no parent poderia restringir
  `/intakes/novo`. `JI-01` sobre `.codex/skills/create-pr/SKILL.md` foi
  classificado como falso positivo: o arquivo já estava alterado antes desta
  feature e permaneceu intocado, conforme `FND-05`.
- **Ação:** Builder Fix executado em `apps/web`; tabela, `Anchor` e escopo de
  middleware corrigidos. Integração índice 6/6, detalhe 3/3, web 124 testes,
  build verde e navegador real confirmando `/intakes` e `/intakes/novo`.

#### Tentativa 2 — 2026-08-03

- **Veredito:** `accepted`
- **Findings bloqueantes:** nenhum.
- **Confirmações:** CA-01–CA-20 aceitos; linha operável por clique/teclado,
  navegação interna via `Anchor`, `/intakes/novo` preservado, autorização de
  atendente no índice/detalhe, Quality Gate/build verdes e navegador real
  autenticado aprovado. O hydration mismatch do shell/home e os seis warnings
  Biome permanecem observações preexistentes não bloqueantes.

## Handoff para `implement-plan`

Só liberar este handoff depois de `Judge Plan: accepted`:

1. executar `F1` como `Builder F1`;
2. executar `RF-04`, `RF-05` e `RF-06` em paralelo apenas nos seus paths
   disjuntos; executar `RF-07` depois que os três estiverem aceitos;
3. executar `F3` após os readers, use case e guard aceitos;
4. executar `F4` após o contrato REST integrado;
5. executar `F5` como Quality Gate final e, então, acionar um único
   `Judge Implementation`;
6. persistir evidências e findings em `evaluation.md` e atualizar a Spec para
   `in_progress`/`completed` somente conforme o fluxo SDD.
