---
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 7
status: in_progress
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
jira_tickets:
  - SCRUM-134
---

# Plan SDD — Página de modelos de documentos

## Estado operacional

| Campo | Estado |
|---|---|
| Plan | `accepted` |
| Spec | `in_progress`, revisão 7 |
| Fase atual | F4 — Integração, browser e Quality Gate (`in_progress`) |
| Próxima ação | create-pr e aguardar CI |
| Implementação | F1–F3 concluídas; Builder Fix pós-Judge concluído; Quality Gate local e sensor Playwright da feature verdes |
| Judge Plan | `accepted` |
| Judge Implementation | `accepted` na 2ª tentativa; JI-01–JI-04 corrigidos |

O Plan é necessário porque a entrega atravessa os workspaces `@hms/core`,
`@hms/validation`, `server` e `web`, inclui uma migration e seeder, cruza a
fronteira pública do Catálogo Jurídico, exige autorização em duas bordas e
precisa de validação REST, de rota e de navegador real.

Somente o Orchestrator atualiza este ledger. Builders implementam os paths de
sua tarefa; Judges avaliam read-only. Nenhum Builder deve criar subagentes.

## Objetivo

Entregar a leitura administrativa de modelos de documentos para administradores
ativos: persistência da projeção consultável, `GET /document-specifications`,
rota protegida `/modelos-de-documentos`, busca, filtros combináveis, ordenação
estável, paginação, sincronização com a URL, estados de carregamento/vazio/erro
e item **Documentos** na sidebar administrativa existente.

O resultado observável é uma listagem server-side que mostra **Modelo**,
**Aplicação**, **Obrigatoriedade** e **Estado**, resolve nomes jurídicos pelo
contrato público do Catálogo Jurídico e não oferece qualquer mutação.

## Escopo

Inclui:

- contratos, projeções, caso de uso e validação compartilhados;
- tabelas próprias de Produção Documental, associações internas, migration,
  mapper, repository e seeder;
- controller REST, DTOs, decorator de grupo, composição Nest e exemplos `.rest`;
- autorização por `AuthGuard` + `ActiveAdminGuard` no servidor e
  `requireAdminMiddleware` na rota web;
- serviço REST web e dependência no `RestContext`;
- rota, constantes, item de sidebar, widgets da página, URL state e estados de
  consulta;
- testes unitários do caso de uso e testes de schema, integração REST com banco
  real, testes de serviço/hook/widget/layout e integração de rota Playwright;
- validação visual da composição inspirada em `K2Fvp`, sem redesenhar a sidebar.

Fora de escopo:

- `Novo modelo`, cadastro, edição, duplicação funcional e disponibilidade;
- template, editor, variáveis, upload, importação e pré-visualização;
- coluna **Atualizado** ou qualquer mutação; a coluna **Ação** e os controles
  visuais **Editar**/**Duplicar** permanecem no escopo conforme a revisão 7;
- configuração operacional de pacotes, fichas, áreas ou temas;
- alteração estrutural do `AppLayout` ou de sua sidebar;
- atualização automática do Jira ou mutação de Confluence.

## Fontes e evidências de descoberta

### Produto e execução

- PRD canônico: [PRD — Módulo de Produção Documental](https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673), página Confluence `2588673`, versão 6, atualizada em 05/08/2026. A seção 11.2 fixa uma aplicação por modelo, momento único e estados `available`/`unavailable`; a seção 11.4 exige busca, quatro filtros e paginação.
- Ticket: [SCRUM-134](https://plataformahms.atlassian.net/browse/SCRUM-134), “Implementar página de documentos”, história pendente, prioridade Medium. O ticket confirma a leitura administrativa, a busca/filtros/paginação, a ausência da coluna **Atualizado** e o acesso restrito.
- Spec vigente: [`spec.md`](./spec.md), revisão 7, `status: in_progress`.

### Pencil e design

A inspeção obrigatória foi executada pelo Pencil MCP em
`/home/petros/projects/hms/design/hms.pen`, antes da criação deste Plan:

- `get_app_state` com schema e canvas incluídos: documento ativo confirmado;
- `get_screenshot` de `K2Fvp`: frame `Administrador - Modelos de Documentos RF-055`,
  1440×1050, com sidebar, navbar, cabeçalho, busca, quatro selects, tabela e
  paginação;
- `Get("K2Fvp")`: confirmou a hierarquia e o conteúdo visual do frame;
- `GetVariables()`: confirmou os tokens visuais `background`, `foreground`,
  `card`, `primary`, `muted`, `border`, `highlight`, `font-sans` e `font-serif`;
- componentes reutilizáveis identificados: `Y83nV1` (select), `W5bq8`
  (paginação/tabela), `T8deb` (sidebar admin), `FNLdh`/`pvHly` (itens de
  navegação), `SQoVa` (botão primário).
- guidelines carregadas: `Web App`, `Table`, `Code` e `Tailwind`.

Decisões visuais para a implementação:

- manter o eixo e a densidade de `K2Fvp`: título serifado, descrição sans,
  filtros em superfície de card, tabela como região dominante e paginação ao
  final;
- aplicar os tokens semânticos de `documentation/design.md`/`global.css`, com
  `Fraunces` para headings e `Plus Jakarta Sans` para corpo/controles;
- usar texto e ícone para obrigatoriedade/estado, com foco visível e sem
  depender somente de cor;
- manter visualmente a coluna **Ação** com os controles **Editar** e **Duplicar**;
- tratar loading, erro, base vazia, consulta sem resultados, viewport estreito
  e tema escuro como estados de runtime derivados do Contract: o Pencil não
  possui frames canônicos para esses estados;
- validar no browser a hierarquia do conteúdo de `K2Fvp`, comparando desktop,
  viewport estreito, zoom/reflow e tema escuro, sem comparar a aparência da
  sidebar do Pencil.

### Estado atual e findings

- `packages/core/src/document-production` possui entidades/estruturas iniciais,
  mas `DocumentSpecification` ainda não tem `isRequired`, nem há ports, caso de
  uso ou contrato REST.
- Não há módulo, models, migration, seeder, controller ou fixture de Produção
  Documental no servidor.
- O Catálogo Jurídico já oferece `LegalExpertiseCatalogProvider.resolve()` e
  endpoints autenticados de áreas/temas; Produção Documental deve consumir o
  contrato, nunca seus models/repositories.
- `PaginationResponse` já existe em
  `packages/core/src/shared/responses/pagination-response.ts`.
- `AuthGuard`, `ActiveAdminGuard` e `requireAdminMiddleware` já existem e devem
  ser reutilizados.
- `routeTree.gen.ts` é gerado por `pnpm --filter web generate-routes` e deve ser
  regenerado, não editado manualmente.
- O worktree já contém alterações não relacionadas em arquivos de Intake,
  documentação de agentes/prompts/SDD e a pasta de feature não rastreada. Elas
  pertencem ao usuário e não devem ser revertidas nem incorporadas ao escopo;
  este Plan altera apenas `spec.md` para apontar para o Plan e cria `plan.md`.
- Finding resolvido antes da implementação: ações presentes em `K2Fvp` entram
  no design de referência, mas não entram no Contract implementável desta
  revisão.

## Dependências e fronteiras

```text
F1 Core + validation
  └── F2 Persistence + REST + seed
        └── F3 Web adapter + route + UI
              └── F4 Integrated sensors + browser + Quality Gate
```

Produção Documental é dona do modelo, momento, obrigatoriedade, abrangência,
status e associações. O Catálogo Jurídico é dono de nomes, atividade e
compatibilidade de áreas/temas. As associações armazenam somente referências
lógicas; apenas as FKs entre tabelas próprias de Produção Documental são
permitidas.

## Ledger de fases

Estados de fase: `pending`, `in_progress`, `awaiting_judgment`, `failed`,
`accepted`. Estados de tarefa: `pending`, `implementing`, `validating`,
`verified`.

| Fase | Estado | Depende de | Saída de aceite |
|---|---|---|---|
| F1 — Core e validação | `accepted` | Judge Plan aceito | contratos compilam e o caso de uso passa pelos sensores do pacote |
| F2 — Persistência, seed e REST | `accepted` | F1 aceita | banco, seed e `GET` autenticado funcionam com integração HTTP real |
| F3 — Web, rota e experiência | `accepted` | F2 aceita | rota protegida consome API real e estados/URL/sidebar são cobertos |
| F4 — Integração e Quality Gate | `in_progress` | F1–F3 aceitas | browser real e sensores específicos aceitos; gate global pendente por findings classificados |

### F1 — Core e validação

Objetivo: criar a linguagem compartilhada que separa projeção administrativa,
persistência e serviço sem expor conteúdo/variáveis.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F1-T1 — Atualizar domínio e exports | `verified` | `packages/core/src/document-production/domain/entities/document-specification.ts`; `domain/entities/index.ts`; `domain/structures/*`; `interfaces/document-specifications-repository.ts`; `interfaces/document-production-service.ts`; `interfaces/index.ts`; `use-cases/index.ts`; `packages/core/package.json` | `DocumentSpecification` possui `isRequired`; query, item, record, creation, repository e service têm contratos exportados nos subpaths corretos | SR-002, SR-008; CA-03, CA-04, CA-18 | não; todos os consumers dependem deste contrato |
| F1-T2 — Implementar caso de uso | `verified` | `packages/core/src/document-production/use-cases/list-document-specifications-use-case.ts`; `use-cases/index.ts` | normaliza busca/paginação, delega filtros/ordenação ao repository e resolve somente aplicações restritas pelo provider público | SR-003–SR-005, SR-008; CA-05, CA-06, CA-10–CA-12, CA-18 | não; depende de F1-T1 |
| F1-T3 — Criar schema e testes de domínio | `verified` | `packages/validation/src/document-production/schemas/document-specification-list-query-schema.ts`; exports do package; `packages/core/src/document-production/use-cases/tests`; testes de schema | enums, IDs, inteiros, defaults e limites são validados/coagidos na borda; use case cobre busca, filtros, resolução, paginação, estabilidade e página além do total | SR-003–SR-005, SR-008; CA-05, CA-06, CA-09–CA-12, CA-18 | sim após F1-T1; não compartilha paths de produção com F1-T2 |

Sensores oficiais da fase, sem build:

- `pnpm --filter @hms/core lint`;
- `pnpm --filter @hms/core check-types`;
- `pnpm --filter @hms/core test`;
- `pnpm --filter @hms/validation lint`;
- `pnpm --filter @hms/validation check-types`;
- `pnpm --filter @hms/validation test`.

Evidências registradas: F1 alterou somente `packages/core` e `packages/validation`;
`DocumentSpecification` ganhou `isRequired`, a projeção não expõe
`content`/`variables` e a resolução usa somente o contrato público
`LegalExpertiseCatalogProvider`. Sensores executados no workspace principal em
05/08/2026: core lint/check-types/test — 390 arquivos verificados, 21 arquivos
de teste e 93 testes aprovados; validation lint/check-types/test — 44 arquivos
verificados, 3 arquivos de teste e 9 testes aprovados. `git diff --check` também
passou.

### F2 — Persistência, seed e REST

Objetivo: materializar a consulta server-side e expô-la em uma única operação
de leitura protegida.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F2-T1 — Models, migration e repository | `verified` | `apps/server/src/document-production/constants/document-production-repositories.ts`; `database/drizzle/{models,mappers,repositories,types}/**`; `database/document-production-database.module.ts`; `apps/server/src/shared/database/drizzle/schema.ts`; `apps/server/src/shared/database/drizzle/migrations/**` | tabelas principal/área/tema têm constraints, defaults, índices, PK/FK internas e query com `ILIKE`, `EXISTS`, count separado e ordem estável | SR-002, SR-004, SR-005, SR-008; CA-03, CA-06, CA-10–CA-12, CA-18 | não; module/seed/testes dependem dos tokens e models |
| F2-T2 — Seeder e composição de banco | `verified` | `apps/server/src/document-production/database/document-production-seeder.ts`; `apps/server/src/document-production/database/index.ts`; `apps/server/src/document-production/document-production.module.ts`; `apps/server/src/shared/database/seed.ts`; `apps/server/src/document-production/fixtures/document-production-module-fixture.ts` | seed limpa por contrato, recebe IDs reais do `LegalCatalogSeeder`, cria globais/restritos via `addMany` e não hardcode IDs jurídicos; fixture expõe `static register`, compõe `RestFixture`, resolve providers reais e isola/resetta o banco | SR-002, SR-008; CA-03, CA-18 | não; a ordem do seed é uma dependência externa |
| F2-T3 — Controller, DTOs e integração REST | `verified` | `apps/server/src/document-production/decorators/document-production-controller.decorator.ts`; `decorators/index.ts`; `rest/controllers/list-document-specifications.controller.ts`; `rest/controllers/index.ts`; `rest/controllers/tests/list-document-specifications.controller.test.ts`; `rest/dtos/{document-specification-list-item-response,document-specifications-page-response}.dto.ts`; `rest/dtos/index.ts`; `apps/server/src/document-production/document-production.module.ts`; `apps/server/src/app.module.ts`; `apps/server/rest-client/document-production/document-specifications.rest` | `GET /document-specifications` usa DTO Zod, retorna `PaginationResponse`, documenta `200/400/401/403`, usa `AuthGuard` + `ActiveAdminGuard` e passa `query` diretamente ao caso de uso; o teste exerce HTTP, use case manual, repository Drizzle, mapper e banco real | SR-001–SR-005, SR-008; CA-01, CA-02, CA-03, CA-05, CA-06, CA-09–CA-12, CA-18 | não; depende de F2-T1/T2 e compõe AppModule |

Implementação de migration: atualizar o barrel de schema e executar o comando
documentado `pnpm --filter server db:migration:generate`; aplicar em ambiente de
teste com o mecanismo de `DatabaseFixture`/`pnpm --filter server db:migration:apply`
quando apropriado. Não transformar migration em sensor repetido a cada retry.

Sensores oficiais da fase, sem build:

- `pnpm --filter server check:code`;
- `pnpm --filter server check:types`;
- `pnpm --filter server test` (incluindo a fixture Testcontainers da rota);
- revisão arquitetural dos imports do Catálogo Jurídico e das FKs;
- teste REST reproduzível no `.rest` para sucesso, inválidos, `401` e `403`.

Evidências registradas: `pnpm --filter server check:code` e `check:types`
passaram; o teste dedicado REST da feature passou com 4/4 casos, incluindo
seed/migration/fixture, filtros, paginação e `401/403/400`. O repository usa
`ILIKE`, `EXISTS`, count separado e ordenação por nome + identificador; a
produção não importa tabelas do Catálogo Jurídico.

### F3 — Web, rota e experiência

Objetivo: entregar a página administrativa real, conectada ao endpoint e aos
filtros do Catálogo Jurídico, com URL determinística e estados acessíveis.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F3-T1 — Adapter, contexto e rota | `verified` | `apps/web/src/rest/services/document-production-service.ts`; testes do serviço; `apps/web/src/ui/shared/contexts/rest-context/**`; `apps/web/src/constants/routes.ts`; `apps/web/src/routes/modelos-de-documentos/index.tsx`; `apps/web/src/routeTree.gen.ts` | serviço implementa contrato core; RestContext fornece dependência readonly; rota valida/descarta parâmetros inválidos, usa `requireAdminMiddleware`, `ssr: false` e `AppLayout` | SR-001, SR-006, SR-010; CA-01, CA-02, CA-09, CA-13, CA-22 | não; routeTree e contexto são pontos de composição |
| F3-T2 — Sidebar administrativa | `verified` | `apps/web/src/constants/sidebar-items.ts`; `apps/web/src/ui/shared/widgets/layouts/app-layout/tests/**` | **Documentos** aparece somente em `SIDEBAR_ITEMS[Admin]`, usa a rota canônica e mantém ativo exact/nested, expandido/recolhido, sem mudar a estrutura da sidebar | SR-010; CA-22, CA-23 | não; depende da entrada de `ROUTES` criada em F3-T1 |
| F3-T3 — Page hook, query e widgets | `verified` | `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/**`; testes colocados em `tests/`; `apps/web/tests/routes/document-production/**` | tabela, filtros, paginação, busca, estados loading/error/empty-base/empty-filtered/content e retry; mudança de filtro limpa tema e volta à página 1; URL reproduz a consulta | SR-002–SR-007, SR-009; CA-03–CA-08, CA-10, CA-13–CA-21 | não; hook, widgets e testes compartilham o contrato de view |

Decisões de UI para F3-T3:

- a page hook será a dona de estado, query key, handlers, transições de URL e
  coordenação das opções de áreas/temas; componentes serão composição;
- nested widgets terão diretórios próprios com `index.tsx`; lógica não ficará
  em componentes locais;
- usar wrappers HMS `Icon`, `Anchor` e primitives existentes; não importar
  Lucide diretamente nem criar sidebar feature-specific;
- buscar temas somente quando houver área, limpar tema ao alterar/limpar área e
  manter a tabela utilizável quando o catálogo falhar;
- `Atualizado`, `Novo modelo` e controles de disponibilidade não serão
  renderizados; a coluna `Ação` contém os controles visuais `Editar` e
  `Duplicar`, sem handlers de mutação nesta entrega;
- a aplicação restrita exibirá nomes acessíveis completos e resumo visual para
  conjuntos longos; estado/obrigatoriedade terão texto e ícone;
- usar tokens de `documentation/design.md` e preservar light/dark, foco e
  reflow; nenhuma cor, fonte, raio ou sombra nova hardcoded.

Sensores oficiais da fase, sem build:

- `pnpm --filter web generate-routes`;
- `pnpm --filter web check:code`;
- `pnpm --filter web check:types`;
- `pnpm --filter web test`;
- revisão da rota gerada, serviço REST, query keys e contratos de URL;
- `pnpm --filter web test:integration` na F4, com escopo explicitamente
  mockado por `page.route` e rotulado como integração determinística de widget/
  rota, não como E2E real. A configuração atual usa Vite em `127.0.0.1:3100`
  e endpoints fictícios (`hms-api.test`/`supabase.test`); o fluxo com serviços
  reais será separado no Playwright MCP.

Evidências esperadas: testes de serviço para método/path/query, hook tests com
reset de página e dependência tema/área, component tests renderizando o hook
real e composição interna, matriz de estados, testes de sidebar por perfil e
integração de rota com URL, request e conteúdo visível.

### F4 — Integração, browser e Quality Gate

Objetivo: demonstrar a entrega integrada contra o Contract, Rules, arquitetura,
testes e referência visual, então fechar com um único Judge Implementation.

#### Tarefas

| Tarefa | Estado | Paths/evidência | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F4-T1 — Preflight de dependências | `verified` | task/session evidence; não persistir credenciais | Docker/Auth/DB saudáveis, Nest sem `UnknownDependenciesException`, servidor/web estáveis e credencial seed resolvida de `identity-seeder.ts` + env | SR-001, SR-009; CA-01, CA-02, CA-20 | não; bloqueia browser |
| F4-T2 — Fluxo browser autenticado real | `verified` | `apps/web/tests/routes/document-production/**` para o teste mockado; evidência Playwright MCP para o fluxo real; snapshots, requests e console | login fresco, URL protegida, listagem real, busca/filtros/paginação/URL/retry, sidebar, teclado, viewport estreito, zoom/reflow, dark mode e ausência das mutações | SR-001–SR-010; CA-01–CA-23 | não; depende do ambiente real |
| F4-T3 — Sensores integrados e Quality Gate | `verified` | saída dos comandos e `evaluation.md` após implementação | ciclo curto integrado verde; `pnpm build` executado uma vez como gate final; findings classificados e handoff pronto | todos | não |
| F4-T4 — Judge Implementation | `verified` | `plan.md` + evidências + diff final | 1ª tentativa `failed` (JI-01–JI-04); Builder Fix aplicado, sensores invalidados e repetidos; 2ª tentativa `accepted`, sem findings bloqueantes | todos | não; é etapa final read-only |

Há dois sensores de navegador distintos:

1. **Playwright automatizado mockado** — `pnpm --filter web test:integration`,
   usando o `playwright.config.ts` atual (`127.0.0.1:3100`, `page.route` para
   API/Auth quando necessário). A evidência deve ser rotulada como mockada e
   cobre loader, route integration, URL/request e composição determinística;
   não prova autenticação real, bootstrap do Nest ou integração com banco.
2. **Playwright MCP real** — fluxo manual/observacional com Web, Server, Auth e
   banco locais saudáveis, sem `page.route`. Essa é a evidência oficial de
   autenticação real, autorização, REST real, console, network, responsividade,
   tema e comparação visual.

Preflight obrigatório de browser real, conforme `AGENTS.md`:

1. `docker compose ps -a`;
2. `curl http://localhost:8000/auth/v1/health`;
3. `curl http://localhost:3333/health`;
4. iniciar `pnpm --filter server dev` e `pnpm --filter web dev` em sessões
   persistentes e aguardar compilação/restart terminar;
5. confirmar `admin@hmsadvogados.com.br` e `HMS_USER_SEED_PASSWORD` lendo a
   fonte, sem assumir senha;
6. no Playwright MCP, abrir `/login`, capturar snapshot novo, autenticar e
   verificar URL/conteúdo antes de navegar à rota protegida;
7. após cada navegação/interação, capturar snapshot novo; no final, coletar
   console messages e network requests, classificando todo erro, warning,
   `4xx/5xx` inesperado e falha de refresh;
8. parar somente as sessões Web/Server iniciadas pela validação; não derrubar
   serviços Docker compartilhados.

Fluxos mínimos do browser:

- administrador ativo acessa por URL direta e por **Documentos**;
- busca por nome e descrição, cada filtro e combinação de todos os filtros;
- troca/limpeza de área limpa tema e opções dependentes;
- reload/share de URL filtrada e paginada reproduz controles e request;
- base vazia, consulta sem resultado com **Limpar filtros**, falha com
  **Tentar novamente**;
- ausência de **Novo modelo**, ações de disponibilidade e **Atualizado**; presença
  de **Ação**, **Editar** e **Duplicar**;
- perfil não administrador não recebe o item de sidebar e não acessa a rota;
- teclado em busca, selects e paginação, foco visível e viewport estreito;
- zoom/reflow, tema escuro e comparação visual com `K2Fvp` no fluxo real;
- executar separadamente o sensor mockado `pnpm --filter web test:integration` e
  registrar que ele não substitui o fluxo real.

Quality Gate local integrado, em ordem:

```text
pnpm format
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

`pnpm format` é aplicação de formatação, não gate. O build fica reservado para
este gate final porque a implementação altera exports, rota gerada, servidor e
artefatos de migration. O CI continua sendo a fonte oficial do Quality Gate.

## Matriz de rastreabilidade operacional

| IDs | Fases/tarefas | Evidência principal |
|---|---|---|
| SR-001 / CA-01–02 | F2-T3, F3-T1, F4-T1/T2 | integração REST e rota protegida; browser autenticado |
| SR-002 / CA-03–04 | F1-T1, F2-T1/T3, F3-T3 | use case, REST, widget, browser sem colunas/ações proibidas |
| SR-003 / CA-05 | F1-T2/T3, F2-T3, F3-T3 | teste de use case/REST e busca real |
| SR-004 / CA-06–09 | F1-T2/T3, F2-T1/T3, F3-T3 | schema, integração REST, hook/widget, catálogo indisponível |
| SR-005 / CA-10–12 | F1-T2/T3, F2-T1/T3, F3-T3 | paginação/count/ordem em banco e UI |
| SR-006 / CA-13–14 | F3-T1/T3, F4-T2 | route validation, hook e URL/request browser |
| SR-007 / CA-15–17 | F3-T3, F4-T2 | matriz de estados e retry sem reload |
| SR-008 / CA-18 | F1-T1/T2, F2-T1/T3 | revisão arquitetural e provider público |
| SR-009 / CA-19–21 | F3-T3, F4-T2 | widget/a11y/browser/visual comparison |
| SR-010 / CA-22–23 | F3-T1/T2, F4-T2 | sidebar layout, perfis e rota descendente |

## Riscos, findings e tentativas

| ID | Tipo | Estado | Impacto | Mitigação/evidência | Próxima ação |
|---|---|---|---|---|---|
| R-001 | migration + FKs internas | aberto | associação de tema pode permitir referência sem associação de área | PK/FK composta, checks, fixture real e migration aplicada | validar em F2-T1 |
| R-002 | fronteira cross-module | aberto | importar Catálogo diretamente quebraria ownership | somente `LegalExpertiseCatalogProvider`; revisão arquitetural e teste de resolução | validar em F1/F2 |
| R-003 | autorização | aberto | endpoint ou rota poderia vazar dados | `AuthGuard` + `ActiveAdminGuard` e `requireAdminMiddleware`; casos `401/403` | validar em F2-T3/F4-T2 |
| R-004 | URL state | aberto | filtro pode preservar tema incompatível ou página antiga | query key completa, reset determinístico e hook/route tests | validar em F3-T3 |
| R-005 | referência visual conflitante | resolvido | frame mostra mutações fora do escopo | exceção registrada na Spec e no Plan; comparação ignora ações/sidebar | manter na revisão visual F4 |
| R-006 | worktree sujo | ativo, não bloqueante | alterações alheias podem contaminar diff | não reverter nem editar paths fora deste feature; revisar diff antes do handoff | reavaliar no Quality Gate |
| R-007 | ambiente browser/Auth | aberto | sem serviços saudáveis não há evidência real | preflight obrigatório e classificação de bloqueio antes do Judge final | executar somente em F4 |
| R-008 | migration operacional | aberto | migration aditiva pode falhar em aplicação, deixar schema parcial ou invalidar o seed | gerar migration pelo Drizzle, revisar SQL/constraints antes de aplicar, aplicar primeiro em fixture/staging controlado; em falha, preservar o artefato, interromper o seed e fazer forward-fix ou rollback operacional aprovado, sem editar migration já aplicada | validar SQL, fixture e procedimento de recuperação em F2-T1/F2-T2 |
| R-009 | sensor global | resolvido | teste de Intake passou 2/2; a falha anterior não foi reproduzida | registrar no Quality Gate local |
| R-010 | harness Playwright mockado | resolvido | fixture corrigida para `sb-supabase-auth-token`; sensor da rota da feature passou 1/1 | manter sensor separado do fluxo real |
| R-011 | suíte global | resolvido | `pnpm test` passou nos quatro workspaces, com 310 testes | registrar no Quality Gate local |
| R-012 | transporte Playwright MCP | classificado, não bloqueante para evidência alternativa | MCP não abriu por perfis Chrome órfãos; após encerrar processos órfãos, o transporte permaneceu fechado | fluxo real equivalente executado com Playwright direto contra login/Auth/REST/Web, sem `page.route`; nenhum erro de console/network | registrar no Judge como limitação de ferramenta |

Tentativas de implementação F1 e F2 concluídas. F1 teve sensores verdes; F2 teve
sensores de escopo e integração REST verdes, com R-009 classificado como falha
preexistente fora do escopo. Houve
duas avaliações do Judge Plan: a primeira falhou com JP-01–JP-04; a segunda
aceitou após as correções registradas acima. Qualquer falha futura deve registrar
comando, escopo, finding, estado da fase e próxima ação aqui antes de um retry.

## Critérios de aceite do Plan

O `Judge Plan` deve confirmar que:

- a necessidade de Plan é proporcional ao escopo e risco;
- as fases são ordenadas e não há Builder antes de F1/F2/F3 estar aceito;
- cada tarefa possui paths reais, resultado observável, `SR-*`/`CA-*` e
  `parallelizable` com motivo;
- core, validation, database, REST, Auth, web provision/context, route, UI,
  sidebar, testes e browser estão cobertos sem cruzar ownership;
- migration, seed, Testcontainers, Playwright e build final estão nos lugares
  corretos;
- a evidência visual Pencil é suficiente e as exceções de ações/sidebar estão
  explícitas;
- o Plan preserva `prd`, `jira_tickets`, `spec_revision` e os links de
  avaliação.

## Vereditos

### Judge Plan

```yaml
status: accepted
agent: judge-plan-agent
verdict: accepted
findings:
  - id: JP-01
    severity: P1
    summary: separar Playwright mockado do fluxo real e declarar pnpm --filter web test:integration
    state: resolved_in_plan
  - id: JP-02
    severity: P1
    summary: F3-T2 não pode ser paralelizável porque depende de ROUTES em F3-T1
    state: resolved_in_plan
  - id: JP-03
    severity: P1
    summary: explicitar interfaces core, module/decorator e fixture modular com static register
    state: resolved_in_plan
  - id: JP-04
    severity: P1
    summary: registrar risco e estratégia de recuperação de migration
    state: resolved_in_plan
next_action: rotear para implement-plan; nenhum Builder foi iniciado nesta task
```

### Judge Implementation

```yaml
status: accepted
agent: judge-implementation-agent
verdict: accepted
attempts:
  - verdict: failed
    findings: [JI-01, JI-02, JI-03, JI-04]
    correction: Builder Fix aplicado e sensores/preflight repetidos
findings: []
next_action: encaminhar para conclude-spec
```

## Handoff após aceite

Quando o `Judge Plan` retornar `accepted`, o Orchestrator deve:

1. atualizar o bloco de veredito e o estado operacional para `pending`/pronto;
2. manter F1 como primeira fase `pending`;
3. rotear a execução para `implement-plan` na mesma task;
4. iniciar Builder somente depois do aceite, preservando os sensores por fase;
5. manter este Plan como ledger e registrar findings imediatamente.

Se o `Judge Plan` retornar `failed`, nenhum Builder deve iniciar. Registrar o
parecer no bloco acima, corrigir somente a decomposição/documentação necessária,
incrementar a tentativa no ledger e acionar o Judge novamente.
