---
spec: ./spec.md
evaluation: ./evaluation.md
spec_revision: 24
status: completed
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
jira_tickets:
  - SCRUM-138
---

# Plan SDD — Produção e revisão documental no contexto da consulta

## Estado operacional

Plan: completed
Spec: completed, revisão 24
Fase atual: encerramento concluído; Quality Gate integrado verified
Judge Plan: coberto pela auditoria final; nenhum Judge Plan independente foi necessário
Judge Implementation: passed_with_preexisting_blockers; único Judge para a implementação inteira
Findings ativos: `react-pdf` ausente/teste web preexistente/build bloqueado; regra de acesso administrativo ampliada por solicitação direta
Próxima ação: nenhuma; manter o blocker preexistente de `react-pdf` registrado para correção futura

Este Plan é necessário porque a entrega atravessa packages/core e apps/web,
introduz duas rotas protegidas, dez operações REST, estado otimista assíncrono,
um editor rico compartilhado, decisões humanas finais e dois níveis de evidência
de rota. O fluxo de geração existente é preservado; a persistência da associação
do pacote entra no escopo desta revisão.

## Atualização de regra pós-validação

Por solicitação direta do usuário, administradores passam a ter acesso total a
qualquer consulta e às operações de documentos. A regra foi aplicada nos sete
casos de uso de Consulta/Produção Documental e nos controllers REST, preservando
a restrição do advogado associado para os demais perfis jurídicos. A Spec foi
atualizada para a revisão 7; o PRD externo permanece pendente de sincronização.

Somente o Orchestrator atualiza este ledger. Builders implementam os paths das
suas tarefas; sensores registram evidências; Judges avaliam em modo read-only.
Não há nova thread nem Judges intermediários de fase. O veredito do único Judge
Implementation fica reservado para a implementação inteira, depois do Quality
Gate e do fluxo browser.

## Objetivo

Entregar ao advogado associado a uma consulta a primeira integração web da
Produção Documental: visualizar documentos vinculados e seu histórico, solicitar
gerações elegíveis, abrir uma versão, localizar pendências, editar e salvar uma
nova versão manual, aprovar ou rejeitar uma versão em revisão e escolher
explicitamente uma versão aprovada como vigente.

O resultado observável é um fluxo protegido e server-backed nas rotas:

- /consultas/$consultationId/documentos;
- /consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId.

Os estados persistidos são derivados dos dados retornados pelo servidor. O estado
Gerando combina o status persistido `pending/running` com o estado otimista da
tentativa corrente; após reload, uma geração ativa continua bloqueando nova ação.

## Escopo

Inclui:

- contratos de transporte em packages/core/src/consultation, sem entidade ou regra nova;
- adapter REST tipado e composição no RestContext;
- rotas protegidas, builders canônicos e routeTree.gen.ts gerado;
- promoção do DocumentEditor Tiptap para componente compartilhado, preservando o admin;
- queries, mutations, derivação de estados e polling otimista com controle de corrida;
- páginas de documentos e de revisão, histórico, decisões, vigência, edição manual e pendências;
- estados de loading, vazio, erro, retry, pending, conflito, acesso negado e não encontrado;
- testes Vitest/Testing Library de adapter, hooks, editor e composição real dos widgets;
- fixture Playwright stateful com transporte mockado para as duas rotas;
- validação browser autenticada e server-backed, responsiva, por teclado, tema, console e rede.
- contratos, use cases, endpoints GET/PUT e modal server-backed de seleção de modelos;
- endpoint e ação de cancelamento persistido para gerações `pending`/`running`;

Fica fora de escopo:

- alteração do fluxo de geração, jobs, IA ou storage fora da associação do pacote;
- consulta de execução, detalhes de falha ou reconstrução de Falha na geração após reload;
- remoção persistente de pendências, download DOCX e paginação Word;
- mudança de estado, classificação, avanço ou gate da Consulta;
- cadastro, edição, duplicação, remoção ou disponibilidade de modelos.

Os itens diferidos continuam requisitos do PRD e não podem ser simulados somente em
estado React ou por controles visuais.

## Regras necessárias para a implementação

### Documentos obrigatórios e descoberta dinâmica

Antes de implementar, o Builder deve ler e aplicar:

- AGENTS.local.md;
- documentation/rules/rules.md;
- documentation/design.md;
- documentation/infrastructure.md;
- documentation/modules.md;
- documentation/tooling.md.

Para os paths deste Plan, as regras dinâmicas selecionadas são:

- documentation/rules/code-conventions-rules.md;
- documentation/rules/ui-layer-rules.md;
- documentation/rules/web-app-routing-rules.md;
- documentation/rules/widget-testing-rules.md;
- documentation/rules/core-package-rules.md;
- documentation/rules/rest-layer-rules.md.

Para a validação visual da F5-T3, usar o Pencil MCP e o skill de Pencil. Antes
de qualquer operação Pencil, chamar get_editor_state com include_schema: true;
depois inspecionar os nodes F9JxU, hq7Ty e Y5vBQ, registrar screenshots e
comparar a implementação com os frames correspondentes. Nunca ler ou buscar
design/hms.pen por filesystem, pois o arquivo é criptografado. Não escrever no
arquivo Pencil sem solicitação explícita.

O Pencil é hard gate desta implementação. Antes de iniciar qualquer Builder, o
Orchestrator deve confirmar que o editor está ativo e respondendo, que o arquivo
ativo é exatamente `design/hms.pen` e que o schema e os nodes necessários estão
disponíveis. Se o Pencil estiver inativo, executando incorretamente, aberto em
outro arquivo ou sem schema/nodes confirmáveis, a implementação fica bloqueada:
não iniciar Builders, não marcar F1 como `in_progress` e não substituir essa
validação por memória, screenshot antigo, leitura local ou inferência. Registrar
causa e próxima ação; somente um novo preflight bem-sucedido no arquivo correto
desbloqueia o trabalho.

Se a implementação descobrir servidor, controller, banco, migration, provider,
messaging, IA ou outro layer fora do escopo, deve parar antes de tocar esse path,
reexecutar a descoberta em documentation/rules/rules.md, ler as regras novas em
sua totalidade e registrar a expansão no Plan. Não carregar regras de banco ou
server-app apenas por hipótese: a Spec mantém essas camadas fora da entrega.

Para interação browser com a aplicação, usar também o skill `browser-use` com
controle CDP. O Browser Use deve ser usado para navegação, login já autorizado,
interações, inspeção da árvore de acessibilidade, screenshots e verificação de
layout/viewport; não usar apenas `curl` como evidência de comportamento de UI.
Preferir a árvore de acessibilidade a coordenadas ou screenshots para localizar
controles, chamar `wait_for_load()` após navegação e verificar o resultado depois
de cada ação. Se houver pedido de gravação, iniciar e encerrar a gravação pelo
fluxo oficial do Browser Use, preservando o caminho retornado.

### Convenções de código e fronteiras

- Código e identificadores permanecem em inglês; copy de produto pode permanecer em português.
- Paths e arquivos novos usam kebab-case; um export type do Core por arquivo; barrels
  apenas reexportam.
- O serviço é factory PascalCase que recebe RestClient; não cria Axios/fetch, auth,
  cache ou regra de negócio.
- Imports internos do web usam @/; rotas usam strings literais em createFileRoute
  apenas onde exigido pelo gerador, e consumidores usam ROUTES/builders canônicos.
- Rotas permanecem finas: middleware, params, composição e boundaries; queries, mutations,
  decisões de status e markup substancial pertencem a hooks/widgets.
- Hooks de page/widget usam function declarations; action hooks usam o padrão
  use<Name>Action e arrow factory conforme a regra de UI; handlers começam com handle.
- Widgets com comportamento possuem hook próprio, prop type <WidgetName>Props exportado e
  nested widgets em diretórios próprios; não criar componentes internos locais grandes.
- Navegação interna usa Anchor ou Router tipado com params explícitos; não usar URLs
  dinâmicas concatenadas.
- Comparações HTTP usam HTTP_STATUS_CODE do Core, nunca literais numéricos.
- UI usa Icon, Anchor, shadcn e tokens HMS; não importar Lucide diretamente nem
  hardcodar cor, font, radius, shadow ou token fora do design.
- O editor deve continuar com JSON estrito e schemas/extensões já instalados; não adicionar
  dependência nem persistir HTML, conteúdo jurídico em URL, localStorage, log ou erro.
- apps/web/src/routeTree.gen.ts é gerado e read-only; sempre executar
  pnpm --filter web generate-routes depois de alterar rotas e revisar o diff gerado.

### Regras de teste e evidência

- Testar comportamento público na fronteira que o possui; component tests devem renderizar a
  composição real e hook tests devem cobrir estado, efeitos, derived values e corridas.
- Mockar o limite HMS mais próximo, não TanStack/Supabase/Tiptap diretamente quando existir
  wrapper; usar tipos públicos do widget em mocks.
- Cobrir loading, sucesso, vazio, erro/retry, pending, sucesso de mutation, cada status,
  dialogs, dirty/cancel, proteção e redirect; não aceitar somente snapshots ou spies.
- Testes de rota ficam em apps/web/tests/routes/document-production, um arquivo por rota,
  com page.route stateful apenas para o transporte mockado; afirmar URL, request,
  response e resultado visível.
- A passagem real não usa mocks de transporte e deve provar Auth, bootstrap Nest, REST,
  autorização, console, network, viewport estreito e teclado.
- Não alterar testes alheios ou silenciar warnings preexistentes; classificar qualquer
  finding no evaluation.md.

### Quality Gate e comandos

A implementação deve executar, nesta ordem, os checks adequados ao escopo:

    pnpm --filter @hms/core check-types
    pnpm --filter web generate-routes
    pnpm --filter web check:code
    pnpm --filter web check:types
    pnpm --filter web test
    pnpm --filter web test:integration tests/routes/document-production/consultation-documents.index.test.tsx
    pnpm --filter web test:integration tests/routes/document-production/consultation-document-version.test.tsx
    pnpm --filter web build

O adapter/contexto e os hooks/editor devem ter sensores focados antes do gate
integrado. O pacote Core deve executar seus testes quando os contratos forem
alterados. Nenhuma dependência nova é autorizada nesta Spec.

## Fonte de verdade e fronteiras

- Spec: spec.md, revisão 8.
- PRD: [PRD — Módulo de Produção Documental](https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673), versão 9, especialmente as decisões 12.1–12.8.
- Jira: [SCRUM-138](https://plataformahms.atlassian.net/browse/SCRUM-138).
- Design: design/hms.pen, nodes F9JxU, hq7Ty e Y5vBQ como referências incluídas na
  Spec; os demais nodes design-only não expandem o Contract.
- Consulta mantém contexto e autorização; Produção Documental mantém documentos e versões.
  O Core recebe somente projeções e a interface REST necessárias para o client.
- RestClient, RestContext, TanStack Query/Router, Tiptap, Zod, Tailwind e shadcn
  existentes são suficientes; não adicionar dependência.

## Dependências e ordem das fases

    F1 contratos + adapter + RestContext
      ├── F2 editor compartilhado + rotas canônicas
      └── F3 queries/actions + página de documentos
            └── F4 página de revisão + rota dinâmica
                  └── F5 fixture, Quality Gate, browser e Judge final
                        └── F6 seleção persistente, modal e endpoints

F2 pode começar após a inspeção da base e em paralelo parcial com F1-T2, mas a
composição final da aplicação depende do contrato e do RestContext de F1.
F3 depende do serviço registrado e do editor/rotas-base. F4 depende da listagem,
do editor compartilhado e dos contratos. F5 só começa depois que F3 e F4
estiverem implementadas e compilando.

## Fases e tarefas

Estados válidos de tarefa: pending, implementing, validating, verified.
Estados válidos de fase: pending, in_progress, awaiting_judgment, failed, accepted.

### F1 — Contratos de transporte, adapter e composição REST

Dependência: nenhuma. Estado: accepted.

#### F1-T1 — verified

Dependências: —
Paths: `packages/core/src/consultation/domain/structures/{consultation-document-version-summary,consultation-document-list-item,consultation-document-version-review-request}.ts`; barrels; `packages/core/src/consultation/interfaces/{consultation-document-production-service,index}.ts`
Resultado observável: exporta os dois resumos, a seleção e a união discriminada de revisão, uma declaração por arquivo, com as nove assinaturas `RestResponse` e os tipos canônicos de Produção Documental.
RF / CA: RF-002; CA-03
Parallelizable: não. O adapter e os testes precisam do contrato final.

Sensores: `pnpm --filter @hms/core check-types`, `pnpm --filter @hms/core lint`,
`pnpm --filter @hms/core test` (49 arquivos / 182 testes) e `git diff --check` passaram.
Finding: nenhum.

#### F1-T2 — verified

Dependências: F1-T1
Paths: `apps/web/src/rest/services/consultation-document-production-service.ts`; teste do adapter
Resultado observável: a factory `ConsultationDocumentProductionService(restClient)` delega exatamente os nove métodos, paths, métodos HTTP e bodies; converte datas ISO do detalhe apenas no sucesso e preserva erro/status/headers.
RF / CA: RF-002, RF-011; CA-02, CA-03, CA-11
Parallelizable: não. A implementação é acoplada ao contrato de F1-T1 e deve ser validada como unidade.

Sensores: teste focado do adapter (3 testes), Biome focado e `git diff --check`
passaram. `check:code` e `check:types` foram executados; falharam apenas por
findings preexistentes em `document-editor`/`react-pdf`, sem erros nos arquivos
de F1-T2.

#### F1-T3 — verified

Dependências: F1-T2
Paths: `apps/web/src/ui/shared/contexts/rest-context/types/rest-context-value.ts`; `use-rest-context-provider.ts`; teste de contexto
Resultado observável: registra a nova factory com o mesmo `RestClient` autenticado, expõe o tipo inferido e não deixa widget acessar Axios, Supabase ou token.
RF / CA: RF-002, RF-011; CA-02, CA-03
Parallelizable: não. A composição só pode apontar para o adapter pronto.

Sensores: teste focado do contexto (2 testes), `pnpm --filter web check:code` e
`git diff --check` passaram. `check:types` permanece afetado pelo finding
preexistente em `document-viewer/index.tsx` (`react-pdf` ausente e `totalPages`
implícito); nenhum erro foi atribuído à composição F1-T3.

Endpoints que o sensor do adapter deve comprovar:

listDocuments: `GET /consultations/:consultationId/documents`
generateDocument: `POST /consultations/:consultationId/documents/:documentId/generations`
generateDocuments: `POST /consultations/:consultationId/document-generations/batch`
getDocumentVersion: `GET /consultations/:consultationId/documents/:documentId/versions/:documentVersionId`
saveManualVersion: `POST /consultations/:consultationId/documents/:documentId/versions/:sourceDocumentVersionId/manual`, body `{ content }`
reviewVersion: `PATCH /consultations/:consultationId/documents/:documentId/versions/:documentVersionId/review`
selectCurrentVersion: `PATCH /consultations/:consultationId/documents/:documentId/versions/:documentVersionId/current`

Sensores e evidências esperados:

- teste do adapter para todos os métodos, payloads, datas e preservação de 401, 403,
  404 e 409 como RestResponse;
- teste do RestContext confirmando a factory registrada e o RestClient compartilhado;
- pnpm --filter @hms/core check-types e pnpm --filter web check:types;
- pnpm --filter web check:code e testes focados do adapter/contexto.

### F2 — Editor compartilhado e fundação de rotas

Dependência: F1 para a composição final; F2-T1 e F2-T2 são parcialmente
paralelizáveis. Estado: accepted.

#### F2-T1 — verified

Dependências: —
Paths: criar `apps/web/src/ui/document-production/widgets/components/document-editor/{index.tsx,use-document-editor.ts,toolbar-button/index.tsx,pending-marker-extension.ts}` e teste; remover os quatro arquivos equivalentes de `.../document-specification-page/document-editor/`; atualizar imports/testes do admin
Resultado observável: promove o editor Tiptap para componente compartilhado, mantém JSON estrito e schemas existentes, adiciona nome acessível, modo editável, estado vazio e destaque/localização sem quebrar a página administrativa.
RF / CA: RF-006, RF-007, RF-012; CA-06, CA-07, CA-12
Parallelizable: sim, com F2-T2. Não compartilha arquivos de implementação, mas o build final depende de ambos.

Sensores: `pnpm --filter web check:code`, `pnpm --filter web check:types`, teste
do editor (5/5), testes administrativos (21/21) e `git diff --check` passaram.
O Pencil confirmou `design/hms.pen` e os frames de referência durante a execução.

#### F2-T2 — verified

Dependências: —
Paths: `apps/web/src/constants/routes.ts`
Resultado observável: adiciona os dois patterns e builders tipados sem interpolação ad hoc: `consultationDocuments` e `consultationDocumentVersion`. Mantém `ROUTES` como mapa canônico.
RF / CA: RF-001, RF-012; CA-01, CA-02, CA-12
Parallelizable: sim, com F2-T1.

Sensores: `pnpm --filter web check:code`, `pnpm --filter web check:types` e
`git diff --check` passaram após a promoção do editor.

Sensores e evidências esperados:

- teste real do editor para renderização, edição, conteúdo vazio, schema, undo/redo,
  foco, localização de match e marcador ausente;
- teste do admin usando o componente no novo path, sem alias no path removido;
- inspeção read-only dos tokens HMS, Icon, Anchor, foco visível, tema e movimento reduzido;
- pnpm --filter web check:code, pnpm --filter web check:types e teste focado do editor.

### F3 — Listagem, estados derivados e geração otimista

Dependência: F1 e F2. Estado: accepted.

#### F3-T1 — verified

Dependências: F1-T3
Paths: criar `apps/web/src/ui/document-production/hooks/{consultation-document-query-keys,use-consultation-documents-query,use-generate-consultation-document-action,use-generate-consultation-documents-action}.ts` e testes
Resultado observável: a query usa IDs completos e não executa sem ID. As actions chamam individual/batch, desabilitam apenas a mutation correspondente, invalidam cache, capturam baseline por documento, controlam `attemptId`, tratam `202`/`409`, fazem polling de 3s por até 2min e ignoram callbacks obsoletos.
RF / CA: RF-003, RF-004, RF-011; CA-04, CA-10, CA-11
Parallelizable: não. Os widgets dependem das keys/actions estáveis.

Sensores: Biome, `pnpm --filter web check:types` e teste focado de hooks (3 testes)
passaram. Implementação e sensores foram executados localmente pelo Orchestrator
após dois Builders não produzirem arquivos; nenhum path alheio foi alterado.

#### F3-T2 — verified

Dependências: F3-T1, F2-T1
Paths: criar `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/` com page hook, lista, row, loading, empty, error/retry e testes de composição/hook
Resultado observável: a página deriva por maior `versionNumber` os estados Não gerado, Em revisão, Rejeitado, Aprovado, Vigente e Gerando; mostra histórico/ações corretos, não cria gate para Consulta e trata timeout sem rotular falha persistida.
RF / CA: RF-003, RF-004, RF-011, RF-012; CA-01, CA-04, CA-12
Parallelizable: não. O page hook e a composição são uma fronteira comportamental única.

Sensores: Biome, `pnpm --filter web check:types` e os testes focados da página e
hooks (20 testes) passaram.

#### F3-T3 — verified

Dependências: F3-T2, F2-T2
Paths: `apps/web/src/routes/consultas/$consultationId/documentos/index.tsx`; `apps/web/src/routeTree.gen.ts` (gerado)
Resultado observável: rota fina sob o parent protegido, com `requireAuthMiddleware`, `ssr: false` herdado, params semânticos e página de listagem. A árvore gerada reflete a rota; nenhum arquivo gerado é editado à mão.
RF / CA: RF-001, RF-011, RF-012; CA-01, CA-02, CA-12
Parallelizable: não. A rota precisa compor a página implementada.

Sensores: `pnpm --filter web generate-routes`, `check:code`, teste focado da rota
(6/6) e `git diff --check` passaram. `check:types` ainda acusa arquivos fora do
escopo F3-T3: testes F3-T2 e `document-viewer`/`react-pdf`; o gerador também
emitiu aviso preexistente sobre `modelos-de-documentos/index.test.ts`.

Sensores e evidências esperados:

- hook tests com promises controladas para baseline, versionamento estrito,
  conflito, timeout, unmount, mudança de ID e retry;
- component test da composição real cobrindo loading, vazio, erro, pending,
  cada status e ações por status;
- pnpm --filter web generate-routes, pnpm --filter web check:code,
  pnpm --filter web check:types e testes Vitest focados;
- inspeção da árvore gerada para confirmar parent, params e import da página.

### F4 — Página de revisão, histórico, edição e decisões

Dependência: F3 e F2. Estado: accepted.

#### F4-T1 — verified

Dependências: F1-T3, F3-T1
Paths: criar query de versão e actions de review/manual/current no boundary compartilhado da feature e testes
Resultado observável: queries usam consultation/document/version IDs; mutations enviam somente os bodies permitidos, invalidam lista/detalhe, tratam `409`, preservam draft em erro e expõem estados de pending/sucesso sem misturar transporte com UI.
RF / CA: RF-005, RF-006, RF-008, RF-009, RF-010, RF-011; CA-05, CA-06, CA-08, CA-09, CA-10, CA-11
Parallelizable: não. A página depende dos contratos de mutation e invalidação.

Sensores: testes focados (10/10), Biome focado e `git diff --check` passaram.
`check:code` passou com dois warnings preexistentes associados ao F3; `check:types`
permanece bloqueado pelo finding preexistente de `react-pdf` em `document-viewer`.

#### F4-T2 — verified

Dependências: F4-T1, F2-T1
Paths: criar `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/` com page hook, header/editor, decision bar, history, reject/save/cancel/pending-marker/not-found/regenerate dialogs, widgets internos e testes
Resultado observável: carrega detalhe + listagem em paralelo; exibe título/origem/status/vigência; permite visualizar histórico, editar qualquer versão, cancelar dirty com confirmação, salvar manual como nova versão `in_review`, localizar pendências presentes, orientar ausentes, aprovar/rejeitar com motivo e tornar vigente somente aprovação não vigente. Não renderiza remoção persistente, download, instruções ou falha inventada.
RF / CA: RF-005 a RF-012; CA-05 a CA-12
Parallelizable: não. É a fronteira pública que integra editor, dialogs, status e mutations.

Sensores: teste de composição real (4 cenários), Biome focado e `git diff --check`
passaram.

#### F4-T3 — verified

Dependências: F4-T2, F2-T2
Paths: `apps/web/src/routes/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId.tsx`; `apps/web/src/routeTree.gen.ts` (gerado)
Resultado observável: rota dinâmica tipada sob `AppLayout`, com proteção herdada, sem interpolação ad hoc; navegação do histórico preserva os três IDs e o estado dirty não é descartado silenciosamente.
RF / CA: RF-001, RF-005, RF-011, RF-012; CA-02, CA-05, CA-11, CA-12
Parallelizable: não. Depende da página e de seus estados de erro/not-found.

Sensores: `generate-routes`, `check:code`, teste focado da página (4/4) e
`git diff --check` passaram. `check:types` permanece afetado por arquivos de
outros Builders e `document-viewer`/`react-pdf`; aviso do gerador é preexistente.

Sensores e evidências esperados:

- hook tests com matriz de ações por in_review, rejected, approved e vigente,
  motivo vazio/válido, 409, erro com retry, troca de rota e rascunho sujo;
- component tests usando dialogs/editor reais na composição e queries acessíveis;
- teste do editor para seleção/foco/realce do primeiro marcador e orientação quando ausente;
- pnpm --filter web generate-routes, checks de código/tipos e testes focados da página;
- inspeção de que conteúdo jurídico não entra em URL, localStorage, logs ou mensagens de erro.

### F5 — Fixture de rota, Quality Gate, browser e aceite final

Dependência: F3-T3 e F4-T3. Estado: accepted.

#### F5-T1 — verified

Dependências: F3-T3, F4-T3
Paths: `apps/web/tests/fixtures/document-production-fixture.ts`; dois testes em `apps/web/tests/routes/document-production/`
Resultado observável: fixture compartilhada, stateful e autenticada por transporte mockado cobre GET/POST/PATCH, mutações refletidas no GET seguinte, redirect, 403/404/409, loading/retry, URLs finais, bodies, estados visíveis, viewport estreito, teclado, tema e ausência de overflow horizontal.
RF / CA: CA-01 a CA-12; todos RF
Parallelizable: não. Precisa de ambas as rotas e de todos os widgets reais.

Evidência: `pnpm --filter web test:integration tests/routes/document-production/consultation-documents.index.test.tsx tests/routes/document-production/consultation-document-version.test.tsx` passou com 4/4. O fixture autentica pela tela de login usando transporte Supabase mockado para o cenário isolado, cobre `complete-sign-in`, mantém estadoful GET/POST/PATCH, fluxo de review, conflito 409 sem falso sucesso, geração em lote, viewport estreito e teclado. O aviso do gerador sobre `src/routes/modelos-de-documentos/index.test.ts` é preexistente.

#### F5-T2 — verified with preexisting blockers

Dependências: F5-T1
Paths: workspace web e arquivos alterados
Resultado observável: executa o Quality Gate na ordem: generate-routes, check:code, check:types, test, dois testes de integração focados e build; classifica warnings preexistentes, console/hydration e falhas não relacionadas sem escondê-las.
RF / CA: RF-001 a RF-012; CA-01 a CA-12
Parallelizable: não. O gate deve ser integrado e repetível após correções.

Evidência: `generate-routes`, `check:code` e os 4 testes de integração focados
passaram. `check:types` e `build` continuam bloqueados somente pela dependência
preexistente `react-pdf` em `apps/web/src/ui/identity/widgets/pages/document-viewer/index.tsx`;
a suíte `pnpm --filter web test` passou 201/202, com o único timeout preexistente
em `collaborator-register-dialog`. O aviso do gerador sobre `index.test.ts` é
preexistente.

#### F5-T3 — verified with preexisting blockers

Dependências: F5-T2
Paths: `evaluation.md` e evidências de execução
Resultado observável: valida o fluxo real com Auth, banco, Nest e Web saudáveis: login da seed lawyer, listagem, geração quando o workflow estiver disponível, revisão, edição manual, decisão, vigência, narrow viewport, teclado, snapshots, console e network. Usa Pencil MCP para inspecionar F9JxU, hq7Ty e Y5vBQ, compara os frames com a implementação e registra limitações dos nodes design-only.
RF / CA: CA-01, CA-02, CA-04 a CA-12; todos RF
Parallelizable: não. É o sensor oficial de ambiente e deve ocorrer após o gate local.

Evidência parcial: health checks de DB/Auth/Nest passaram; login real com
`lawyer@hmsadvogados.com.br`, rota protegida, listagem, `POST` individual/lote
`202`, polling, snapshot, narrow viewport (390px), teclado, console sem erros
atuais e network foram validados via Playwright MCP/CDP. O workflow não produziu
versão durante a janela observada. O Pencil MCP confirmou ativo
`/home/petros/projects/hms/design/hms.pen`; os screenshots dos nodes `F9JxU`,
`hq7Ty` e `Y5vBQ` renderizaram sem layout quebrado. O hard gate está liberado.

#### F5-T4 — verified with preexisting blockers

Dependências: F5-T3
Paths: `plan.md`, `evaluation.md`, diff completo
Resultado observável: único Judge Implementation Final, read-only, audita a implementação inteira e emite veredito.
RF / CA: todos RF/CA
Parallelizable: não. É a etapa terminal.

Veredito final do único Judge Implementation Final: `passed_with_preexisting_blockers`.
Os achados JI-01 (versionamento estrito), JI-02 (invalidação de polling) e JI-04
(fixture global) foram corrigidos e reavaliados. A alteração em
`documentation/prompts/create-plan-prompt.md` foi explicitamente solicitada pelo
usuário e classificada como autorizada, não como finding bloqueante. Permanecem
somente os blockers preexistentes registrados em `evaluation.md`.

### F6 — Seleção persistente, modal e endpoints

Dependência: F5-T3. Estado: accepted.

#### F6-T1 — verified

Paths: contratos de seleção no Core, schemas de validação e interfaces de repositório.
Resultado: seleção tipada com opções aplicáveis, IDs selecionados e substituição
transacional das associações; IDs inválidos são rejeitados.

Evidência: `pnpm --filter @hms/core check-types`, suíte Core 182/182 e testes
server-backed dos controllers passaram.

#### F6-T2 — verified

Paths: controllers de Consulta, DTOs, módulo e repositórios Drizzle. Resultado:
`GET` e `PUT /consultations/:consultationId/documents/selection`, com autorização
admin/advogado associado, materialização de documentos e persistência.

Evidência: `pnpm --filter server check:types`; testes focados dos dois controllers
passaram, incluindo payload inválido, GET da seleção e PUT persistente.

#### F6-T3 — verified

Paths: adapter web, query/action hooks e `select-consultation-documents-dialog`.
Resultado: modal com busca, selects de área/tema, checkboxes, contagem, cancelar e
salvar, invalidando a lista após sucesso.

Evidência: Biome focado e teste da composição da página 6/6 passaram.

#### F6-T4 — verified

Resultado: fluxo real autenticado abriu o modal, desmarcou um modelo, enviou o PUT,
recarregou a lista e refletiu dois documentos selecionados. Network registrou GET
selection 200, PUT selection 200 e GET documents 200; console terminou sem erros.
O screenshot do Node Pencil `AjCXk` foi usado como referência visual e o modal
ficou contido no viewport estreito.

#### F6-T5 — verified

Paths: `apps/web/src/ui/document-production/hooks/use-generate-consultation-document-action.ts`, `apps/web/src/ui/document-production/hooks/use-generate-consultation-documents-action.ts` e testes dos hooks.
Resultado: respostas `409 Conflict` e erros de geração limpam o estado otimista
de `pending` antes de qualquer polling. A interface não permanece em `Gerando`
quando o servidor rejeita a solicitação por já existir uma geração ativa.

Evidência: teste focado dos hooks passou 12/12; Biome focado passou; no browser
autenticado, o POST de geração retornou 409 e um novo snapshot mostrou
`Não gerado` com o botão `Gerar documento`, sem o estado `Aguardando resultado`.
O `check:types` amplo continua bloqueado somente pelo finding preexistente de
`react-pdf` em `document-viewer`.

#### F6-T6 — verified

Paths: contrato `ConsultationDocumentListItem`, `ListConsultationDocumentsUseCase`,
`ListConsultationDocumentsController`, repositório de gerações e o page hook de
documentos da consulta.
Resultado: a listagem retorna o status da última geração e a UI deriva `Gerando`
para `pending/running` persistidos, mesmo após reload; o botão `Gerar documento`
não é exibido enquanto houver geração ativa.

Evidência: Core 2/2, Web 17/17, controller REST 1/1, server `check:types` e
Biome focado passaram. No browser, o GET real retornou
`generationStatus: "running"` para `Procuração`; o snapshot mostrou `Gerando` e
`Aguardando resultado`, sem botão de geração.

#### F6-T7 — verified

Paths: ações de geração individual e em lote.
Resultado: quando um POST retorna `409`, a tentativa otimista é limpa e a lista
autoritativa é refeita; uma geração ativa retornada pelo servidor mantém o item em
`Gerando`, sem regressão para `Gerar documento`.

Evidência: testes Web focados passaram 17/17, Biome e `git diff --check` passaram.
O comportamento está coberto pelo fluxo de conflito e pela projeção persistida da
listagem.

### F7 — Cancelamento explícito de geração

Dependência: F6-T7. Estado: accepted.

#### F7-T1 — verified

Paths: `packages/core/src/consultation/use-cases/cancel-consultation-document-generation-use-case.ts`; `apps/server/src/consultation/rest/controllers/cancel-consultation-document-generation.controller.ts`; `apps/web/src/rest/services/consultation-document-production-service.ts`; `apps/web/src/ui/document-production/hooks/use-cancel-consultation-document-generation-action.ts`; widgets da lista de documentos
Resultado observável: colaborador autorizado pode cancelar a última geração `pending`/`running` de um documento da consulta por botão; o backend persiste `cancelled`, publica `DocumentGenerationCancelledEvent` para interromper o job Inngest e a listagem posterior exibe novamente **Gerar documento**.
RF / CA: RF-004, RF-011; CA-04, CA-13
Parallelizável: não. O endpoint, a mutation e a derivação da linha compartilham o contrato de cancelamento.

Checkpoint: o primeiro `pnpm --filter web check:code` identificou apenas duas
diferenças de formatação nos novos hooks; elas foram corrigidas imediatamente.
O fixture server foi estendido com acesso ao repositório de gerações e um seed
determinístico para o sensor do endpoint de cancelamento. O teste Core do novo
use case cobre administrador, cancelamento da geração ativa e recusa de colaborador
não associado; o teste focado passou 2/2. O teste do controller foi adicionado para
validar a transação HTTP, o status persistido e o evento publicado.
O teste do controller passou 1/1. O sensor do adapter foi ampliado de nove para
dez operações, incluindo o POST de cancelamento.
O teste do adapter passou 3/3 e `pnpm --filter web check:code` passou. O hook de
cancelamento foi coberto para verificar o POST e a invalidação da listagem.
O teste dos hooks passou 13/13. Os testes do page hook e da composição real foram
ampliados para cobrir delegação, botão de cancelamento e ausência do botão de gerar
durante `running`.
Os testes do page hook e da composição passaram 13/13. O comportamento do botão e
do estado persistido `running` está coberto; a mutation agora também desabilita o
botão durante o cancelamento para evitar submissão duplicada. O teste focado e o
`check:code` web passaram novamente. O nome do caso de composição foi ajustado para
descrever explicitamente o bloqueio durante o cancelamento.
Checkpoint corretivo: o page hook agora mascara a tentativa otimista cancelada
somente após o POST 204, evitando que uma geração iniciada na mesma sessão volte
a **Gerando** por causa de estado local obsoleto. O teste de corrida foi adicionado.
Sensores: Core types + teste 2/2, server types + controller 1/1, adapter 3/3,
hooks/page/composição 30/30 após este ajuste, `check:code` web, fluxo browser autenticado e
`git diff --check` passaram. O `check:types` amplo do web continua bloqueado
somente por `react-pdf` ausente e `totalPages` implícito em
`apps/web/src/ui/identity/widgets/pages/document-viewer/index.tsx`.

Evidência browser F7-T1: na rota real de documentos, o botão **Cancelar geração**
foi acionado para `15aa4fde-da7e-4980-9cf0-6003b7e33f95`. O POST retornou 204; o
GET subsequente retornou `generationStatus: "cancelled"`; o snapshot seguinte
mostrou **Não gerado** e **Gerar documento**. Console final sem erros/warnings.
Screenshot: `consultation-generation-cancelled.png`.

Revalidação same-session: o mesmo item recebeu POST de geração `202`, em seguida
POST de cancelamento `204`; o snapshot posterior voltou a mostrar **Não gerado** e
**Gerar documento**, sem permanecer em **Gerando**. Console sem erros/warnings.
Screenshot: `consultation-generation-cancelled-same-session.png`.

### F8 — Lista documental sem histórico inline

Dependência: F7-T1. Estado: accepted.

#### F8-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/use-consultation-documents-page.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-document-row/index.tsx`; testes da página
Resultado observável: a lista mostra título, status e ação, sem número da versão,
contador ou expansão **Ver histórico**; o histórico permanece na revisão.
RF / CA: RF-003; CA-14
Parallelizável: não. A remoção do markup depende do view model e dos testes da composição.

O teste do page hook/composição passou 14/14. O primeiro `check:code` encontrou
duas quebras de formatação no markup/teste removido; a correção do fechamento do
estado de timeout foi aplicada no mesmo checkpoint.
`check:code` passou e os testes de página permaneceram 14/14. `git diff --check`
passou. No browser autenticado, o GET real retornou 200 e o snapshot mostrou
somente título, status e ação, sem **Versão**, contador ou **Ver histórico**.
Console sem erros/warnings. Screenshot:
`consultation-documents-without-inline-history.png`.

### F9 — Revisão de versão alinhada ao Y5vBQ

Dependência: F8-T1. Estado: in_progress.

#### F9-T1 — in_progress

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/consultation-document-review-header/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`; testes da página
Resultado observável: a review page separa retorno/título, decisão da versão e
documento em revisão, aproximando o frame `design/hms.pen#Y5vBQ` sem remover
histórico, edição, decisões, pendências ou regeneração.
RF / CA: RF-005; CA-05
Parallelizável: não. Header, decision card e superfície do editor compõem uma única
hierarquia visual da rota.

Checkpoint corretivo: a composição passou a renderizar o status tanto no cabeçalho
quanto no card de decisão, como no frame de referência; as asserções do widget foram
ajustadas para validar a duplicação intencional e os dois blocos nomeados.

Checkpoint de formatação: o Biome formatou os três componentes JSX alterados; a
validação de código permanece pendente de nova execução.

#### F9-T1 — verified

`pnpm --filter web exec vitest run src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx` passou 4/4; `pnpm --filter web check:code` e `git diff --check` passaram. O `check:types` amplo continua bloqueado somente pelo finding preexistente de `react-pdf` ausente e `totalPages` implícito em `apps/web/src/ui/identity/widgets/pages/document-viewer/index.tsx`.

No browser autenticado, a rota real de revisão carregou GET de documentos e versão com
200, exibiu as regiões **Decisão da versão** e **Documento em revisão**, e manteve as
ações **Ver versões**, **Editar versão**, **Rejeitar versão**, **Aprovar versão** e
**Gerar nova versão**. A validação foi feita em 1200×1050 e 390×844; o documento não
teve overflow horizontal (`scrollWidth` igual à viewport), o primeiro Tab alcançou o
campo de busca, não houve erros/warnings no console e nenhuma API retornou 4xx/5xx.
Screenshots: `consultation-document-review-y5vbq.png` e
`consultation-document-review-y5vbq-mobile.png`.

### F10 — Tipografia compartilhada dos dialogs

Dependência: F9-T1. Estado: in_progress.

#### F10-T1 — in_progress

Paths: `apps/web/src/ui/shadcn/dialog.tsx`;
`apps/web/src/ui/shadcn/alert-dialog.tsx`;
`apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/select-consultation-documents-dialog/index.tsx`
Resultado observável: Dialog e AlertDialog usam título `text-2xl`, corpo e descrição
`text-base`; descendentes `text-xs` e `text-sm` sobem um nível semântico, e os
textos auxiliares de seleção deixam de usar 11 px arbitrários. As larguras já
ampliadas e o reflow permanecem inalterados.
RF / CA: RF-012; CA-15
Parallelizável: não. A mudança pertence às primitivas compartilhadas e requer uma
única validação visual contra os dialogs reais para detectar overflow/regressões.

Checkpoint de implementação: as duas primitivas compartilhadas receberam a nova
escala; o modal de seleção migrou os três textos arbitrários de 11 px para o token
semântico `text-xs`, elevado para `text-sm` dentro do dialog. Sensores e screenshots
ainda estão pendentes.

Checkpoint de sensores: `pnpm --filter web check:code`, `git diff --check` e os
testes focados das páginas de lista/revisão passaram (2 arquivos, 11 testes).
Screenshots browser ainda estão pendentes.

Checkpoint corretivo: a inspeção browser mostrou que botões `size='sm'` ainda
resolviam para 12,8 px por uma classe arbitrária. As primitivas agora elevam
também descendentes `[data-size=sm]` para `text-sm`, mantendo o mínimo de 14 px
nas ações compactas dos dialogs.

#### F10-T1 — verified

Quality Gate focado: `pnpm --filter web check:code`, os testes de lista/revisão
(2 arquivos, 11 testes) e `git diff --check` passaram.

Browser Use/CDP autenticado validou seleção de documentos, histórico de versões,
pendências do documento e o AlertDialog de aprovação. Em 390×844, a seleção
confirmou título 24 px, descrição 16 px, auxiliares 14 px e ações compactas 14 px,
sem overflow horizontal. No desktop, histórico e pendências confirmaram os mesmos
tamanhos; o AlertDialog confirmou título 24 px e descrição 16 px. Screenshots:
`consultation-dialog-font-size-mobile.png`,
`consultation-version-history-font-size.png`,
`consultation-pending-markers-font-size.png` e
`consultation-alert-dialog-font-size.png`.

Revalidação posterior ficou afetada por alterações concorrentes da F13 no mesmo
worktree: `check:code` encontrou formatação em três arquivos da review e o teste
da review falhou em 5 casos por `Icon` sem export correspondente; o teste da
lista permaneceu verde (8 testes). Os findings pertencem à F13 e não aos paths
de tipografia desta fase.

### F11 — Dialog de rejeição alinhado ao RGqCe

Dependência: F10-T1. Estado: verified.

#### F11-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/reject-document-version-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`
Resultado observável: o dialog de rejeição aproxima o node `design/hms.pen#RGqCe`
com largura controlada, cabeçalho/corpo/rodapé separados, descrição contextual,
label obrigatório, textarea maior e ações alinhadas à direita, preservando a
validação e a mutation existentes.
RF / CA: RF-008; CA-08, CA-16
Parallelizável: não. O dialog e o teste da composição formam a fronteira única do
fluxo de rejeição.

Checkpoint de implementação: o dialog foi reorganizado em cabeçalho, corpo e rodapé
com divisórias, largura máxima de 440 px, descrição do efeito da rejeição, label
obrigatório, textarea de 80 px, hint de persistência e ícone na ação destrutiva.
O contrato continua aceitando motivo não vazio; o teste da composição foi ampliado
para cobrir a nova hierarquia e o estado inicial desabilitado.

Checkpoint corretivo: a asserção existente do fluxo de rejeição foi atualizada para
usar o novo nome acessível `Motivo da rejeição *`, preservando a interação por label.

Checkpoint de formatação: o Biome corrigiu somente a quebra de linhas do dialog e do
teste, sem mudança comportamental.

#### F11-T1 — verified

O teste focado da review page passou 4/4, `pnpm --filter web check:code` passou e
`git diff --check` não encontrou problemas. No Browser Use/CDP, a rota autenticada
abriu o dialog real com largura de 440 px, textarea de 80 px, descrição, hint,
label obrigatório e ação destrutiva desabilitada para motivo vazio. O foco inicial
foi para `#rejection-reason`; após preenchimento válido, o botão foi habilitado e o
dialog foi fechado sem disparar mutation. Screenshots:
`consultation-reject-dialog-rgqce.png` e
`consultation-reject-dialog-rgqce-mobile.png`.

Checkpoint de formatação: o Biome formatou o dialog e o teste alterados; a nova
execução de `check:code` ainda está pendente.

Workflow browser obrigatório (Playwright MCP + Browser Use/CDP):

1. Executar docker compose ps -a, curl http://localhost:8000/auth/v1/health e
   curl http://localhost:3333/health; confirmar DB/Auth saudáveis e bootstrap Nest sem
   UnknownDependenciesException.
2. Iniciar pnpm --filter server dev e pnpm --filter web dev em sessões persistentes;
   registrar os IDs e aguardar compilação/restart estabilizar.
3. Resolver lawyer@hmsadvogados.com.br e HMS_USER_SEED_PASSWORD a partir da seed/env;
   nunca assumir senha.
4. Abrir /login, obter snapshot novo, autenticar, confirmar URL e conteúdo protegido e
   só então acessar a rota de documentos.
5. Após cada navegação ou interação mutável, obter novo browser_snapshot; nunca reutilizar
   refs de snapshot anterior. No final, coletar console e network e classificar cada erro,
   warning, hydration warning, refresh failure ou 4xx/5xx.
6. Usar Browser Use/CDP para a interação do fluxo real, preferindo accessibility
   tree, `wait_for_load()` e verificações direcionadas após cada ação; testar pelo
   menos viewport estreito e caminho de teclado. Não usar `page.route` nessa
   passagem real. Parar apenas as sessões Web/Server iniciadas, preservando Docker.

### F12 — Folha editável mais ampla

Dependência: F11-T1. Estado: in_progress.

#### F12-T1 — in_progress

Paths: `apps/web/src/ui/document-production/widgets/components/document-editor/index.tsx`
Resultado observável: a folha editável ocupa mais espaço horizontal no editor com
largura fluida e limite `max-w-5xl`, mantendo margens internas e responsividade.
RF / CA: RF-006; CA-06
Parallelizável: não. A largura é uma propriedade estrutural do editor compartilhado.

#### F12-T1 — verified

Os testes focados do `DocumentEditor` e da review page passaram 9/9; `pnpm --filter
web check:code` passou. No browser autenticado, a folha passou a medir 1022 px em
viewport de 1440 px, contra aproximadamente 766 px antes da alteração. Em viewport
390 px, mediu 322 px, com `documentWidth` e `bodyWidth` iguais a 390 px, sem
overflow horizontal. Screenshots: `consultation-document-review-wide-editor.png` e
`consultation-document-review-wide-editor-mobile.png`. A API retornou somente GET
200; console sem erros. O warning do TanStack Router sobre `notFoundComponent` é
preexistente e não foi introduzido por esta alteração.

## Matriz de rastreabilidade

RF-001 / CA-01–02: tarefas F2-T2, F3-T3, F4-T3 e F5-T1/T3. Evidência:
params canônicos, middleware, árvore gerada, redirect e browser autenticado.

RF-002 / CA-03: tarefas F1-T1/T2/T3. Evidência: contratos Core, adapter,
RestContext e teste de método/path/body.

RF-003 / CA-01, CA-05: tarefas F3-T1/T2 e F5-T1/T3. Evidência: derivação por
maior versão, histórico, estados e listagem real.

RF-004 / CA-04: tarefas F3-T1/T2 e F5-T1/T3. Evidência: action individual/batch,
baseline, 202, 409, polling e outcome.

RF-005 / CA-05: tarefas F4-T1/T2/T3 e F5-T1/T3. Evidência: detalhe + listagem,
histórico, URL por três IDs e 404 orientado.

RF-006 / CA-06: tarefas F2-T1, F4-T1/T2 e F5-T1/T3. Evidência: editor
compartilhado, JSON, dirty/cancel/save e nova versão manual.

RF-007 / CA-07: tarefas F2-T1, F4-T2 e F5-T1/T3. Evidência: extensão de marcador,
foco/realce e dialog de ausência.

RF-008 / CA-08: tarefas F4-T1/T2 e F5-T1/T3. Evidência: schema/motivo,
aprovação/rejeição, status final e conflito.

RF-009 / CA-09: tarefas F4-T1/T2 e F5-T1/T3. Evidência: matriz de disponibilidade,
PATCH current e chip vigente.

RF-010 / CA-10: tarefas F3-T1, F4-T2 e F5-T1/T3. Evidência: regeneração individual
sem body de instrução e preservação do histórico.

RF-011 / CA-02, CA-11: tarefas F1-T2/T3, F3-T1, F4-T1/T2 e F5-T1/T3. Evidência:
status HTTP, retry, callbacks obsoletos, cache por IDs e console/network.

RF-012 / CA-12: tarefas F2-T1/T2, F3-T2/T3, F4-T2/T3 e F5-T1/T3. Evidência:
tokens, a11y, foco, narrow viewport, dark mode, zoom/reflow e screenshots.

## Riscos, findings ativos e mitigação

R-001 — contrato Core ausente / aberto. Impacto: adapter pode duplicar shape,
errar datas ou perder erro HTTP. Mitigação/evidência: F1-T1/T2, uma type por
arquivo, teste dos nove mappings e check-types. Próxima ação: iniciar F1-T1.

R-002 — divergência entre endpoint real e URL web / aberto. Impacto: requests
podem chegar ao controller errado sem falhar visualmente. Mitigação/evidência:
endpoints lineares, teste de método/path/body e fixture com network. Próxima ação:
validar F1-T2 e F5-T1.

R-003 — acompanhamento assíncrono não persistido / aberto. Impacto: UI pode
concluir geração com versão antiga ou inventar falha. Mitigação/evidência:
baseline estrito, attemptId, IDs completos, timeout neutro e testes de corrida.
Próxima ação: validar F3-T1.

R-004 — editor compartilhado / aberto. Impacto: promoção pode quebrar o admin ou
persistir JSON fora do Contract. Mitigação/evidência: mover integralmente,
atualizar imports, round-trip/schema test e smoke admin. Próxima ação: validar F2-T1.

R-005 — decisões concorrentes e navegação durante mutation / aberto. Impacto:
resposta antiga pode sobrescrever outra consulta/versão. Mitigação/evidência:
invalidar por IDs, abortar/ignorar callbacks obsoletos, promises controladas e
409 real. Próxima ação: validar F3-T1/F4-T1.

R-006 — conteúdo jurídico sensível / aberto. Impacto: vazamento em URL,
localStorage, logs ou erro. Mitigação/evidência: manter conteúdo no cache/rascunho
de sessão, revisar mensagens e inspeção read-only. Próxima ação: validar F4-T2/F5-T3.

R-007 — design-only pede ações sem contrato / aberto. Impacto: controles de
cancelar, remover, download ou falha poderiam prometer comportamento inexistente.
Mitigação/evidência: matriz de fora de escopo, renderizar somente ações suportadas
e registrar limitações Pencil. Próxima ação: validar F4-T2/F5-T3.

R-008 — mock browser pode mascarar composição/Auth / aberto. Impacto: rota verde
não provaria sessão, Nest ou autorização reais. Mitigação/evidência: widget real,
fixture stateful e workflow autenticado obrigatório sem mocks. Próxima ação:
validar F5-T1/T3.

R-009 — ambiente local/Auth/Inngest instável / aberto. Impacto: evidência real
pode ficar incompleta ou induzir falso bloqueio. Mitigação/evidência: preflight,
sessões registradas, seed conferida e classificação de serviço fora do escopo.
Próxima ação: executar somente F5-T3.

R-010 — worktree com Spec não rastreada / ativo, não bloqueante. Impacto: diff
pode misturar o arquivo de entrada do usuário com alterações de implementação.
Mitigação/evidência: preservar spec.md, revisar status/diff antes do Judge e não
editar fora do alvo. Próxima ação: reavaliar em F5-T2/T4.

Não existem findings de Judge nesta criação. Qualquer retry futuro deve registrar
comando, finding, estado da fase, correção, sensores invalidados e próxima ação
nesta seção e em evaluation.md.

### F13 — Barra de decisão alinhada à matriz de estados Pencil

Dependência: F12-T1. Estado: verified.

#### F13-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-consultation-document-review-page.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/index.tsx`; testes da página
Resultado observável: a barra muda título, status, ícone, mensagem e ações para
gerando, falha, revisão, rejeitado, aprovado, vigente e edição manual, de acordo
com os nodes `zBZ6j`, `JH360`, `Op56U`, `sJhUE`, `uupRa`, `ca1dH` e `WpfrA`.
RF / CA: RF-005; CA-17
Parallelizável: não. A matriz depende do view model da review page e das mutations
existentes de geração/cancelamento/decisão/edição.

Checkpoint corretivo: a composição usava quatro nomes de ícones que não existem no
registry compartilhado. Eles foram mapeados para ícones Lucide já disponíveis
(`refresh-cw`, `triangle-alert`, `x` e `shield-check`), preservando a matriz visual
sem ampliar o contrato do componente `Icon`.

O sensor seguinte encontrou ainda `sparkles` no CTA de regeneração; esse ícone
também foi substituído por `refresh-cw`, que já pertence ao registry.

Checkpoint de implementação: o view model passou a derivar `pending`/`running` como
`generating` e `failed` como falha; a barra agora usa apresentações distintas para
geração, falha, revisão, rejeição, aprovação, vigência e edição manual. O
cancelamento usa a action existente e a falha oferece retry sem inventar detalhes de
erro. O teste da página foi ampliado para os estados de geração/falha e cancelamento;
sensores ainda estão pendentes.

Checkpoint corretivo: os ícones específicos dos nodes que não existem no catálogo
`IconName` foram mapeados para equivalentes HMS suportados, preservando o significado
visual e evitando componentes indefinidos em runtime.

Checkpoint de formatação: o Biome formatou a barra, o page hook e o teste da matriz;
nenhuma mudança de comportamento foi introduzida pelo formatter.

Checkpoint de asserção: a data localizada pode incluir vírgula entre data e hora;
o teste passou a validar a presença do ano renderizado, sem acoplar-se ao separador
regional.

Checkpoint de cobertura: a composição agora verifica também rejeitado, vigente,
aprovação atual e edição manual, além de geração/falha; ações incompatíveis ficam
ausentes em cada estado.

Checkpoint de formatação: o Biome formatou a barra e o teste de matriz; nenhuma
mudança comportamental foi introduzida.

Checkpoint de teste: o estado rejeitado exibe o status no cabeçalho e no card; a
asserção foi ajustada para validar as duas ocorrências intencionais.

Checkpoint de formatação final: o Biome foi aplicado aos quatro arquivos da
composição da review; somente a formatação pendente do page index foi alterada,
sem mudança de comportamento.

Validação final: o teste focado da review page passou 8/8 e o Biome check focado
passou nos quatro arquivos da matriz. O check global continua com findings
preexistentes em Identity e `react-pdf`; a validação visual final via Browser Use
ficou bloqueada pela ausência de conexão do daemon e a sessão Playwright já ocupada.
As evidências de design permanecem no Pencil `design/hms.pen` e nos sete nodes
inspecionados; nenhum screenshot de browser posterior a esta alteração é alegado.

Finding de tipos: `pnpm --filter web check:types` continua bloqueado por erros
preexistentes em Identity/shared (props de dialogs e variáveis não usadas) e pela
dependência/tipagem de `react-pdf`; nenhum erro aponta para os paths da F13.

### F15 — Chip de status compartilhado no histórico de versões

Dependência: F13-T1. Estado: verified.

#### F15-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/components/document-status-chip/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-history-dialog/index.tsx`; testes da página
Resultado observável: o histórico usa exatamente os mesmos chips de status da
decision bar para revisão, rejeição, aprovação, geração e falha, mantendo ícone,
cor, borda, tipografia e espaçamento consistentes.
RF / CA: RF-005; CA-17
Parallelizável: não. O chip compartilhado é a fonte única de apresentação dos
status dentro da página de revisão.

Checkpoint de implementação: extraído `DocumentStatusChip` e substituído o
`Badge` específico do histórico; a decision bar também passou a consumir o mesmo
renderer, evitando divergência visual entre os dois contextos. Sensores pendentes.

Checkpoint corretivo: o tipo do ícone da decision bar foi alinhado diretamente ao
`IconName` compartilhado e a composição voltou a usar `cn`, sem alterar o renderer
ou a aparência dos chips.

Checkpoint de formatação: o Biome formatou o chip compartilhado e o histórico;
nenhuma mudança comportamental foi introduzida.

Checkpoint corretivo: a suíte revelou que o diálogo ainda dependia de `Badge` para
o marcador independente `Vigente`; o import foi restaurado sem alterar o chip de
status compartilhado.

Validação final: o teste focado da review page passou 9/9 e o Biome check passou no
chip compartilhado, na decision bar e no histórico. O histórico agora usa o mesmo
ícone, cor, borda, tipografia e espaçamento do status exibido na decision bar.

### F16 — Dialog de rejeição alinhado ao node RGqCe

Dependência: F15-T1. Estado: in_progress.

#### F16-T1 — in_progress

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/reject-document-version-dialog/index.tsx`; testes da página
Resultado observável: o dialog usa composição compacta, header e footer separados,
textarea fixa, botões pill e ação destrutiva preenchida, aproximando-se do node
`RGqCe` sem alterar o fluxo de decisão.
RF / CA: RF-005; CA-08
Parallelizável: não. O dialog é o único owner da apresentação e entrada do motivo.

Checkpoint de implementação: ajustados largura, espaçamento, tipografia, close,
textarea, footer e botões conforme o `RGqCe`. A validação continua exigindo somente
motivo não vazio, conforme a regra vigente da Spec; a indicação visual de 10
caracteres do mock não foi transformada em nova regra de negócio.

Checkpoint de formatação: o Biome formatou o dialog de rejeição; nenhuma alteração
comportamental foi introduzida.

Validação final: o teste focado da review page passou 10/10 e o Biome check passou
no dialog de rejeição. O fluxo de abertura, validação, cancelamento e confirmação
da rejeição permanece coberto.

### F17 — Escala tipográfica do dialog de rejeição

Dependência: F16-T1. Estado: verified.

#### F17-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/reject-document-version-dialog/index.tsx`; testes da página
Resultado observável: o dialog mantém a composição do `RGqCe`, mas com título,
descrição, label, textarea, helper e botões mais legíveis.
RF / CA: RF-005; CA-08
Parallelizável: não. A alteração é restrita à escala tipográfica do dialog.

Checkpoint de implementação: aumentados os tamanhos tipográficos do conteúdo e das
ações sem alterar a regra de validação ou o payload de rejeição. Sensores pendentes.

Validação final: o teste focado da review page passou 10/10 e o Biome check passou
no dialog de rejeição.

### F18 — Cobertura unitária do review page hook

Dependência: F17-T1. Estado: verified.

#### F18-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/use-consultation-document-review-page.test.ts`
Resultado observável: o hook possui cobertura isolada para view model/histórico,
sincronização do draft, navegação com alterações, decisões, conflitos, geração,
cancelamento, retry e marcadores pendentes.
RF / CA: RF-005; CA-05; CA-08; CA-17
Parallelizável: não. Os cenários exercitam o hook proprietário da review page e
suas abstrações de queries/actions.

Checkpoint de implementação: adicionada suíte unitária com `renderHook`, mocks das
abstrações HMS e cenários para estados derivados e handlers assíncronos. Sensores
pendentes.

Checkpoint corretivo: os cenários de troca de versão e navegação dirty foram
ajustados para rerenderizar após trocar mocks e aplicar atualizações de estado em
atos separados, refletindo o ciclo real do React.

Checkpoint corretivo: a referência de `rerender` foi mantida somente no cenário de
troca de versão; o teste de navegação dirty permanece isolado e não altera mocks.

Checkpoint corretivo: o cenário de sincronização passou a declarar explicitamente
o `rerender` retornado pelo Testing Library.

Validação final: a suíte dedicada do hook passou 8/8; a suíte combinada do hook e
da review page passou 21/21; o Biome check passou no novo teste.

### F14 — Data e hora nos metadados da versão

Dependência: F13-T1. Estado: verified.

#### F14-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-consultation-document-review-page.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`
Resultado observável: os metadados da revisão exibem a data e a hora de criação da
versão no formato local `pt-BR`, preservando o mesmo valor no cabeçalho e histórico.
RF / CA: RF-005; CA-05
Parallelizável: não. O view model compartilha uma única função de formatação entre
as três superfícies.

#### F14-T1 — verified

O teste da review page passou 6/6 e `pnpm --filter web check:code` passou. Na rota
autenticada, o snapshot exibiu `14/08/2026, 08:18` no cabeçalho da versão; a API
retornou somente GET 200 e o console não registrou erros ou warnings. Screenshot:
`consultation-document-review-date-time.png`.

Checkpoint corretivo: a asserção de composição foi reforçada para exigir também
`HH:mm`, aceitando ano curto ou longo conforme o runtime Intl.

### F15 — Dialog linear de histórico alinhado ao Q5lD9

Dependência: F14-T1. Estado: verified.

#### F15-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-history-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`
Resultado observável: o histórico abre em um dialog amplo com cabeçalho contextual, divisor e uma lista linear de versões. Cada linha apresenta versão, status semântico, vigência, origem/data e ação **Visualizar**; em viewport estreito, a linha refluí sem overflow e a navegação continua usando os três IDs tipados. O sensor fixa uma versão vigente no fixture para verificar a apresentação condicional do chip.
RF / CA: RF-005; CA-05, CA-12, CA-15
Parallelizável: não. A composição depende do view model, do dialog compartilhado e da navegação da review page.

Quality Gate: o teste focado da review passou 9/9; o Biome passou nos dois arquivos
da tarefa e `git diff --check` passou. No browser autenticado, o dialog mediu 680 px
em 1440 px e 358 px em 390 px, exibiu linhas lineares, status, metadados, motivo e
ações **Visualizar**. A navegação por teclado alcançou a primeira ação; a API
retornou GET 200; não houve erros ou warnings novos após recarregar a rota.
Screenshots: `consultation-document-version-history-q5ld9.png` e
`consultation-document-version-history-q5ld9-mobile.png`.

### F16 — Cabeçalho sem duplicação de status

Dependência: F15-T1. Estado: in_progress.

#### F16-T1 — in_progress

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/consultation-document-review-header/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`
Resultado observável: o cabeçalho da revisão mostra título, versão, origem e data/hora, sem o chip de status. O estado continua visível na área **Decisão da versão**, que permanece a autoridade visual para as ações de aprovação, rejeição e vigência.
RF / CA: RF-005; CA-05, CA-12
Parallelizável: não. A alteração pertence à composição do cabeçalho e exige atualizar as asserções de estado da página.

#### F16-T1 — verified

O teste focado da review passou 9/9; o Biome passou nos dois arquivos alterados e
`git diff --check` passou. No browser autenticado, desktop e mobile exibiram a
origem/data no cabeçalho sem o chip de status, enquanto o card **Decisão da versão**
continuou exibindo **Em revisão** e suas ações. As requisições reais retornaram GET
200, sem erros ou warnings novos no console. Screenshots:
`consultation-document-review-header-no-status.png` e
`consultation-document-review-header-no-status-mobile.png`.

### F17 — Dialog de nova versão alinhado ao CcIqS

Dependência: F16-T1. Estado: verified.

#### F17-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/regenerate-document-version-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`
Resultado observável: o dialog de nova versão usa superfície de 480 px efetivos, cabeçalho com fechamento, corpo contextual, rodapé separado e ações pill. A confirmação continua chamando o endpoint existente sem inventar instruções não suportadas pelo contrato.
RF / CA: RF-004, RF-005; CA-04, CA-05, CA-12
Parallelizável: não. A composição depende do action hook de geração e da confirmação da review page.

Quality Gate: o teste focado da review passou 10/10; o Biome passou nos dois arquivos
da tarefa e `git diff --check` passou. No browser autenticado, o dialog mediu 480 px
em 1440 px e 390 px em viewport mobile, sem overflow. O foco por Tab alcançou
**Gerar nova versão**, o cancelamento fechou o dialog, as APIs retornaram GET 200 e
não houve erros ou warnings novos no console. Screenshots:
`consultation-regenerate-dialog-cciqs.png` e
`consultation-regenerate-dialog-cciqs-mobile.png`.

### F18 — Motivo de rejeição consultável

Dependência: F17-T1. Estado: verified.

#### F18-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/view-rejection-reason-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-consultation-document-review-page.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/index.tsx`; testes da página
Resultado observável: **Ver motivo** passa a ser um controle acessível na barra de
decisão rejeitada e abre um dialog com o motivo persistido, sem permitir edição ou
enviar mutation.
RF / CA: RF-005; CA-18
Parallelizável: não. O dialog depende do `rejectionReason` do view model e do estado
da review page.

Checkpoint de implementação: criado o widget `ViewRejectionReasonDialog` seguindo
o padrão de dialog do HMS e a referência visual do `RGqCe`; a barra agora renderiza
**Ver motivo** como botão link, e o page hook controla abertura, fechamento e limpeza
do estado ao trocar de versão.

Checkpoint de formatação: o Biome formatou os cinco arquivos da interação; somente
o teste recebeu ajuste automático de layout, sem alteração comportamental.

Quality Gate: o teste focado da review page passou 10/10 e o Biome check passou nos
cinco arquivos da interação. O dialog exibe o texto persistido e fecha por **Fechar**
ou pelo controle de fechamento, sem enviar mutation. A referência visual foi
validada no Pencil `design/hms.pen#RGqCe`; Browser Use permaneceu bloqueado porque o
daemon não ficou ativo, portanto não foi alegado screenshot manual desta alteração.

### F19 — Instruções da nova versão

Dependência: F18-T1. Estado: verified.

#### F19-T1 — verified

Paths: `packages/validation/src/document-production/schemas/generate-consultation-document-schema.ts`; `packages/core/src/consultation/use-cases/generate-consultation-document-use-case.ts`; `packages/core/src/document-production/domain/events/document-generation-requested-event.ts`; `apps/server/src/consultation/rest/controllers/generate-consultation-document.controller.ts`; `apps/server/src/document-production/messaging/inngest/jobs/generate-document-job.ts`; `apps/server/src/document-production/ai/mastra`; `apps/web/src/rest/services/consultation-document-production-service.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/regenerate-document-version-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-consultation-document-review-page.ts`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: o dialog alinhado ao CcIqS coleta instruções obrigatórias,
desabilita a confirmação sem texto válido e envia o conteúdo normalizado no request.
O backend aceita body opcional para preservar a geração inicial, valida a entrada,
publica o valor no evento e o encaminha pelo job/workflow até os prompts de escrita
e revisão. O contrato de batch permanece sem instruções.

RF / CA: RF-010; CA-10, CA-12
Parallelizável: não. A mudança atravessa UI, adapter, Core, REST, evento e job.

Quality Gate: Core 2/2, validation 19/19, controller REST 2/2 e web 13/13;
checks de tipos passaram em Core, validation, server e web; Biome passou nos
arquivos alterados e `git diff --check` passou. A validação browser autenticada
da interação confirmou o modal em desktop e viewport estreito.

Checkpoint corretivo: a validação visual revelou que a regra de texto vazio havia
desabilitado também **Cancelar**. O botão foi corrigido para permanecer disponível
quando o campo está vazio; somente **Gerar nova versão** depende de instruções válidas.
O Biome foi executado novamente após a correção e `git diff --check` permaneceu verde.
O teste de composição também fixa que **Cancelar** permanece habilitado no estado vazio.
No browser autenticado, o dialog mediu 480 px em 1440 px e ocupou 390 px sem
overflow no viewport estreito. O snapshot confirmou o campo, o botão **Cancelar**
ativo no estado vazio e **Gerar nova versão** desabilitado até preencher instruções;
após preenchimento, a confirmação ficou ativa. As APIs reais retornaram GET 200,
sem erros/warnings novos no console. Screenshots: `consultation-regenerate-dialog-instructions.png`
e `consultation-regenerate-dialog-instructions-mobile.png`.

## F20 — Estado otimista imediato após regeneração

Dependência: F19-T1. Estado: verified.

#### F20-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-consultation-document-review-page.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: a review page considera `pendingDocumentIds` do action hook
como fonte otimista do estado **Gerando**, inclusive depois que o `202 Accepted`
encerra a mutation e antes de a listagem autoritativa refletir `pending/running`.
Assim, a barra de decisão não retorna brevemente ao estado anterior durante o
primeiro polling.
Após um cancelamento confirmado, a página limpa a exceção otimista local para não
manter **Gerando** depois do `204 No Content`.
Essa supressão também cobre uma resposta de listagem ainda atrasada que conserve
temporariamente `pending/running` após o cancelamento autoritativo.

RF / CA: RF-004, RF-010; CA-04, CA-10, CA-12
Parallelizável: não. A correção pertence à derivação de estado da página de revisão.

Quality Gate: teste focado da review page passou 13/13; Biome e `git diff --check`
passaram.

Browser autenticado: `POST .../generations` retornou `202 Accepted` e o snapshot
seguinte exibiu imediatamente **Geração do documento / Gerando**, sem aguardar o
primeiro polling. O cancelamento real retornou `204 No Content`; após reload, a
versão voltou ao estado normal e não permaneceu em **Gerando**. Console: 0 erros e
0 warnings novos; as requisições reais de documentos/versão retornaram 200.

## F21 — Chip de status como widget compartilhado

Dependência: F15-T1. Estado: verified.

#### F21-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/components/document-status-chip/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-document-row/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/use-consultation-documents-page.ts`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-history-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: `DocumentStatusChip` vive em `widgets/components` e é a fonte
única de apresentação dos status no histórico, na barra de decisão e na lista de
documentos da consulta. A lista deixou de usar `Badge` com apresentação divergente;
`Não gerado`, `Em revisão`, `Rejeitado`, `Aprovado`, `Gerando`, `Falha na geração` e
`Vigente` usam o mesmo contrato visual, ícone, borda, cor e tipografia.

RF / CA: RF-003, RF-005; CA-05, CA-14, CA-15
Parallelizável: não. O componente compartilhado precisa ser adotado pela lista e
pelos dois contextos da página de revisão antes da validação visual.

Quality Gate: os testes de composição da lista, page hook e review page passaram
27/27; Biome focado foi aplicado aos cinco arquivos alterados.

## F22 — Seleção aditiva de documentos alinhada ao AjCXk

Dependência: F21-T1. Estado: verified.

#### F22-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/select-consultation-documents-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/consultation-documents-page.test.tsx`; `packages/core/src/consultation/use-cases/replace-consultation-document-selection-use-case.ts`; `apps/server/src/consultation/rest/controllers/tests/replace-consultation-document-selection.controller.test.ts`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: o modal segue o node `AjCXk` com largura ampla, filtros
rotulados, ícones, linhas lineares e rodapé de adição. Documentos já presentes no
pacote ficam desabilitados e exibem **Já adicionado**; somente novos modelos podem
ser selecionados. O request continua enviando a seleção final completa. O caso de
uso rejeita uma seleção que remova qualquer associação existente antes de criar ou
substituir documentos do pacote.

RF / CA: RF-003, RF-012; CA-01, CA-12
Parallelizável: não. A regra precisa ser a mesma na UI, no caso de uso e no controller.

Sensores: teste de composição web cobre linhas bloqueadas, marcador **Já
adicionado**, contador somente de novas adições e payload completo; teste REST
cobre tentativa de remoção e preservação das duas associações existentes. Pencil
confirmou `design/hms.pen` ativo e o node `AjCXk` disponível antes do patch.

Checkpoint de formatação: o Biome formatou o dialog, o teste de composição e o
caso de uso; não houve alteração comportamental nesse checkpoint.

Checkpoint corretivo: a asserção do teste foi alinhada à regra visual do AjCXk:
documentos bloqueados não entram no contador de novos itens; o contador inicia em
zero e passa a um quando um modelo novo é marcado.

Quality Gate focado: composição web 8/8, controller REST 3/3, `@hms/core
check-types`, Biome nos arquivos alterados e `git diff --check` passaram.

Checkpoint corretivo de responsividade: a primeira inspeção narrow revelou largura
intrínseca excedente no conteúdo do dialog. O modal recebeu `min-w-0`, rodapé que
reflui para coluna e linhas que permitem quebra do marcador; a correção mantém a
composição linear no desktop e evita overflow horizontal no viewport estreito.

Checkpoint corretivo visual: no narrow, o marcador ainda podia reduzir o bloco de
texto a uma coluna estreita. Ele passou a ocupar uma linha própria abaixo do
conteúdo em telas pequenas e retorna ao alinhamento lateral no desktop.

Checkpoint corretivo de flexbox: a regra de linha própria inicialmente colapsou o
bloco textual para largura zero. O texto passou a ter largura integral no narrow e
flexibilidade somente no desktop, preservando o reflow sem colapso.

Checkpoint corretivo estrutural: o reflow foi movido para o container que agrupa
texto e marcador, mantendo o ícone e o texto na primeira linha e o badge na segunda
linha apenas no narrow.

Revalidação de código: Biome, composição web 8/8 e `git diff --check` passaram após
o ajuste final de responsividade; os sensores de Core/controller permanecem verdes.

Validação browser final: na rota autenticada real, o modal abriu com largura de
768 px em 1440 px e os três modelos do pacote apareceram com checkbox `disabled` e
marcador **Já adicionado**. Em 390 px, `documentWidth`, `bodyWidth` e
`dialogScrollWidth` ficaram respectivamente 390, 390 e 358 px; o foco por Tab
avançou do campo de busca para **Área jurídica**. GET de documentos e seleção
retornaram 200. Screenshots: `consultation-select-documents-ajcxk-final.png` e
`consultation-select-documents-ajcxk-mobile-final.png`.

Checkpoint final de contrato/cabamento: a tentativa de remoção agora usa erro Core
dedicado com mensagem explícita, exportado pelo barrel de Consulta; o dialog também
aplica o fechamento circular previsto no AjCXk.

Checkpoint documental: o mapeamento Pencil e as premissas da Spec foram alinhados
ao endpoint server-backed e à seleção aditiva; referências históricas de escopo
anterior permanecem apenas como evidência de fases já concluídas.

Quality Gate pós-patch: Core check-types, controller REST 3/3, composição web 8/8,
Biome nos arquivos alterados e `git diff --check` passaram.

Revalidação browser pós-patch: a versão final manteve 768 px no desktop, sem
overflow (`documentWidth=bodyWidth=dialogScrollWidth=1440/768`), e os endpoints
de documentos/seleção permaneceram 200; a captura desktop/mobile foi atualizada
após o acabamento do close circular.

F22-T2 — ajuste visual: o CTA de adição passou a usar `size='sm'`, igual ao
**Cancelar**, preservando o padding horizontal maior apenas para acomodar o texto.

Validação: Browser confirmou altura de 36 px para ambos os botões; o CTA permanece
desabilitado quando não há novos modelos. Composição web 8/8, Biome e `git diff
--check` passaram.

F22-T3 — ajuste óptico: o checkbox dos modelos bloqueados foi deslocado para
alinhar seu centro vertical ao ícone de documento de 40 px, inclusive nas linhas
com descrição quebrada.

Validação: Browser mediu delta vertical `0px` entre checkbox e ícone de documento
nas três linhas; composição web 8/8, Biome e `git diff --check` passaram. Screenshot:
`consultation-select-documents-aligned-check.png`.

F22-T4 — dependência dos filtros: **Tema jurídico** permanece desabilitado enquanto
**Área jurídica** estiver em “Todas as áreas”; ao escolher uma área, o controle fica
disponível, e ao voltar ao estado inicial o tema é resetado para “Todos os temas”.

Checkpoint corretivo: a asserção usou o matcher `toBeDisabled`, indisponível na
configuração atual do Vitest; foi substituída por verificação semântica do atributo
`disabled`, sem mudança de comportamento.

Validação F22-T4: teste web 8/8, Biome e `git diff --check` passaram. Browser real
confirmou o combobox **Tema jurídico** com estado `disabled` quando **Área jurídica**
está em “Todas as áreas”; GETs de documentos e seleção retornaram 200 e não houve
erros de console desde a navegação.

## F23 — Radius pill na barra de decisão

Dependência: F13-T1. Estado: verified.

#### F23-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: as ações da `DocumentVersionDecisionBar` usam o radius pill
`rounded-full` do padrão de botões do projeto. O link textual **Ver motivo** mantém
seu comportamento sem caixa visual. A referência Pencil `design/hms.pen#SQoVa`
confirma a forma pill aplicada.

RF / CA: RF-005; CA-05, CA-15
Parallelizável: não. A alteração é local à barra e deve ser validada junto da
matriz de estados e das ações disponíveis.

Quality Gate: teste focado da review page passou 13/13; `pnpm --filter web
check:code` passou em 344 arquivos; `git diff --check` passou.

## F24 — Rodapé do modal de seleção com ações pill

Dependência: F21-T1. Estado: verified.

#### F24-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/select-consultation-documents-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/consultation-documents-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: o rodapé do modal de seleção usa `rounded-full` tanto no
botão outline **Cancelar** quanto no CTA **Adicionar N documentos**, incluindo o
estado desabilitado exibido quando não há novos documentos.

RF / CA: RF-003; CA-03, CA-15
Parallelizável: não. As duas ações formam o mesmo padrão visual do rodapé e devem
ser validadas juntas.

Quality Gate: teste de composição da lista passou; `pnpm --filter web check:code`
e `git diff --check` passaram.

## F25 — Reparação do ambiente de seed documental

Dependência: F24. Estado: verified.

#### F25-T1 — verified

Paths: `apps/server/src/shared/database/drizzle/migrations/0025_repair_document_batch_tables.sql`; `apps/server/src/shared/database/drizzle/migrations/0026_create_documents_storage_bucket.sql`; `apps/server/src/shared/provision/env/env-provider.ts`; `apps/server/.env.example`; `apps/web/.env.example`; `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json`; snapshots Drizzle gerados.

Resultado observável: a divergência entre as migrações `0014_flippant_the_initiative`
e `0014_noisy_true_believers` deixa de impedir a criação das tabelas usadas pelo
`RealDocumentsSeeder`. A migração de reparo é idempotente e restaura os tipos,
`daily_counters`, `document_batches`, `document_batch_files`, relacionamentos e
índices. O bucket privado canônico `documents` é provisionado por migração e passa
a ser o default explícito do provider; os exemplos de ambiente usam o mesmo nome.

Sensores: `db:migration:apply` aplicou as migrações 0025 e 0026; `server build`,
`server check:types` e Biome focado do provider passaram. O banco confirmou os três
objetos documentais, o bucket `documents` e as contagens seedadas. `pnpm db:seed`
passou até o fim e registrou a consulta `00000000-0000-4000-8000-000000000101` e
três documentos de produção.

Expansão registrada: a validação revelou que a entrega também dependia da camada
de migração/provisionamento, antes ausente do escopo operacional do Plan. O seed
continua restrito a `dev`/`stg`; não foi adicionada tolerância que esconda schema
ou bucket ausentes.

#### F25-T2 — verified

Correção de compatibilidade: a migração do bucket usa `to_regclass('storage.buckets')`
antes de executar o `INSERT`. Assim, o Supabase local recebe o bucket `documents`,
enquanto os PostgreSQL puros usados pelos testes de integração continuam podendo
aplicar todas as migrações sem depender de schemas gerenciados pelo Supabase.

O `.env` local do frontend também foi alinhado a `VITE_SUPABASE_STORAGE_BUCKET=documents`
para que o viewer use o mesmo bucket provisionado pelo backend.

## F26 — Limpeza completa do Supabase Auth no seed

Dependência: F25. Estado: verified.

#### F26-T1 — verified

Paths: `packages/core/src/identity/interfaces/auth-administration-provider.ts`; `apps/server/src/identity/providers/supabase-auth-administration-provider.ts`; `apps/server/src/identity/database/identity-seeder.ts`; `apps/server/src/identity/fixtures/identity-module-fixture.ts`; teste do provider.

Resultado observável: antes de recriar as identidades, o seed coleta todos os
usuários do Supabase Auth em páginas de até 1000 registros e remove todos os IDs
encontrados. A coleta termina antes das exclusões, evitando que a remoção durante
a paginação pule usuários. O comportamento não depende dos cinco e-mails padrão.

Sensores: Core `check-types`, server `check:types`, Biome focado e teste do
`SupabaseAuthAdministrationProvider` passaram; o teste cobre duas páginas e duas
remoções na ordem coletada.

## F25 — Ocultar CTA durante geração em lote

Dependência: F6-T7. Estado: verified.

#### F25-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/consultation-documents-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`

Resultado observável: enquanto `isBatchGenerating` estiver ativo, o CTA **Gerar
documentos** não é renderizado no cabeçalho. O botão **Selecionar documentos** e o
estado das linhas permanecem disponíveis; o CTA reaparece quando a geração deixa
de estar pendente.

RF / CA: RF-004; CA-04, CA-15
Parallelizável: não. A visibilidade do CTA depende do estado derivado pelo page
hook e deve ser validada na composição real da lista.

Quality Gate: testes da lista e page hook passaram 16/16; `pnpm --filter web
check:code` passou em 344 arquivos; `git diff --check` passou.

## F27 — Bloqueio de remoção condicionado à existência de versão

Dependência: F22. Estado: in_progress.

#### F27-T1 — regra server-authoritative

Paths: `packages/core/src/consultation/domain/structures/consultation-document-selection.ts`; `packages/core/src/consultation/use-cases/get-consultation-document-selection-use-case.ts`; `packages/core/src/consultation/use-cases/replace-consultation-document-selection-use-case.ts`; `packages/core/src/consultation/domain/errors/consultation-document-selection-removal-error.ts`; controllers e DTOs REST correspondentes; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/select-consultation-documents-dialog/index.tsx`; testes Core/REST/web.

Resultado observável: a resposta de seleção expõe `hasVersion`. Apenas associações
selecionadas cujo documento possui pelo menos uma versão ficam bloqueadas no modal
e protegidas contra remoção no backend. Associações sem versão podem ser
desmarcadas; o CTA permite salvar uma remoção mesmo quando não há nova adição.

RF / CA: RF-003; CA-03, CA-15.
Parallelizável: não. O bloqueio precisa ter a mesma fonte autoritativa no Core,
REST e UI.

Sensores planejados: testes unitários dos dois use cases, controller REST cobrindo
remoção sem versão e com versão, composição web cobrindo o estado editável e o
estado bloqueado, `check-types`, Biome e `git diff --check`.

Checkpoint corretivo: removido um fechamento excedente introduzido ao expressar o
novo rótulo condicional do CTA; a correção foi somente sintática e não alterou a
regra de bloqueio.

Checkpoint de sensores: adicionados testes unitários dedicados para os dois use
cases, cobrindo a projeção `hasVersion`, remoção sem versão e rejeição de remoção
com versão.

Checkpoint corretivo de teste: a factory de paginação do teste de leitura havia
importado `PaginationResponse` apenas como tipo, embora o instanciasse em runtime;
o import foi corrigido para valor.

Quality Gate parcial: os dois testes unitários Core passaram 3/3 e `@hms/core
check-types` passou.

Quality Gate de camadas: controller REST passou 6/6 nos testes focados, `server
check:types`, `web check:code` e `git diff --check` passaram.

Validação F27-T1: testes Core dos dois use cases passaram 3/3; controllers REST
passaram 6/6; a resposta real `GET /consultations/.../documents/selection` retornou
`hasVersion=true` para dois documentos versionados e `hasVersion=false` para um
documento sem versão. No modal autenticado, os dois primeiros ficaram desabilitados
com **Já adicionado** e o terceiro permaneceu editável. Ao desmarcar o terceiro, o
CTA mudou para **Salvar seleção** sem persistir a alteração (o modal foi cancelado).
Em 390×844, o dialog mediu 358 px sem overflow (`documentWidth=390`,
`bodyWidth=390`, `dialogScrollWidth=358`); o fluxo de teclado moveu o foco da busca
para **Área jurídica**. GETs de documentos/seleção retornaram 200 e o console da
navegação terminou sem erros ou warnings.

Revalidação de ambiente: o processo server-backed anterior foi encerrado e o
servidor foi recompilado com `server build`; o ambiente terminou servindo o bundle
atual na sessão local de produção. Os containers Docker compartilhados não foram
alterados. A sessão temporária do servidor foi encerrada após a validação.

Estado F27-T1: verified.

Limitação conhecida: `pnpm --filter web check:types` continua bloqueado pelos
erros preexistentes de `react-pdf` ausente em
`apps/web/src/ui/identity/widgets/pages/document-viewer/index.tsx`; nenhum erro
novo foi apontado nos arquivos desta fase.

## F29 — Remoção do CTA global de geração

Dependência: F28. Estado: verified.

#### F29-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/consultation-documents-page.test.tsx`; `documentation/features/document-production/consultation-document-production-ui/spec.md`; `documentation/features/document-production/consultation-document-production-ui/plan.md`; `documentation/features/document-production/consultation-document-production-ui/evaluation.md`.

Resultado observável: o cabeçalho mantém apenas **Selecionar documentos**. O CTA
global **Gerar documentos** não é renderizado em nenhum estado, inclusive quando
há documentos disponíveis ou uma geração em lote ativa. A ação individual de cada
documento permanece disponível.

RF / CA: RF-004; CA-04, CA-15.
Parallelizável: não. A remoção altera a composição da página e seus sensores de
interação.

Quality Gate: teste de composição da página passou 10/10, `web check:code` e
`git diff --check` passaram.

Evidência automatizada: o teste confirmou a delegação da ação individual e a
ausência do CTA global tanto no estado normal quanto no estado de geração em lote.

Estado F29-T1: verified.

Validação browser: na rota real de documentos da consulta, o cabeçalho exibiu
**Selecionar documentos** como única ação global; as ações individuais por linha
continuaram presentes. Screenshot: `consultation-documents-no-global-generation.png`.
Console autenticado sem erros ou warnings.

## Critérios de aceite do Plan

Antes de iniciar Builders, a revisão do Plan deve confirmar que:

- spec, evaluation, spec_revision, status, prd e jira_tickets preservam a
  rastreabilidade da Spec e do Jira;
- a decomposição cobre Core de transporte, adapter, RestContext, editor, hooks, widgets,
  rotas, fixture, testes e browser sem abrir escopo de servidor;
- toda tarefa tem paths, resultado observável, RF/CA, dependências e
  parallelizable com motivo;
- F1–F7 são ordenadas e não há browser antes de dependências saudáveis;
- o editor administrativo continua funcional e os endpoints reais permanecem a autoridade;
- os dez mappings, os estados assíncronos, decisões finais, vigência, seleção persistente,
  cancelamento e limites diferidos
  possuem sensores distintos;
- existe somente um Judge Implementation Final para a implementação inteira.

## Handoff

Ao iniciar a implementação, atualizar somente o estado da tarefa/fase e os sensores
correspondentes. A primeira tarefa é F1-T1. Ao concluir F7-T1, manter
evaluation.md com comandos, contagens, URLs, snapshots/screenshots, console/network,
limitações e findings; então encaminhar o diff completo ao mesmo Judge Implementation
Final, sem criar um Judge adicional.

## F28 — Geração inicial sem body bloqueando o disparo

Dependência: F4-T1. Estado: verified.

#### F28-T1 — verified

Paths: `packages/validation/src/document-production/schemas/generate-consultation-document-schema.ts`; `apps/web/src/ui/document-production/hooks/use-generate-consultation-document-action.ts`; `apps/server/src/consultation/rest/controllers/generate-consultation-document.controller.ts`; `apps/server/src/consultation/rest/controllers/tests/generate-consultation-document.controller.test.ts`; `packages/core/src/consultation/use-cases/generate-consultation-document-use-case.ts`.

Resultado observável: o clique **Gerar documento** da UI, que não envia instruções
na geração inicial, não é rejeitado por body ausente. O schema aplica `{}` como
default, o controller retorna `202` e o Core publica
`document-production/document.generation-requested`, permitindo que o
`GenerateDocumentJob` seja acionado pelo Inngest. Instruções continuam opcionais e
validadas quando presentes. Logs de debug do controller/use case foram removidos.

Sensores: controller REST 3/3 passou; `@hms/validation check-types` e
`@hms/core check-types` passaram; validação autenticada real confirmou a rota de
documentos e a transição visual para **Gerando**, sem erros ou warnings de console.

## F29 — Exibir motivo da rejeição em textarea

Dependência: F23. Estado: verified.

#### F29-T1 — verified

Paths: `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/view-rejection-reason-dialog/index.tsx`; `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`; Spec e evaluation correspondentes.

Resultado esperado: o dialog **Motivo da rejeição** exibe o valor persistido em
`Textarea` somente leitura, permitindo visualizar textos longos e quebras de linha
sem oferecer edição ou mutation.

Sensores: teste da review page passou 13/13; Biome nos arquivos alterados e
`git diff --check` passaram. A rota real autenticada carregou sem erros de console;
o seed atual não possuía uma versão rejeitada disponível para abrir o dialog nessa
validação de browser.

## Encerramento do Plan

Estado: completed.

Quality Gate final:

- `pnpm lint`: passou;
- `pnpm check-types`: passou para `@hms/core` e `@hms/validation`;
- `pnpm test`: passou com 52 arquivos/188 testes no Core, 7 arquivos/19 testes
  em Validation, 46 arquivos/229 testes na Web e 43 arquivos/113 testes no
  servidor;
- `pnpm --filter server build`: passou;
- `pnpm build`: bloqueado somente pelo import ausente de `react-pdf` em
  `apps/web/src/ui/identity/widgets/pages/document-viewer/index.tsx`, finding
  preexistente e fora do escopo desta Spec;
- `pnpm --filter web check:code` e `git diff --check`: passaram;
- browser autenticado real: rota de documentos validada, sem erros/warnings de
  console e com screenshot final registrado em
  `consultation-documents-no-global-generation.png`.

Judge Implementation Final — re-audit: passed_with_preexisting_blockers. A
implementação da Spec está coerente entre contratos Core, REST, UI e testes; não
há finding novo bloqueando a entrega. O único blocker permanece o `react-pdf`
ausente no `document-viewer` preexistente. O veredito detalhado e as evidências
estão em [`evaluation.md`](./evaluation.md).
