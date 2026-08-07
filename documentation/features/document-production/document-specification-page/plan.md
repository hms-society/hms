---
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 2
status: pending
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
jira_tickets:
  - SCRUM-136
---

# Plan SDD — Criação, detalhe e edição de modelo de documento

## Estado operacional

| Campo | Estado |
|---|---|
| Plan | `accepted` |
| Spec | `open`, revisão 2 |
| Fase atual | F5 — Integração, browser e Quality Gate (`accepted`) |
| Próxima ação | conclude-spec |
| Judge Plan | `accepted` |
| Judge Implementation | `accepted` |
| Implementação | concluída; aguardando encerramento da Spec |

Este Plan é necessário porque a entrega atravessa `@hms/core`,
`@hms/validation`, `server` e `web`, inclui migration com backfill de dados,
introduz o editor Tiptap, cruza a fronteira pública do Catálogo Jurídico e
precisa de evidência REST, rota, acessibilidade, Pencil e navegador autenticado.

Somente o Orchestrator atualiza este ledger. Builders implementam os paths das
suas tarefas; Judges avaliam read-only. Todos são subagentes da task atual; não
há nova thread.

## Objetivo

Permitir que um administrador ativo crie ou abra um modelo de documento,
configure nome, descrição, disponibilidade, obrigatoriedade e uma única
aplicação, e edite seu template rico com variáveis de sistema e personalizadas.

O resultado observável é um fluxo em duas etapas: **Novo modelo** cria uma
identidade válida como **Indisponível**, sem registro ao abrir ou abandonar a
rota; depois do `201`, o administrador é redirecionado ao detalhe, onde pode
salvar configuração e template em fronteiras independentes, com autorização,
atomicidade, validação e feedback completos.

## Escopo

Inclui:

- contratos Core, schemas compartilhados, erros e quatro casos de uso;
- `content` JSON rico estrito, variáveis de sistema e variáveis locais;
- migration de texto para JSONB com preflight, backfill e preservação de dados;
- repository, mapper, seed, composição Nest e quatro endpoints REST protegidos;
- serviço web, dependência Tiptap v3, rota estática de criação e rota dinâmica;
- navegação de **Novo modelo** e **Editar** na listagem existente;
- página compartilhada de configuração/template, formulários, editor, toolbar,
  variáveis, catálogo jurídico, estados e dirty guard;
- testes unitários, schemas, REST com banco real, serviço, hooks, widgets e
  integração de rota;
- Playwright real autenticado, comparação Pencil e Quality Gate final.

Fora de escopo:

- duplicar ou excluir modelos e alterar a ação **Duplicar**;
- manter áreas/temas no módulo de Produção Documental;
- upload/importação DOCX/PDF, substituição de arquivo-base ou pré-visualização;
- colaboração, autosave, histórico administrativo de versões e conflitos;
- geração por IA, preenchimento de variáveis ou documento final;
- redesenhar sidebar, navbar ou `AppLayout`;
- atualizar automaticamente Jira ou Confluence.

## Fontes e evidências de descoberta

- Spec canônica: [`spec.md`](./spec.md), revisão 2, `status: open`.
- PRD canônico: [PRD — Módulo de Produção Documental](https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673), página `2588673`, versão 6, atualizada em 05/08/2026. A seção 11 prevalece sobre as regras antigas de arquivo-base, pacote separado e momento `case`.
- Ticket: [SCRUM-136](https://plataformahms.atlassian.net/browse/SCRUM-136).
- Design declarado pela Spec: `design/hms.pen#K2Fvp`, `#vBrek`, `#V7lxA`, `#FQtUK` e `#fRdNH`.
- Tiptap: documentação atual consultada via Context7 em `/ueberdosis/tiptap-docs`, confirmando React `useEditor`/`EditorContent`, `immediatelyRender: false`, JSON e `setContent` com `emitUpdate: false` para sincronização externa.
- Regras carregadas: Core, validation, database, REST, controller testing,
  use-case testing, UI, routing, widget testing, provision, code conventions,
  design, infrastructure, modules e tooling.

## Inventário visual Pencil

O Plan deve ser executável sem consultar outra seção para identificar o escopo
visual. Os cinco nodes canônicos de `design/hms.pen` são:

| Node | Tela/estado | Elementos e comportamento a reproduzir | Critério de verificação |
|---|---|---|---|
| `K2Fvp` | Listagem de modelos | Header com ação primária **Novo modelo**; contexto visual de Documentos; ação **Editar** abre o detalhe | Listagem, estado vazio, filtros/paginação preservados e navegação para `/modelos-de-documentos/novo` |
| `vBrek` | Detalhe desktop — aba Configuração | Nome e descrição; status disponível/indisponível; aplicação global/jurídica; áreas e temas; indicador de salvo | Configuração corresponde ao frame desktop, com descrição obrigatória conforme PRD e sem mutações de sidebar/navbar de contexto |
| `V7lxA` | Detalhe desktop — aba Template com conteúdo | Editor rico com toolbar contratada; conteúdo existente; contagem de palavras; painel/lista de variáveis; inserção de variável no cursor | JSON e formatação permitidos preservados; variável recupera foco do editor; salvamento habilita somente para rascunho válido |
| `FQtUK` | Detalhe desktop — aba Template vazia | Estado vazio; orientação **Começar a escrever**; instrução de colagem; **Salvar template** desabilitado | A ação foca o editor sem inserir conteúdo fictício; documento estruturalmente vazio não é salvo |
| `fRdNH` | Modal Criar variável personalizada | Label, nome técnico sugerido em `snake_case`, descrição opcional, validação e confirmação | Nome inválido, reservado ou duplicado mantém o modal aberto com erro associado; variável válida fica local ao modelo |

Todos os frames têm 1440 px de largura, exceto o modal `fRdNH`, com 520 px.
Não há node canônico para viewport estreito, tema escuro, carregamento, erro,
404, criação vazia, conflito de navegação ou validações inválidas; esses estados
devem ser derivados do Contract e validados no navegador, sem inventar Node IDs.
`vBrek` marca a descrição como opcional, mas o PRD prevalece: a implementação
deve tratá-la como obrigatória e registrar essa divergência na comparação.

### Estado atual e findings de descoberta

- `DocumentSpecification` já prevê parte de aplicação, conteúdo e variáveis,
  mas depende de `DocumentSpecificationApplication`,
  `DocumentSpecificationStatus` e `DocumentTemplateVariable` ausentes.
- `DocumentGenerationMoment` ainda usa `case`; banco, REST e UI usam
  `legal_production`. O typecheck do Core falha por essas lacunas.
- O repository atual expõe apenas `list`, `addMany` e `removeAll`; detalhe,
  criação unitária e os dois updates ainda não estão implementados.
- O model persiste `content` como `text`; `variables` já é JSONB.
- A listagem existe, mas **Novo modelo** e **Editar** ainda não completam o
  fluxo de criação/detalhe.
- O serviço web implementa somente a listagem e não há editor rico instalado.
- O worktree está sujo com alterações não relacionadas em
  `.codex/skills/create-pr/SKILL.md`, remoção de um teste de Core e documentação
  não rastreada. Não reverter nem incorporar esses paths.

## Fronteiras e dependências

```text
F1 Core + validation
  └── F2 Persistence + migration + seed
        └── F3 REST + authorization
              └── F4 Web + routes + page/editor
                    └── F5 Browser + Quality Gate + Judge Implementation
```

Produção Documental é dona de modelo, aplicação, template, variáveis,
obrigatoriedade, estado e associações internas. Catálogo Jurídico é dono de
nomes, atividade e compatibilidade; a feature só usa
`LegalExpertiseCatalogProvider` e seus serviços públicos. Não criar FKs, joins,
imports de tabelas ou repositories do Catálogo em Produção Documental.

## Ledger de fases

Estados de fase: `pending`, `in_progress`, `awaiting_judgment`, `failed`,
`accepted`. Estados de tarefa: `pending`, `implementing`, `validating`,
`verified`.

| Fase | Estado | Depende de | Saída de aceite |
|---|---|---|---|
| F1 — Core e validação | `accepted` | Judge Plan aceito | contratos, schemas e casos de uso passam seus sensores |
| F2 — Persistência, migration e seed | `accepted` | F1 aceita | JSONB, backfill, transações, mapper e fixture funcionam |
| F3 — REST e autorização | `awaiting_judgment` | F2 aceita | POST/GET/PATCH retornam projeção correta e `401/403/404/400` |
| F4 — Web, rotas e experiência | `accepted` | F3 aceita | sensores web e integração concluídos; sem Judge intermediário |
| F5 — Integração e Quality Gate | `failed` | F1–F4 sensores verificados | corrigir JI-01..JI-05 e repetir sensores invalidados antes do Judge final |

### F1 — Core e validação

Objetivo: corrigir a fundação e estabelecer contratos independentes para
criação, leitura, configuração, template e projeção REST.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F1-T1 — Estruturas, entidade, erros e ports | `verified` | `packages/core/src/document-production/domain/{entities,errors,structures}/**`; `interfaces/**`; `use-cases/index.ts`; `packages/core/package.json` | tipos estritos para status, aplicação única, content JSON, variável local, input de criação, updates e detalhes; `LegalProduction` substitui `Case`; repository/service exportam `add`, `findById`, `replaceConfiguration` e `replaceTemplate`; erros não conhecem HTTP | RF-001–RF-004, RF-005, RF-006, RF-008, RF-009; CA-01–CA-04, CA-08–CA-09, CA-12, CA-15, CA-18, CA-21–CA-22, CA-26–CA-28 | não; os demais contratos dependem dele |
| F1-T2 — Casos de uso e regras de domínio | `validating` | `packages/core/src/document-production/use-cases/{create,get,update-document-specification-configuration,update-document-specification-template}-use-case.ts`; `use-cases/tests/**`; fakers/fixtures do domínio | criação normaliza textos, força `unavailable`/documento vazio/variáveis vazias e valida catálogo; get e updates convertem ausência; configuração valida disponibilidade, aplicação, catálogo e preservação da outra fronteira; template valida árvore, texto e tokens | RF-001–RF-009, RF-011; CA-01–CA-09, CA-12, CA-15, CA-18–CA-22, CA-26–CA-30 | sim após F1-T1; não compartilha paths de produção com F1-T3 |
| F1-T3 — Schemas compartilhados e testes | `validating` | `packages/validation/src/document-production/schemas/**`; `schemas/tests/**`; barrels e `package.json` | schemas Zod estritos rejeitam payloads extras, validam união global/jurídica, árvore recursiva, links HTTP(S), variáveis e os três bodies sem aceitar status/content/identity no create | RF-003–RF-006, RF-009, RF-011; CA-07–CA-09, CA-13–CA-15, CA-21, CA-28–CA-29 | sim após F1-T1; independente de F1-T2 |

Sensores oficiais F1:

- `pnpm --filter @hms/core lint`;
- `pnpm --filter @hms/core check-types`;
- `pnpm --filter @hms/core test`;
- `pnpm --filter @hms/validation lint`;
- `pnpm --filter @hms/validation check-types`;
- `pnpm --filter @hms/validation test`;
- revisão de imports para garantir que Core não importa Nest/HTTP/Drizzle e
  que o provider público do Catálogo é a única dependência cross-module.

Evidência esperada: testes dos quatro casos de uso cobrem happy path, ausência,
normalização, disponibilidade, aplicação global/jurídica, tokens, variáveis e
isolamento das fronteiras; testes dos cinco schemas cobrem shapes válidos,
propriedades proibidas, nós/marcas inválidos, URLs proibidas e regex.

### F2 — Persistência, migration e seed

Objetivo: materializar o contrato sem perder conteúdo legado nem permitir
associação jurídica parcial.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F2-T1 — Model, tipos, mapper e migration | `verified` | `apps/server/src/document-production/database/drizzle/{models,types,mappers}/**`; `apps/server/src/shared/database/drizzle/{schema.ts,migrations/**}` | `content` vira JSONB `NOT NULL`; migration faz preflight de `variables`, marca vazio como indisponível, converte texto para doc JSON, preserva dados válidos, falha sem descarte silencioso e adiciona checks estruturais | RF-004, RF-006, RF-009; CA-08–CA-09, CA-15, CA-21–CA-22 | não; migration e mapper compartilham o model |
| F2-T2 — Repository e módulo de banco | `verified` | `apps/server/src/document-production/database/drizzle/repositories/drizzle-document-specifications-repository.ts`; `constants/document-production-repositories.ts`; `database/document-production-database.module.ts`; `document-production.module.ts` | `add` e `replaceConfiguration` são transacionais, associations jurídicas próprias são recriadas atomicamente, `findById` recompõe aplicação, `replaceTemplate` altera somente content/variables/updatedAt e nenhum método importa tabelas do Catálogo | RF-003, RF-008, RF-009, RF-011; CA-05–CA-07, CA-15, CA-18, CA-21, CA-26–CA-28 | não; depende de F2-T1 e fornece tokens para F2-T3 |
| F2-T3 — Seeder, fixture e testes de persistência | `verified` | `apps/server/src/document-production/database/document-production-seeder.ts`; `fixtures/document-production-module-fixture.ts`; `fixtures/index.ts`; `apps/server/src/shared/database/seed.ts`; testes database/migration | seeder usa contratos e `addMany`, fixture expõe `static register`, compõe `RestFixture`, aplica migration e isola banco; cenários confirmam rollback do create/update, legacy backfill e preservação de associações/documentos/pacotes | RF-003, RF-008, RF-009, RF-011; CA-05–CA-07, CA-15, CA-18, CA-21, CA-26–CA-28 | não; depende dos tokens, migration e repository |

Regras operacionais da migration:

1. gerar com `pnpm --filter server db:migration:generate` a partir do schema
   compartilhado;
2. revisar SQL, preflight, checks, `NOT NULL`, backfill e journal antes de
   aplicar;
3. aplicar na fixture com o mecanismo documentado, sem repetir a migration como
   sensor em cada retry;
4. se dados incompatíveis forem encontrados, abortar preservando o artefato e
   registrar forward-fix/rollback operacional aprovado; não editar migration já
   aplicada.

Sensores oficiais F2:

- `pnpm --filter server check:code`;
- `pnpm --filter server check:types`;
- teste de migration/fixture com PostgreSQL real;
- teste repository de quatro métodos, transações, remapeamento e invariantes;
- revisão de FKs somente entre tabelas de Produção Documental.

### F3 — REST e autorização

Objetivo: expor a projeção completa sem transportar dados derivados da sessão e
com uma borda consistente de erros.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F3-T1 — Controllers, DTOs, decorator e composição | `verified` | `apps/server/src/document-production/rest/{controllers,dtos}/**`; `decorators/**`; `document-production.module.ts`; `apps/server/src/app.module.ts` | `POST /document-specifications`, `GET /document-specifications/:documentSpecificationId`, `PATCH .../configuration` e `PATCH .../template` usam `@DocumentProductionController`, `AuthGuard`, `ActiveAdminGuard`, use case único no construtor e DTOs derivados dos schemas; sucesso POST `201`, GET/PATCH `200` | RF-001–RF-009, RF-011; CA-01–CA-09, CA-12, CA-15, CA-18–CA-22, CA-26–CA-30 | não; depende de F2-T2 |
| F3-T2 — Testes HTTP por controller e exemplos REST | `verified` | `apps/server/src/document-production/rest/controllers/tests/{create,get,update-document-specification-configuration,update-document-specification-template}.controller.test.ts`; `apps/server/rest-client/document-production/document-specifications.rest` | quatro testes exercem Supertest, module fixture, use case, token, repository Drizzle, mapper e banco real; cobrem `401/403/404/400`, rollback, projeção ISO, domínio inválido e sucesso; `.rest` documenta Bearer e payloads representativos | RF-001–RF-009, RF-011; CA-01–CA-09, CA-12, CA-15, CA-18–CA-22, CA-26–CA-30 | não; segue a composição de F3-T1 |
| F3-T3 — Sensor REST e revisão de contratos | `verified` | `apps/server/src/document-production/rest/dtos/index.ts`; `controllers/index.ts`; `document-production.module.ts`; `document-specifications.rest` | integração reproduzível confirma que response expõe exatamente ID, nome, descrição, aplicação/IDs, obrigatoriedade, content, variables, status e `updatedAt`, sem perfil/user ID ou nomes duplicados do Catálogo | RF-001, RF-008, RF-009; CA-01–CA-02, CA-18, CA-21–CA-22, CA-26–CA-28 | não; depende dos testes e composição |

Regras de teste F3: não chamar `controller.handle()` diretamente; cada
controller possui arquivo próprio; usar `RestFixture`/`DatabaseFixture`,
`DocumentProductionModuleFixture.register`, infraestrutura real e fakers de
domínio. Mocks só podem cobrir dependências sem serviço controlável e devem ser
justificados localmente.

### F4 — Web, rotas e experiência

Objetivo: entregar o fluxo administrativo conectado aos endpoints e ao catálogo,
com duas fronteiras de rascunho e o editor JSON rico.

| Tarefa | Estado | Paths principais | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F4-T1 — Dependência, adapter e rotas | `implementing` | `apps/web/package.json`; `pnpm-lock.yaml`; `apps/web/src/rest/services/document-production-service.ts` e testes; `apps/web/src/constants/routes.ts`; `apps/web/src/routes/modelos-de-documentos/{index.tsx,novo.tsx,$documentSpecificationId.tsx}`; `apps/web/src/routeTree.gen.ts` | Tiptap v3 é adicionado somente ao web; service mapeia POST/GET/dois PATCHes sem auth/negócio; criação é client-only e protegida; detalhe usa UUID semântico e `AppLayout`; listagem conecta **Novo modelo**/**Editar**, preserva **Duplicar** fora de escopo e invalida/navega corretamente | RF-001, RF-008, RF-010, RF-011; CA-01–CA-02, CA-18–CA-20, CA-22–CA-30 | não; rotas, constants e route tree são pontos compartilhados |
| F4-T2 — Página, forms, catálogo e editor | `verified` | `apps/web/src/ui/document-production/widgets/pages/document-specification-page/**`; hooks/actions/query; testes colocados em `tests/` | página create/edit, React Hook Form + Zod, configuração/template independentes, dirty guard, loading/error/404/retry; editor Tiptap com `immediatelyRender: false`, JSON estrito, toolbar, links HTTP(S), variáveis e busca | RF-002–RF-010, RF-011; CA-03–CA-20, CA-23–CA-30 | não; depende de F4-T1 e compartilha contratos de view |
| F4-T3 — Navegação, estados e integração de rota | `verified` | `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/**`; `apps/web/src/routes/modelos-de-documentos/index.test.tsx`; `apps/web/tests/routes/document-production/**` | **Novo modelo** abre `/modelos-de-documentos/novo` sem POST; **Editar** abre o ID; transport mockado stateful cobre create `201`, GET/PATCH, redirect replace, filtros de catálogo, erros, not-found, pending, dirty guard e re-render sem requests duplicados | RF-001, RF-002, RF-008, RF-010, RF-011; CA-01–CA-04, CA-10–CA-20, CA-23–CA-30 | não; depende de F4-T2 e da rota gerada |

Decisões de UI F4:

- a page hook é dona de query keys, mutations, formulários, referências salvas,
  tab state e confirmação de descarte; widgets são composição;
- cada widget aninhado tem diretório próprio e `index.tsx`; lógica não fica em
  componentes locais;
- usar tokens de `documentation/design.md`, Fraunces em headings, Plus Jakarta
  Sans no corpo, wrappers HMS `Icon`/`Anchor` e primitives existentes;
- usar texto, foco, `aria-*` e estados pressionados para comunicar estado,
  obrigatoriedade, validação e erro, sem depender somente de cor;
- modo create não envia `status`, `content` ou `variables`; template fica
  desabilitado até o POST retornar; status começa indisponível;
- catálogo com falha mantém rascunho, informa a indisponibilidade e não permite
  salvar referências não verificáveis;
- Tiptap deve produzir somente os nós/marcas do Contract; qualquer extensão
  adicional exige revisão da Spec.

Sensores oficiais F4:

- `pnpm --filter web generate-routes`;
- `pnpm --filter web check:code`;
- `pnpm --filter web check:types`;
- `pnpm --filter web test`;
- `pnpm --filter web test:integration` nos dois arquivos de rota da feature,
  com `page.route` apenas no transporte mockado e com essa evidência rotulada
  como integração determinística, não como E2E real;
- revisão dos métodos/path/payload do service, query keys, route constants e
  `routeTree.gen.ts` gerado.

### F5 — Integração, browser e Quality Gate

Objetivo: provar o Contract completo contra serviços reais, Rules, arquitetura,
acessibilidade e referências visuais, então fechar com um único Judge
Implementation.

| Tarefa | Estado | Paths/evidência | Resultado observável | Traceabilidade | Parallelizable |
|---|---|---|---|---|---|
| F5-T1 — Preflight de dependências | `verified` | evidência de sessão; não persistir credenciais | Docker/Auth/banco saudáveis, Nest sem `UnknownDependenciesException`, health do server `:3333` e Web/Server estáveis | RF-001, RF-009; CA-01–CA-02, CA-22, CA-25–CA-30 | não; bloqueia browser |
| F5-T2 — Fluxo browser autenticado real | `verified` | Playwright MCP: snapshots novos por navegação/interação, requests, console e evidência visual; teste mockado em `apps/web/tests/routes/document-production/**` | login/sessão admin, listagem, Novo modelo sem POST prematuro, create/redirect, GET/PATCH reais, editor/variáveis, dirty guard, teclado, viewport estreito e console/network sem erros | todos RF; CA-01–CA-30 | não; depende de F5-T1 e F1–F4 |
| F5-T3 — Sensores integrados e Quality Gate | `verified` | saídas de comandos; `evaluation.md`; diff final | `pnpm format`, `pnpm lint`, `pnpm check-types`, `pnpm test` e `pnpm build` passaram na ordem; warnings/notices não bloqueantes classificados | todos RF/CA | não; gate global |
| F5-T4 — Judge Implementation Final único | `accepted` | `plan.md`, `evaluation.md`, diff, sensores e evidências do browser | Judge único aceitou a implementação inteira; JI-01..JI-09 resolvidos e F3-J1 não bloqueante | todos RF/CA | não; etapa final |

### Dois sensores de navegador

1. **Playwright automatizado mockado:** usa `pnpm --filter web test:integration`
   e `page.route` quando necessário. Prova loader, rota, request, URL e
   composição determinística; não prova Auth, bootstrap do Nest ou banco.
2. **Playwright MCP real:** usa Web, Server, Auth e banco locais, sem mocks de
   transporte. É a evidência oficial de sessão, autorização, REST real,
   responsividade, tema, console, network e comparação visual.

Preflight obrigatório do fluxo real:

1. executar `docker compose ps -a`, `curl http://localhost:8000/auth/v1/health`
   e `curl http://localhost:3333/health`;
2. iniciar `pnpm --filter server dev` e `pnpm --filter web dev` em sessões
   persistentes e esperar compilação/restart terminar;
3. resolver `admin@hmsadvogados.com.br` e `HMS_USER_SEED_PASSWORD` lendo fonte
   e env, sem assumir senha;
4. abrir `/login`, obter snapshot novo, autenticar e confirmar URL/conteúdo;
5. após cada navegação ou interação, obter novo snapshot; ao final coletar
   console/network e classificar todo erro, warning, hydration, refresh e
   `4xx/5xx` inesperado;
6. parar somente as sessões Web/Server iniciadas, preservando Docker compartilhado.

Fluxos mínimos: create global e jurídico com rollback; Editar por listagem e
URL direta; configuração global/jurídica; tentativa de disponibilizar modelo
incompleto; colagem/formatação/undo/redo; criação, busca e inserção de variável
no cursor; save/reload; pending/error/retry/not-found/dirty; perfis sem acesso;
teclado, foco, viewport estreito, zoom/reflow, dark mode; e comparação com os
cinco nodes Pencil. Registrar a divergência de descrição obrigatória do PRD e a
derivação do modo vazio sem inventar Node ID.

## Matriz de rastreabilidade operacional

| IDs | Fases/tarefas | Evidência principal |
|---|---|---|
| RF-001 / CA-01–02 | F3-T1/T2, F4-T1/T3, F5-T1/T2 | controllers reais, route protection e browser autenticado |
| RF-002 / CA-03–04 | F1-T2, F2-T2, F3-T2, F4-T2/T3, F5-T2 | use case, REST, form e feedback |
| RF-003 / CA-05–07 | F1-T2/T3, F2-T1/T2/T3, F3-T2, F4-T2 | schema, provider, transação e REST |
| RF-004 / CA-08–09 | F1-T1/T2/T3, F2-T1, F3-T2, F4-T2, F5-T2 | schema JSON, migration, editor e reload |
| RF-005 / CA-10–12 | F1-T1/T2/T3, F4-T2/T3, F5-T2 | variável, token, busca e cursor |
| RF-006 / CA-13–15 | F1-T1/T2/T3, F2-T3, F4-T2/T3, F5-T2 | schema, use case, modal e persistência |
| RF-007 / CA-16–17 | F4-T2/T3, F5-T2 | empty state, word count e dirty state |
| RF-008 / CA-18–20 | F1-T1/T2, F2-T2/T3, F3-T1/T2, F4-T2/T3, F5-T2 | dois PATCHes, atomicidade e dirty guard |
| RF-009 / CA-21–22 | F1–F3, F5-T3/T4 | migration, arquitetura, typecheck e gate |
| RF-010 / CA-23–24 | F4-T2/T3, F5-T2 | Pencil, a11y, teclado, responsividade e tema |
| RF-011 / CA-25–30 | F1-T2/T3, F2-T2/T3, F3-T1/T2, F4-T1/T2/T3, F5-T2 | POST transacional, create route e browser real |

## Riscos, findings ativos e próxima ação

| ID | Tipo | Estado inicial | Impacto | Mitigação/evidência | Próxima ação |
|---|---|---|---|---|---|
| R-001 | fundação Core inconsistente | aberto | consumers não compilam ou usam `case` divergente | F1 corrige tipos, exports e momento canônico; check-types | validar em F1-T1/T2 |
| R-002 | migration text → JSONB | aberto | backfill pode perder conteúdo ou aceitar variáveis inválidas | preflight abortivo, migration revisada, fixture real e dados legados de teste | validar em F2-T1/T3 |
| R-003 | atomicidade de associations | aberto | criação/update pode deixar linha ou tema parcial | transação única, PK/FK internas, rollback HTTP e repository test | validar em F2-T2/T3/F3-T2 |
| R-004 | fronteira Catálogo Jurídico | aberto | imports diretos violam ownership e podem duplicar dados | somente provider/serviços públicos; revisão arquitetural | validar em F1-T2/F2-T2/F4-T2 |
| R-005 | autorização em duas bordas | aberto | endpoint/rota pode vazar modelo ou permitir mutação indevida | `AuthGuard` + `ActiveAdminGuard` + `requireAdminMiddleware`; `401/403` reais | validar em F3-T1/T2/F5-T2 |
| R-006 | Tiptap e schema recursivo | aberto | editor pode persistir nós, marks ou links fora do Contract | extensões explicitamente limitadas, parser compartilhado, JSON round-trip e paste tests | validar em F1-T3/F4-T2 |
| R-007 | duas fronteiras de rascunho | aberto | salvar configuração pode sobrescrever template ou vice-versa | refs salvas independentes, dois PATCHes, pending/dirty tests e browser | validar em F3-T2/F4-T2/T3 |
| R-008 | ambiente browser/Auth | aberto | sem serviços saudáveis não há evidência E2E real | preflight obrigatório, sessões registradas e classificação explícita | executar somente em F5-T1 |
| R-009 | divergência visual/documental | resolvido na Spec | frame antigo marca descrição opcional e mostra contexto fora do Contract | PRD seção 11 prevalece; comparar descrição como obrigatória e excluir sidebar/mutações | manter nota em F5-T2 |
| R-010 | worktree sujo | ativo, não bloqueante | diff alheio pode contaminar handoff | preservar paths do usuário e revisar `git diff`/`git status` antes do Judge | reavaliar em F5-T3 |
| R-011 | dependência nova no web | aberto | lockfile/editor podem quebrar build ou SSR | Tiptap v3 documentado, `immediatelyRender: false`, dependências isoladas no web e build final | validar em F4-T1/F5-T3 |
| R-012 | harness mockado insuficiente | aberto | teste de rota pode parecer autenticado sem provar sessão real | rotular `page.route`; exigir Playwright MCP sem mocks para aceite | validar em F5-T2/T4 |
| R-013 | cobertura negativa da migration | ativo, não bloqueante | preflight SQL tem menos evidência automatizada de abort/rollback para variáveis inválidas, duplicadas ou conflitantes | adicionar cenário PostgreSQL real sem alterar migration; manter finding do Judge F2 até sensor passar | cobrir antes do Quality Gate F5-T3 |

Findings do Judge Plan e Judge Implementation permanecem vazios até seus
vereditos. Qualquer retry deve registrar comando, finding, estado da fase,
correção aplicada, sensores invalidados e próxima ação nesta seção.

## Critérios de aceite do Plan

O Judge Plan deve confirmar que:

- `status`, `spec_revision`, `prd` e `jira_tickets` preservam a rastreabilidade;
- a decomposição cobre Core, validation, migration, persistência, seed, REST,
  Auth, serviço web, rotas, editor, widgets, testes e browser sem cruzar
  ownership;
- cada tarefa possui paths, resultado observável, RF/CA e
  `parallelizable` com motivo;
- F1–F5 estão ordenadas, sem Builder antes do aceite do Judge Plan e sem
  browser antes de dependências saudáveis;
- migration, Testcontainers, `.rest`, Playwright mockado e Playwright real são
  evidências distintas e estão no estágio correto;
- os cinco nodes Pencil e a divergência da descrição estão explícitos;
- riscos de rollback, autorização, JSON estrito, Tiptap, dirty guard e worktree
  sujo possuem mitigação e próxima ação.

## Vereditos

### Judge Plan

```yaml
status: accepted
agent: judge-plan-agent
verdict: accepted
findings: []
evidence:
  - plan.md:1-8
  - plan.md:83-101
  - plan.md:136-148
  - plan.md:155-307
  - plan.md:309-323
next_action: Builder Fix F1 corrigir F1-J1..F1-J4; preservar F1-J5 como alteração alheia
```

### Judge Implementation

```yaml
status: accepted
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
verdict: accepted
attempts:
  - attempt: 1
    findings: [JI-01, JI-02, JI-03, JI-04, JI-05, JI-06, JI-07, JI-08, JI-09]
    next_action: conclusão da Spec
findings:
  - F3-J1: cobertura adicional não bloqueante de 403, rollback via POST e igualdade exata das chaves
  - URL inválida no editor é ignorada sem mensagem específica, sem impacto nos critérios de aceite
next_action: conclude-spec
```

### Checkpoints de sensores por fase

```yaml
phases:
  F1:
    status: sensors_verified
    findings: [F1-J5]
    evidence:
      - core lint/check-types/test: 24 arquivos, 105 testes
      - validation lint/check-types/test: 7 arquivos, 19 testes
      - F1-J1..F1-J4 corrigidos e reavaliados pelo retry 2
    next_action: continuar execução do Plan
  F2:
    status: sensors_verified
    findings: [F2-J1]
    evidence:
      - server check:code/check:types: passed
      - server test: 25 arquivos, 73 testes aprovados
      - persistência/migration focados: 2 arquivos, 5 testes aprovados
    next_action: cobrir F2-J1 antes do Quality Gate F5-T3
  F3:
    status: sensors_verified
    findings: [F3-J1]
    evidence:
      - server check:code/check:types/build: passed
      - testes REST F3: 4 arquivos, 12 testes aprovados
      - suíte server: 29 arquivos, 85 testes aprovados
      - Judge F3 confirmou guards, DTOs, composição, fixture real e projeção sem dados de sessão
    next_action: iniciar F4-T1 — dependência, adapter e rotas
  F4:
    status: accepted
    findings: []
    next_action: corrigir findings finais de UI identificados pelo Judge único
  F5:
    status: accepted
    verdict: accepted
    findings: [F3-J1]
    next_action: conclude-spec
```

## Handoff após aceite

Quando o Judge Plan retornar `accepted`, o Orchestrator deve:

1. manter o Plan em `pending`/pronto e F1 como primeira fase `pending`;
2. rotear a execução para `implement-plan` na mesma task;
3. iniciar Builders somente na fase aceita pelo ledger e preservar sensores;
4. atualizar tarefas/fases apenas com evidências observáveis;
5. registrar findings imediatamente e encaminhar a conclusão para
   `conclude-spec` quando o Judge Implementation aceitar.

Se o Judge Plan retornar `failed`, nenhum Builder deve iniciar. Registrar o
parecer, corrigir somente a decomposição necessária, incrementar a tentativa no
ledger e acionar o Judge novamente.
