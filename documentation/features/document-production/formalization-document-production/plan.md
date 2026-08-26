---
title: Fundação da página de Formalização — implementation plan
status: completed
spec: ./spec.md
spec_revision: 8
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-139
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/24051713/PRD+M+dulo+de+Formaliza+o
updated_at: 2026-08-25
---

# Execution status

- **Spec:** [`spec.md`](./spec.md), revisão 8, pending final PR CI quality gate.
- **Revision 7 amendment:** replace the persisted contract-form snapshot only while
  open, clear answers on replacement, expose the shared selector through the
  Formalization context, and seed two temporary matching definitions.
- **Revision 8 amendment:** copy optional legal area/topic values from Intake into
  the Formalization projection and use that inherited context for form discovery.
- **Authorization correction:** administrators may operate any Formalization; the assigned lawyer remains the owner and authenticated actors remain the audit subjects.
- **Rationale:** Plan-backed execution é necessário porque a entrega cruza Core, Validation, Server/REST/persistência/seed, reutilização de UI entre Formalização e Consulta e validação autenticada com migração, concorrência e estados visuais.
- **Current phase:** F7 — final same-reviewer read-only recheck completed; PR publication and CI quality gate remain.
- **Next action:** publish the PR and run the applicable CI quality gate; the contracted Pencil state remains outside this delivery until an owner-approved read contract exists.
- **Active blockers:** none in the implementation or current evidence. The final Reviewer gate and PR CI are pending. `WNe1f` is a deferred supplemental state, not a contract requirement for this revision.
- **Builders:** nenhum ativo antes do kickoff; próximo Builder pronto: `builder_core`. Reutilizar `builder_validation` em F2, `builder_server` em F4 e `builder_web` em F3/F5; executar no máximo dois Builders em paralelo por onda.
- **Shared ownership:** o Orchestrator coordena `evaluation.md`, lockfile/dependências caso surjam, geração das migrations/meta do Drizzle, `routeTree.gen.ts`, integração final e evidência oficial. Builders não editam este Plan, a Spec ou a Evaluation.

# Execution ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Contratos de domínio, agregação e ações da Formalização | — | — | `completed` | Core contracts, use cases, exports and focused unit suites pass |
| 2 | `builder_validation` | F2 | Schemas de transporte da Formalização | F1 | F3 | `completed` | Validation schemas/tests, lint and types pass |
| 2 | `builder_web` | F3 | Extração source-neutral de Document Production | F1 | F2 | `completed` | Neutral package/review surfaces compile and Consultation regression coverage passes |
| 3 | `builder_server` | F4 | Persistência, seed, REST e composição do Server | F2 | F5 | `completed` | Real transaction rollback regression and server fixture prove persistence, authorization, source/event and convergence contracts |
| 3 | `builder_web` | F5 | Página, rotas e jornada Web da Formalização | F2, F3; REST Contract da Spec congelado | F4 | `completed` | Web unit/route coverage and generated/static checks pass with all required UI evidence |
| 4 | `orchestrator` | F6 | Integração, artefatos gerados e validação executável | F4, F5 | — | `completed` | Integrated candidate reflects repeated clean seed and current runtime/visual evidence |
| 5 | `reviewer` | F7 | Revisão integrada read-only | F6 | — | `completed` | Same Reviewer rechecked the corrected candidate; no blocking findings remain |

#### Revision 7 amendment — persisted contract-form replacement

- **Status/owner:** `completed` — Orchestrator-coordinated across Core, Validation, Server and Web; EV-40, EV-41, EV-50 and EV-51 pass.
- **Contract:** `RF-05A`, `CA-05A`; replacement is restricted to an open active Formalization, clears answers, snapshots the selected matching definition, and adds two temporary seeded Formalization forms.
- **Exit:** Core/Validation focused tests, Server/Web code and type checks, Formalization server suite, focused Web route/UI coverage and clean-seed replacement catalog evidence pass; the destructive seed is authorized for the final repeatability check.

### F1 — Contratos de domínio e casos de uso do Core

#### F1-T1 — Consolidar vocabulário de formulário e agregado Formalization

- **Status/owner:** `completed` — `builder_core` (`01a035f7-ffc3-7562-927f-ba31f2d9cbd7`, resumed corrections)
- **Depends/parallel:** início da execução; F1-T2 usa os contratos produzidos aqui.
- **Paths:** `packages/core/src/shared/domain/structures/dynamic-form-field-type.ts`; `packages/core/src/shared/domain/structures/dynamic-form-answer-value.ts`; `packages/core/src/shared/domain/structures/dynamic-form-field-validation.ts`; `packages/core/src/shared/domain/entities/dynamic-form-field.ts`; `packages/core/src/formalization/domain/{entities,structures,errors,index.ts}`; fakers e barrels correspondentes.
- **Contract:** `RF-04`–`RF-06`, `RF-08`–`RF-10`; `CA-04`–`CA-06`, `CA-08`, `CA-10`, `CA-11`.
- **Outcome:** tipos canônicos para seleção/números/regras condicionais, `Formalization` mutável com estado/revisão/confirmação, erros nomeados e snapshot de geração JSON-safe profundamente imutável, sem dependência de infraestrutura.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md` §§ “Business rules belong to use cases”, “Enum-like domain structures are canonical”, “Entity identity and composition”, “Structure mutability is semantic”; respeitar `Antipatterns to Avoid — Adding readonly to every Structure field`.
- **Exit:** `pnpm --filter @hms/core check-types`; `pnpm --filter @hms/core test`; `pnpm --filter @hms/core lint`; `git diff --check -- packages/core`; revisão dos exports públicos e da compatibilidade dos consumidores confirma que apenas snapshots/configurações imutáveis usam `readonly` profundo. **Passed 2026-08-24; EV-03.**

#### F1-T2 — Implementar portas, validador e ações da Formalização

- **Status/owner:** `completed` — `builder_core` (`01a035f7-ffc3-7562-927f-ba31f2d9cbd7`)
- **Depends/parallel:** F1-T1; bloqueia F2, F4 e F5. The current integrated candidate is evaluated against Spec revision 8; this historical task was activated at revision 5.
- **Paths:** `packages/core/src/shared/use-cases/validate-dynamic-form-answers-use-case.ts` e testes; `packages/core/src/formalization/interfaces/**`; `packages/core/src/formalization/use-cases/**`; `packages/core/src/formalization/use-cases/tests/**`; eventos/exports do Core e `packages/core/package.json`.
- **Contract:** `RF-01`–`RF-10`; `CA-01`–`CA-11`, com cobertura de autorização do advogado associado, corrida `addOrGet`, `expectedVersion`, revisão/freshness, fechamento convergente e snapshot autoritativo.
- **Outcome:** cada ação da Spec existe como use case verb-led, usa apenas portas do módulo/Shared, publica a geração individual pelo contrato Broker existente, não cria batch/signature event e contém a matriz de testes unitários exigida.
- **Rules:** `documentation/rules/core-package-rules.md` §§ “Business rules belong to use cases”, “Contracts belong to interfaces directories”, “Enum-like domain structures are canonical”; `documentation/rules/use-case-testing-rules.md` §§ “One test file per use case”, “Mock dependencies with vitest-mock-extended”, “Time is deterministic”, “Unit tests stay infrastructure-free”; `documentation/rules/messaging-layer-rules.md` §§ “Core owns domain events and the broker contract”, “The originating module builds authoritative event data”.
- **Exit:** `pnpm --filter @hms/core test`; `pnpm --filter @hms/core lint`; `pnpm --filter @hms/core check-types`; integrado com `pnpm --filter server check:types`; cada novo use case possui seu próprio `.test.ts`, fakers válidos e asserções de resultado/interações/erros, inclusive CA-10 sem evento de assinatura. Lifecycle eligibility, atomic start/CAS and document lock/terminal guards are covered. **Passed; EV-03, EV-05, EV-27.**

### F2 — Schemas de transporte

#### F2-T1 — Publicar schemas e tipos de request da Formalização

- **Status/owner:** `completed` — `builder_validation` (`01a03610-5c7d-7542-81ff-48f3dfb7700d`)
- **Depends/parallel:** F1; pode executar em paralelo com F3 após os exports do Core estarem estáveis.
- **Paths:** `packages/validation/src/formalization/schemas/**`; `packages/validation/src/formalization/index.ts`; `packages/validation/package.json`.
- **Contract:** `RF-04`, `RF-05`, `RF-10`; `CA-04`, `CA-05`, `CA-11`, incluindo UUIDs/IDs, números finitos, `expectedVersion`, respostas e razão/notas de encerramento sem aceitar snapshot de geração.
- **Outcome:** schemas Zod dos requests REST e barrel público alinhados ao Core, com validação de forma/transporte separada das regras de negócio e testes de valores inválidos/numéricos.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/core-package-rules.md` § “Enum-like domain structures are canonical” para não duplicar unions do Core; `documentation/tooling.md` para scripts de package e exports.
- **Exit:** `pnpm --filter @hms/validation test`; `pnpm --filter @hms/validation lint`; `pnpm --filter @hms/validation check-types`; `git diff --check -- packages/validation`; os schemas exportados resolvem no Server/Web sem literal unions divergentes. **Passed 2026-08-24; EV-04.**

### F3 — Extração source-neutral de Document Production

#### F3-T1 — Extrair pacote e revisão documentais source-neutral

- **Status/owner:** `completed` — `builder_web` (`01a03610-4ea8-7313-8821-38c351a9e3bf`)
- **Depends/parallel:** F1; pode executar em paralelo com F2. F3-T2 depende da composição neutral.
- **Paths:** `apps/web/src/ui/document-production/widgets/components/document-package/**`; `apps/web/src/ui/document-production/widgets/components/document-review/**`; `apps/web/src/ui/document-production/hooks/consultation-document-query-keys.ts`.
- **Contract:** `RF-07`, `RF-09`, `RF-12`; `CA-07`–`CA-09`, incluindo lock por formulário, freshness, ações individuais, polling/cleanup, histórico e ausência de batch/download nesta entrega.
- **Outcome:** componentes/hooks source-neutral recebem capabilities e adapters por contexto, preservam estados acessíveis, mantêm as capacidades atuais de Consulta e permitem ocultar batch/download somente no adapter de Formalização; não fazem leitura de Intake/Consulta/Identidade nem incorporam regras de Formalização no JSX.
- **Rules:** `documentation/rules/code-conventions-rules.md`; `documentation/rules/ui-layer-rules.md` §§ “UI code follows feature and shared boundaries”, “Keep UI logic inside the owning widget hook”, “Hooks wrap application semantics, not libraries generically”; `documentation/rules/widget-testing-rules.md` §§ “Separate widget tests from hook tests”, “Minimum behavior matrix for stateful widgets”; `documentation/design.md` §§ “Tipografia”, “Forma (Radius)” e “Acessibilidade”.
- **Exit:** testes focados de widget/hook passam; comparação do widget tree de `Z3Ll2j` é registrada; a validação inclui teclado, viewport estreita, inspeção de console e `requestfailed`, além de screenshot Playwright fresco do estado afetado via CLI Playwright do repositório (o `AGENTS.md` local proíbe servidor Playwright MCP). A resposta real, persistência e autorização das ações ficam obrigatoriamente verificadas em F6-T2; mock isolado não encerra esta cobertura. **Neutral component exit passed 2026-08-24; EV-07.**

#### F3-T2 — Adaptar Consulta sem regressão

- **Status/owner:** `completed` — `builder_web` (`01a03610-4ea8-7313-8821-38c351a9e3bf`)
- **Depends/parallel:** F3-T1; permanece no mesmo Builder para preservar contexto. Pode ser integrado antes de F4/F5.
- **Paths:** `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/**`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/{index.tsx,use-consultation-documents-page.ts,consultation-document-list,consultation-document-row,select-consultation-documents-dialog,tests/**}`; estados legados substituídos pelo adapter; `apps/web/tests/routes/document-production/consultation-documents.index.test.tsx`.
- **Contract:** `RF-07`, `RF-12`; `CA-07`, `CA-09`, `CA-12`, com paridade do comportamento Consultation e ausência, somente na Formalização, dos controles excluídos pela Spec.
- **Outcome:** Consulta usa a superfície neutral com o mesmo contrato observable atual, sem mudança funcional não contratada, e os testes isolados/route de Consulta continuam cobrindo seleção, geração/revisão e permissões existentes.
- **Rules:** `documentation/rules/ui-layer-rules.md` §§ “Mirror widget structure for nested components”, “Keep UI logic inside the owning widget hook”, “Widgets expose widget-specific prop types”; `documentation/rules/widget-testing-rules.md` §§ “Navigation has unit and integration boundaries”, “Completion criteria for a widget test suite”; `documentation/rules/web-app-routing-rules.md` § “Route integration tests”.
- **Exit:** `pnpm --filter web check:code`; `pnpm --filter web check:types`; focused Vitest; `pnpm --filter web exec playwright test tests/routes/document-production/consultation-documents.index.test.tsx tests/routes/document-production/consultation-document-version.test.tsx --workers=1`; comparar `Z3Ll2j`, verificar teclado/viewport estreita, console e requests falhos e registrar screenshot fresco da superfície Consultation. **Passed 2026-08-24; EV-07/EV-08.**

### F4 — Persistência, seed, REST e composição do Server

#### F4-T1 — Criar modelo, repositório, migration input e seed determinístico

- **Status/owner:** `completed` — `builder_server` (`01a038fe-e3ae-70d1-9c00-3403e056779a`, user-requested seed correction); repeated clean seed passed in EV-50.
- **Depends/parallel:** F2; pode executar em paralelo com F5 porque seus caminhos são exclusivos. A migration gerada e seus metadados ficam sob coordenação do Orchestrator em F6.
- **Paths:** `apps/server/src/formalization/constants/**`; `apps/server/src/formalization/database/**`; `apps/server/src/shared/database/drizzle/schema.ts`; `apps/server/src/shared/database/dynamic-forms-seed-data.ts`; `apps/server/src/intake/database/intake-seeder.ts`; `apps/server/src/document-production/database/document-production-seeder.ts`; `apps/server/src/shared/database/{seed.module.ts,seed.ts}`.
- **Contract:** `RF-01`, `RF-04`, `RF-06`, `RF-08`; `CA-01`, `CA-06`, `CA-08`, `CA-13`, incluindo unique `intake_id`, CAS/version, snapshots, relações por referência e limpeza/execução idempotente do seed.
- **Outcome:** o módulo Formalization possui Drizzle model/mapper/repository/seeder próprios, a seed canônica monta Intake → Consulta → Formalização → modelos documentais e nenhum módulo importa tabela/repositório de irmão.
- **Rules:** `documentation/rules/database-layer-rules.md` §§ “Database code belongs to the owning module”, “Drizzle models are declarations, not classes”, “Mappers define the persistence boundary”, “Repository contracts belong to core”, “Repository injection uses module tokens”, “Every module owns a seeder”; `documentation/rules/server-app-layer-rules.md` § “Technical layer directories own Nest modules”; `documentation/rules/code-conventions-rules.md`.
- **Exit:** fixture de Server executa contra o modelo real quando a migration integrada estiver aplicada; `db:seed` usa apenas `clear/run`, exige modo/segredo conforme as regras e produz uma única fixture lógica após execuções repetidas. A fonte corrigida agora cria uma única Intake `in_formalization` com Consultation `completed`; a linha equivalente do dataset local foi reparada sem reset amplo.

#### F4-T2 — Conectar adapters, controllers, DTOs e erros REST

- **Status/owner:** `completed` — `builder_server` (`01a03627-3518-7730-aaf1-e7514852ab0c`)
- **Depends/parallel:** F4-T1 e F2; depende dos ports Core/Validation, não da implementação Web.
- **Paths:** `apps/server/src/formalization/{decorators,rest,provision,fixtures}/**`; `apps/server/src/formalization/formalization.module.ts`; `apps/server/src/app.module.ts`; `apps/server/src/shared/rest/filters/global-error-handler.ts`; `apps/server/rest-client/formalization/formalizations.rest`.
- **Contract:** `RF-01`–`RF-11`; `CA-01`–`CA-11`, com 401/403/404/409/400 estáveis, controller fino, actor atual resolvido no Server, DTOs sem PII indevida, geração sem source do browser e nenhum endpoint de batch/assinatura.
- **Outcome:** cada ação da interface REST tem controller próprio e `ApiResponse`, adapters usam ports dos módulos proprietários, `FormalizationModule` preserva o bootstrap Nest e o REST client cobre todas as rotas sem secrets.
- **Rules:** `documentation/rules/rest-layer-rules.md` §§ “Grouped routes use a module decorator”, “One controller represents one application action”, “Controllers instantiate use cases once”, “Request body types come from the use case”, “Controllers document HTTP responses”, “Every route group has a REST client file”, “Shared errors use one global REST handler”; `documentation/rules/server-app-layer-rules.md`; `documentation/rules/code-conventions-rules.md`.
- **Exit:** testes de controller usam HTTP real e fixture real, cobrem payload/status/persistência, rejeitam outro advogado e permitem administrador sem alterar a ownership projection; `pnpm --filter server check:code`; `pnpm --filter server check:types`; `pnpm --filter server build`, sem `UnknownDependenciesException`.

#### F4-T3 — Provar REST, autorização, geração e convergência em integração

- **Status/owner:** `completed` — `builder_server` (`01a038fe-e3ae-70d1-9c00-3403e056779a`, reviewer rollback correction); real post-insert rollback passed in EV-45.
- **Depends/parallel:** F4-T2; mantém o mesmo `builder_server` e não cria testes de repository/mapper isolados.
- **Paths:** `apps/server/src/formalization/rest/controllers/tests/**`; `apps/server/src/formalization/fixtures/formalization-module-fixture.ts`; testes de regressão do job/Document Production somente quando o contrato existente for diretamente afetado.
- **Contract:** `CA-01`–`CA-03`, `CA-05`–`CA-11`, `CA-13`; `RF-02`, `RF-08`–`RF-10`.
- **Outcome:** cada controller tem teste HTTP próprio com Testcontainers/RestFixture, verifica 403 sem payload/efeito, corrida idempotente, source exato, freshness/terminalidade, retry de fechamento e ausência de assinatura/contratação.
- **Rules:** `documentation/rules/controllers-testing-rules.md` §§ “Controller tests are integration tests”, “One test file per controller”, “Use real infrastructure and minimize mocks”, “Build the test application with real module wiring”, “Assert the HTTP and persistence contracts”; `documentation/rules/database-layer-rules.md` § “Repositories do not receive tests”; `documentation/rules/messaging-layer-rules.md` §§ “The originating module builds authoritative event data”, “Direct publication is the MVP reliability boundary”.
- **Exit:** `pnpm --filter server test -- src/formalization` e a regressão de Document Production passam com banco real, evento/source verificável e nenhum teste dependente de mock para substituir persistência/autorização.

### F5 — Página, rotas e jornada Web da Formalização

#### F5-T1 — Expor serviço REST, contexto, rotas protegidas e queries/actions

- **Status/owner:** `completed` — `builder_web` (`01a03610-4ea8-7313-8821-38c351a9e3bf`)
- **Depends/parallel:** F2 e F3; pode executar em paralelo com F4 sob o REST Contract congelado na Spec; a verificação real contra Server fica em F6.
- **Paths:** `apps/web/src/rest/services/formalization-service.ts`; `apps/web/src/ui/shared/contexts/rest-context/{use-rest-context-provider.ts,types/rest-context-value.ts,tests/rest-context.test.tsx}`; `apps/web/src/constants/routes.ts`; `apps/web/src/routes/formalizacoes/**`; `apps/web/src/ui/formalization/hooks/**`. O `apps/web/src/routeTree.gen.ts` é artefato gerado e pertence ao Orchestrator em F6.
- **Contract:** `RF-01`–`RF-03`, `RF-05`, `RF-10`–`RF-12`; `CA-01`–`CA-05`, `CA-11`, `CA-12`.
- **Outcome:** serviço factory mapeia todos os endpoints sem enviar source snapshot, contexto autentica uma única instância, rotas usam `requireAuthMiddleware`/parâmetro `formalizationId`, queries/actions preservam erros/issues e o caminho canônico de review é tipado.
- **Rules:** `documentation/rules/rest-layer-rules.md` §§ “Services implement REST contracts”, “Web REST transport owns session headers”; `documentation/rules/ui-layer-rules.md` §§ “REST adapters are factories”, “REST services are composed by the context provider”, “Route constants are canonical paths”, “Route protection uses one middleware”, “Imperative navigation uses the application hook”; `documentation/rules/web-app-routing-rules.md` §§ “Canonical paths live in ROUTES”, “TanStack Router route declarations”, “Generated route tree”.
- **Exit:** `pnpm --filter web check:code`; `pnpm --filter web check:types`; `pnpm --filter web generate-routes` via Orchestrator para o artefato; route test confirma redirect/auth, URL/params e método/path/body. Para a página nova, comparar a árvore de widgets com `F2GBfU`, executar teclado/narrow viewport, inspecionar console/failed requests e registrar screenshot fresco quando o estado da página estiver integrado. O replay real de F6-T2 deve confirmar request/response e resultado de persistência/autorização; o transporte mockado não encerra a evidência server-backed.

#### F5-T2 — Renderizar condições comerciais e estados da página

- **Status/owner:** `completed` — `builder_web` (`01a0366b-809d-7573-80ca-12fb8945ebab`, visual evidence and correction follow-ups complete)
- **Depends/parallel:** F5-T1; F3-T1 fornece o widget documental neutral. A página mantém composição explícita; hooks são o dono da lógica.
- **Paths:** `apps/web/src/ui/formalization/widgets/pages/formalization-page/**`; `apps/web/src/ui/shared/widgets/dynamic-form/dynamic-form-fields/**`; `apps/web/src/ui/formalization/**/tests/**`.
- **Contract:** `RF-03`–`RF-07`, `RF-09`–`RF-12`; `CA-03`–`CA-12`, com snapshot-driven rendering, draft/close/reopen, locks, stale, dialogs, terminal read-only e placeholders de assinatura/contratação.
- **Outcome:** `FormalizationPage` reproduz a hierarquia Pencil, `CommercialConditionsCard` e DynamicFormFields não codificam labels/options/valores do seed, erros são associados por `FieldError`, e todos os estados de carregamento/erro/forbidden/locked/stale/pending/sucesso têm copy acessível.
- **Rules:** `documentation/design.md` §§ “Visão Geral”, “Tipografia”, “Forma (Radius)”, “Acessibilidade” e recomendações de contraste; `documentation/rules/ui-layer-rules.md` §§ “Mirror widget structure for nested components”, “Keep UI logic inside the owning widget hook”, “Shared wrappers own third-party UI boundaries”, “Use shared HTTP status constants”; `documentation/rules/widget-testing-rules.md` §§ “Separate widget tests from hook tests”, “Minimum behavior matrix for stateful widgets”, “Use Vitest and Testing Library”.
- **Exit:** testes de widget/hook cobrem matriz de estados e diálogos; comparação independente e screenshot Playwright CLI fresco para `F2GBfU` (1200×1828), `zetNe` (957×398), `b2f2jS` (673×392), `nFKJE` (673×412), `ZLBTF` (673×453) e `USNIG` (673×505), sempre com árvore de widgets da Spec, teclado, narrow viewport, dark mode, console e failed requests. **Passed; EV-07, EV-10, VIS-01–VIS-07.**

#### F5-T3 — Integrar Intake, fixture de browser e fluxo de rota

- **Status/owner:** `completed` — `builder_web` (`01a03610-4ea8-7313-8821-38c351a9e3bf`, route/fixture corrections); official Formalization route suite passed 4/4 and current visual artifacts are retained.
- **Depends/parallel:** F5-T1/F5-T2; F4 é necessário apenas para a validação real de F6, enquanto esta cobertura usa fixture stateful com transporte explicitamente mockado.
- **Paths:** `apps/web/src/ui/intake/widgets/pages/intake-details-page/{use-intake-details-page.ts,intake-details-content/index.tsx,tests/intake-details-page.test.tsx}`; `apps/web/tests/fixtures/document-production-fixture.ts`; `apps/web/tests/routes/formalization/formalization.index.test.tsx`; `apps/web/tests/routes/document-production/consultation-documents.index.test.tsx`.
- **Contract:** `RF-01`, `RF-03`, `RF-07`, `RF-10`–`RF-12`; `CA-01`, `CA-03`, `CA-07`–`CA-12`. O transporte mockado prova somente o contrato UI/REST; não substitui MV-01/MV-02 real.
- **Outcome:** Intake inicia/abre por create-or-get e não expõe contratação direta; a rota cobre reload, falha/retry, draft/close/reopen, geração individual, review, confirmação/closure, ausência de batch/download e estados de acesso.
- **Rules:** `documentation/rules/web-app-routing-rules.md` §§ “Route integration tests”, “Route failure boundaries”, “Required validation”; `documentation/rules/widget-testing-rules.md` §§ “Navigation has unit and integration boundaries”, “Completion criteria for a widget test suite”; `documentation/rules/ui-layer-rules.md` §§ “Action hooks”, “Use shared HTTP status constants”; `documentation/rules/code-conventions-rules.md`.
- **Exit:** `pnpm --filter web test:integration tests/routes/formalization/formalization.index.test.tsx`; `pnpm --filter web test:integration tests/routes/document-production/consultation-documents.index.test.tsx`; a suíte verifica URL, método/path/body/resposta e outcome visível, além de 390×844, teclado, foco, overflow, console e failed requests. Comparar a árvore de widgets da Spec para `F2GBfU`, os diálogos aplicáveis (`b2f2jS`, `nFKJE`, `ZLBTF`, `USNIG`) e os estados Intake `qxkrh`/`WNe1f`, com screenshots frescos como artefatos transitórios identificados na Evaluation. O replay real de F6-T2 deve confirmar request/response, persistência e autorização; mocks não substituem essa evidência. O estado `WNe1f` permanece dependente de um contrato de leitura de Formalization por Intake.

### F6 — Integração, artefatos gerados e validação executável

#### F6-T1 — Gerar artefatos e executar o Quality Gate integrado

- **Status/owner:** `completed` — `orchestrator`
- **Depends/parallel:** F4 e F5 integrados; sem Builder concorrente.
- **Paths:** `apps/server/src/shared/database/drizzle/migrations/**` e `meta/**` gerados pelo Drizzle; `apps/web/src/routeTree.gen.ts` gerado pelo TanStack Router; `evaluation.md` criado pelo kickoff de `implement-spec`; nenhum lockfile/dependência nova sem decisão explícita.
- **Contract:** todos os `RF-*`/`CA-*`; especialmente `CA-01`, `CA-06`, `CA-12`, `CA-13` e o Quality Gate da Spec.
- **Outcome:** migrations/meta e route tree representam os sources atuais, não há artefato gerado editado manualmente, o commit integrado compõe Nest sem erro e a Evaluation contém evidência corrente/identificadores transitórios.
- **Rules:** `documentation/rules/sdd-rules.md` §§ “Durable artifacts”, “Implementation and living evidence”, “Integrated validation”; `documentation/tooling.md`; `documentation/rules/database-layer-rules.md` §§ “Drizzle models are declarations, not classes”, “Every module owns a seeder”; `documentation/rules/web-app-routing-rules.md` § “Generated route tree”.
- **Exit:** `pnpm --filter server db:migration:generate`; `pnpm --filter server db:migration:apply`; `pnpm --filter server db:seed`; `pnpm --filter @hms/core test`; `pnpm --filter @hms/validation test`; `pnpm --filter server test`; `pnpm --filter web test`; `pnpm --filter server check:code`; `pnpm --filter server check:types`; `pnpm --filter server build`; `pnpm --filter web generate-routes`; `pnpm --filter web check:code`; `pnpm --filter web check:types`; `pnpm --filter web build`.

#### F6-T2 — Executar MV-01/MV-02 com serviços reais e evidência visual

- **Status/owner:** `completed` — `orchestrator`, reviewer evidence refresh; EV-45, EV-49, EV-50 and EV-51 pass.
- **Depends/parallel:** F6-T1 e artefatos/fixtures aplicados; não considerar testes `page.route` como prova server-backed.
- **Paths:** `./evaluation.md` e artefatos ignorados de Playwright/CI; não criar diretório local `evidence/`.
- **Contract:** `CA-01`–`CA-13`; `MV-01` fluxo do advogado associado e `MV-02` limites de autorização (outro advogado é rejeitado, administrador é permitido).
- **Outcome:** o fluxo autenticado real prova start idempotente, persistência/erros do formulário, locks/revisões/freshness, geração/review/terminalidade, confirmação sem assinatura, fechamento sem contratação e acesso proibido, com light/dark, desktop/narrow e teclado.
- **Rules:** `documentation/rules/sdd-rules.md` § “Integrated validation”; `documentation/tooling.md`; `documentation/rules/controllers-testing-rules.md` §§ “Use real infrastructure and minimize mocks”, “Assert the HTTP and persistence contracts”; `documentation/rules/web-app-routing-rules.md` § “Required validation”; `AGENTS.md` workflow de browser autenticado.
- **Exit:** confirmar `docker compose ps -a`, `curl http://localhost:8000/auth/v1/health` e `curl http://localhost:3333/health`; iniciar sessões persistentes Server/Web, autenticar pelo `/login` com credenciais resolvidas do seeder/env, validar URL e conteúdo autenticado, executar MV-01/MV-02, capturar accessibility snapshots/screenshots/trace quando aplicável e classificar cada console error, hydration warning, auth refresh failure e 4xx/5xx como esperado, corrigido, preexistente ou bloqueador.

### F7 — Revisão integrada read-only

#### F7-T1 — Auditar candidato integrado e revalidar superfícies de risco

- **Status/owner:** `completed` — `reviewer` (`01a0368c-9323-7dc1-a5d4-06aff0ce1fb9`, final same-reviewer recheck completed)
- **Depends/parallel:** F6 completo; exatamente um Reviewer para todo o candidato. Correções retornam ao Builder proprietário via `implement-spec` e reativam este mesmo Reviewer.
- **Paths:** candidato integrado completo; Core/Validation/Server/Web/documentação afetados, sem editar arquivos.
- **Contract:** todos os `RF-*`, `CA-*`, `MV-*`, Design Contract e Rule Pack; atenção especial a autorização, source imutável, revisão/freshness, seed/migration e regressão Consultation.
- **Outcome:** relatório read-only verifica contratos entre Builders, caminhos não sobrepostos, diferenças de cada screenshot, árvore de widgets, keyboard/narrow, console/network e os fluxos de maior risco; o relatório não é evidência oficial até o Orchestrator verificar cada achado.
- **Rules:** `documentation/rules/sdd-rules.md` §§ “Roles”, “Implementation and living evidence”, “Integrated validation”; todos os Rule Pack paths aplicáveis já registrados nos cards F1–F6; não editar Spec/Plan/Evaluation nem implementar correções.
- **Exit:** Reviewer concluído; Orchestrator registra findings aceitos na Evaluation, invalida evidência afetada, retoma o Builder responsável e repete os exits. Só concluir quando não houver finding bloqueador ativo.

# Validation and handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Runtime | Core Formalization and validator unit suites | `CA-01`–`CA-11` | Spec Validation Contract — Core | `./evaluation.md` | `passed` |
| Static | Core public contracts | all Core RF/CA | Spec commands | `./evaluation.md` | `passed` |
| Runtime | Validation schemas | `CA-04`, `CA-05`, `CA-11` | Spec Validation Contract — Validation | `./evaluation.md` | `passed` |
| Runtime | Server controllers, persistence, authorization and source/event | `CA-01`–`CA-03`, `CA-05`–`CA-11`, `CA-13` | Spec Validation Contract — Server | `./evaluation.md` | `passed` |
| Runtime | Drizzle migration and deterministic seed | `CA-01`, `CA-06`, `CA-13` | Spec migration/seed commands | `./evaluation.md` | `passed` |
| Runtime | Web widgets/routes with mocked transport | `CA-03`–`CA-12` | `formalization.index.test.tsx` and widget suites | `./evaluation.md` | `passed` |
| Runtime | Consultation source-neutral regression | `CA-07`, `CA-09` | `consultation-documents.index.test.tsx` | `./evaluation.md` | `passed` |
| Static | Web generated/static/build checks | Web delta | Spec Web commands | `./evaluation.md` | `passed` |
| Manual | `MV-01` — assigned-lawyer end-to-end | `CA-01`–`CA-13` | Spec `MV-01` | `./evaluation.md` | `passed` |
| Manual | `MV-02` — authorization boundaries | `CA-03` | Spec `MV-02` | `./evaluation.md` | `passed` |
| Visual | Formalization page, `F2GBfU`, 1200×1828 | `CA-03`, `CA-10`–`CA-12` | [`design/F2GBfU.png`](./design/F2GBfU.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Visual | Commercial conditions, `zetNe`, export 957×398 | `CA-04`–`CA-06` | [`design/zetNe.png`](./design/zetNe.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Visual | Document package, `Z3Ll2j`, export 945×401 | `CA-07`–`CA-09` | [`design/Z3Ll2j.png`](./design/Z3Ll2j.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Visual | Close-form dialog, `b2f2jS`, export 673×392 | `CA-06` | [`design/b2f2jS.png`](./design/b2f2jS.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Visual | Reopen-form dialog, `nFKJE`, export 673×412 | `CA-06`, `CA-07` | [`design/nFKJE.png`](./design/nFKJE.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Visual | Package-confirmation dialog, `ZLBTF`, export 673×453 | `CA-10` | [`design/ZLBTF.png`](./design/ZLBTF.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Visual | Close-without-contract dialog, `USNIG`, export 673×505 | `CA-11` | [`design/USNIG.png`](./design/USNIG.png) | Fresh Playwright screenshot path/CI artifact in `./evaluation.md` | `passed` |
| Review | Integrated candidate and affected surfaces | all RF/CA/MV and Design Contract | Integrated Reviewer contract | Reopened same-reviewer audit plus final follow-up in `./evaluation.md` | `completed` |

The seven supplied references above have completed inventory and verified PNG dimensions in `design/manifest.md`. The manifest classifies loading, error, forbidden, locked, stale and other transient states as recommended supplemental screenshots rather than required pre-implementation references; the Orchestrator must resolve that decision in Evaluation and add captures if the final comparison exposes an acceptance gap.

Final handoff is allowed only when every task/phase and coverage row is `completed`, the Spec revision remains 8, all Spec commands are current on the integrated candidate, migrations/generated route artifacts are reviewed, services/accounts/fixtures are ready, both `MV-*` scenarios are executable with real server-backed evidence, all seven visual comparisons and additional-screenshot decisions are resolved, `reviewer` has completed and every verified finding is resolved. Then route directly to `conclude-spec`.
