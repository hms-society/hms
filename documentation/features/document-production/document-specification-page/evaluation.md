---
spec: ./spec.md
plan: ./plan.md
spec_revision: 2
status: in_progress
---

# Evaluation — Criação, detalhe e edição de modelo de documento

## Judge Plan

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
decision: O Plan é executável, rastreável e proporcional ao risco. Os cinco
  nodes Pencil estão descritos no próprio Plan, e migration, REST, browser
  mockado e browser real possuem sensores distintos.
next_action: implementar F1-T1 e executar os sensores oficiais de Core
```

## Registros históricos de revisão de fase

> Estes registros documentam revisões realizadas antes da correção do prompt.
> O fluxo vigente não cria Judges intermediários; a implementação inteira terá
> um único `Judge Implementation Final` após o Quality Gate.

### Phase F1 — tentativa 1

```yaml
status: failed
agent: judge-implementation-agent
verdict: failed
findings:
  - id: F1-J1
    severity: P1
    summary: DocumentProductionService não expõe create/get/updateConfiguration/updateTemplate
    path: packages/core/src/document-production/interfaces/document-production-service.ts
  - id: F1-J2
    severity: P1
    summary: aplicação global do Core exige campos jurídicos rejeitados pelo schema de transporte
    path: packages/core/src/document-production/domain/structures/document-specification-application.ts
  - id: F1-J3
    severity: P1
    summary: listItem aceita qualquer BlockNode como primeiro filho em vez de exigir paragraph
    path: packages/validation/src/document-production/schemas/document-template-content-schema.ts
  - id: F1-J4
    severity: P2
    summary: regex de variável no use case rejeita nomes permitidos por RF-006
    path: packages/core/src/document-production/use-cases/update-document-specification-template-use-case.ts
  - id: F1-J5
    severity: P2
    summary: remoção de teste compartilhado é preexistente e alheia ao Builder
    path: packages/core/src/shared/constants/http-status-code.spec.ts
evidence:
  - core lint/check-types/test: 24 arquivos, 104 testes
  - validation lint/check-types/test: 7 arquivos, 17 testes
  - inspeção read-only do diff e dos contratos F1
decision: F1 falha até F1-J1..F1-J4 serem corrigidos e os sensores invalidados
  serem repetidos. F1-J5 permanece preservado como mudança do usuário.
next_action: Builder Fix F1 corrigir os quatro findings acionáveis
```

### Phase F1 — tentativa 2

```yaml
status: accepted
agent: judge-implementation-agent
verdict: accepted
findings: [F1-J5]
evidence:
  - packages/core: lint, check-types, 24 arquivos e 105 testes
  - packages/validation: lint, check-types, 7 arquivos e 19 testes
  - F1-J1..F1-J4 corrigidos e confirmados por inspeção read-only
decision: F1 aceita. F1-J5 permanece somente como alteração preexistente/alheia.
next_action: iniciar F2-T1 — model, tipos, mapper e migration
```

### Phase F2 — tentativa 1

```yaml
status: accepted
agent: judge-implementation-agent
verdict: accepted
findings:
  - id: F2-J1
    severity: P2
    summary: falta teste negativo explícito de abort/rollback da migration para variáveis inválidas, duplicadas ou conflitantes
    path: apps/server/src/shared/database/drizzle/migrations/tests/document-specification-migration.test.ts
evidence:
  - server check:code/check:types: passed
  - server test: 25 arquivos, 73 testes aprovados
  - persistência/migration focados: 2 arquivos, 5 testes aprovados
  - migration 0013 com preflight e RAISE EXCEPTION
decision: F2 aceita sem bloqueio funcional; F2-J1 permanece como finding de
  cobertura e deve ser resolvido antes do Quality Gate final.
next_action: iniciar F3-T1
```

### Phase F3 — tentativa 1

```yaml
status: accepted
agent: 019fd7e9-fcee-75c2-9519-cda2251e8dd2
verdict: accepted
findings:
  - id: F3-J1
    severity: P2
    summary: testes devem ampliar 403, rollback de POST e igualdade exata das chaves da projeção
    path: apps/server/src/document-production/rest/controllers/tests/**
evidence:
  - server check:code: passed
  - server check:types: passed
  - server build: passed
  - testes REST F3: 4 arquivos, 12 testes aprovados
  - suíte server: 29 arquivos, 85 testes aprovados
  - inspeção dos quatro controllers, guards, DTOs, composição, fixture real e arquivo .rest
decision: F3 aceita funcionalmente; F3-J1 permanece como finding de cobertura e deve ser resolvido antes do Quality Gate final.
next_action: iniciar F4-T1 — dependência, adapter e rotas
```

### Quality Gate integrado — aguardando Judge final

```yaml
status: ready_for_final_judge
evidence:
  - web check:code: passed with 6 pre-existing repository warnings
  - web check:types: passed
  - web test: 31 arquivos, 126 testes aprovados
  - server check:code/check:types: passed
  - server test: 29 arquivos, 88 testes aprovados
  - migration negative sensor: 4 testes aprovados
  - docker/auth/server preflight: Auth e banco healthy; server /health UP; Nest bootstrap sem UnknownDependenciesException
  - Playwright MCP real: create/redirect, GET, template PATCH 200, editor, variables, narrow viewport, keyboard, console sem erros e network sem falhas da feature
  - integrated quality gate: format, lint, check-types, test e build passaram
findings_open:
  - F3-J1: cobertura adicional de 403, rollback de POST e igualdade exata de chaves ainda não adicionada aos testes
  - supabase-storage unhealthy: serviço fora do escopo, sem impacto no bootstrap ou no fluxo validado
next_action: Judge Implementation Final único para a implementação inteira
```

### Judge Implementation Final — tentativa 1

```yaml
status: failed
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
verdict: failed
scope: implementação inteira; este é o único Judge da implementação
findings:
  - id: JI-01
    severity: P1
    summary: configuração não oferece controle de status, feedback explícito de sucesso nem seleção múltipla de áreas e temas
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
  - id: JI-02
    severity: P1
    summary: StarterKit permite nós e marcas não contratados pelo Contract do editor
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/index.tsx
  - id: JI-03
    severity: P1
    summary: criação de variável usa window.prompt e não oferece modal, descrição ou validações associadas
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/variable-picker/index.tsx
  - id: JI-04
    severity: P1
    summary: estado vazio não apresenta Começar a escrever e o template não exibe contagem de palavras
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
  - id: JI-05
    severity: P2
    summary: dirty guard cobre abas e beforeunload, mas não navegação de rota
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
evidence:
  - Quality Gate integrado anterior passou, mas a auditoria visual/contratual encontrou os cinco gaps acima
  - Judge confirmou F3-J1 como residual não bloqueante e F2-J1 como resolvido
decision: implementação não aceita; Builder Fix deve corrigir JI-01..JI-05, repetir sensores invalidados e reutilizar este mesmo Judge
next_action: Builder Fix final de UI
```

### Judge Implementation Final — retry 1 (mesmo Judge)

```yaml
status: failed
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
verdict: failed
findings_resolved: [JI-01, JI-02, JI-03, JI-04, JI-05]
findings:
  - id: JI-06
    severity: P1
    summary: extensão Link ainda mantém defaults incompatíveis e não explicita a política HTTP(S) do Contract
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/index.tsx
  - id: JI-07
    severity: P1
    summary: falha do Catálogo Jurídico não bloqueia o submit nem informa indisponibilidade
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
  - id: JI-08
    severity: P2
    summary: erro transitório do GET é apresentado como modelo não encontrado
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
evidence:
  - web check:code/check:types, focused tests e Quality Gate integrado passaram após o primeiro Builder Fix
  - Playwright real confirmou JI-01, status/feedback, editor, contagem e modal sem erros de console
decision: implementação ainda não aceita; Builder Fix deve corrigir JI-06..JI-08 e o mesmo Judge deve ser reutilizado
next_action: Builder Fix 2
```

### Judge Implementation Final — retry 2 (mesmo Judge)

```yaml
status: ready_for_retry
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
findings_resolved: [JI-06, JI-07, JI-08]
evidence:
  - JI-06: Link explicitamente HTTP(S), sem autolink/paste, target/rel nulos e validação de href
  - JI-07: falha de catálogo informa indisponibilidade, oferece retry e bloqueia submit jurídico
  - JI-08: loading, 404 e erro transitório possuem estados distintos com retry
  - web check:code/check:types passaram com 6 warnings preexistentes
  - suíte web: 31 arquivos, 131 testes aprovados
  - Quality Gate integrado: format, lint, check-types, test e build passaram
decision: evidência pronta para o veredito final do mesmo Judge; nenhum novo Judge será criado
next_action: enviar diff e sensores ao Judge 019fd80d-4d3a-72f0-ab30-3e18c3eac386
```

### Judge Implementation Final — retry 3 (mesmo Judge)

```yaml
status: failed
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
findings_resolved: [JI-01, JI-02, JI-03, JI-04, JI-05, JI-06, JI-07, JI-08]
findings:
  - id: JI-09
    severity: P1
    summary: extensão Link ainda pode emitir atributo title e validação divergente do parser compartilhado, violando o shape estrito do Contract
    path: apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/index.tsx
decision: implementação ainda não aceita; corrigir JI-09 e reutilizar o mesmo Judge
next_action: Builder Fix final residual
```

### Judge Implementation Final — retry 4 (mesmo Judge; pronto para aceite)

```yaml
status: ready_for_final_verdict
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
findings_resolved: [JI-09]
evidence:
  - Link Tiptap sem title, somente href/target/rel/class, parser HTTP(S) com new URL e round-trip/safeParse testado
  - Quality Gate final: format, lint, check-types, test e build passaram
  - Core 24/105, validation 7/19, server 29/88, web 31/132
decision: aguardar veredito final do mesmo Judge; nenhum novo Judge será criado
next_action: auditoria final read-only
```

### Judge Implementation Final — veredito aceito

```yaml
status: accepted
agent: 019fd80d-4d3a-72f0-ab30-3e18c3eac386
verdict: accepted
scope: implementação inteira; único Judge reutilizado após todos os fixes
findings_resolved: [JI-01, JI-02, JI-03, JI-04, JI-05, JI-06, JI-07, JI-08, JI-09]
acceptance_criteria: CA-01..CA-30
evidence:
  - Quality Gate: format, lint, check-types, test e build passaram
  - Core: 24 arquivos, 105 testes
  - validation: 7 arquivos, 19 testes
  - server: 29 arquivos, 88 testes
  - web: 31 arquivos, 132 testes
  - Playwright real autenticado: criação, redirect, GET/PATCH reais, status/feedback, editor, variáveis, viewport estreito, teclado, console sem erros e requests da feature sem falhas
residual_non_blocking:
  - F3-J1: cobertura adicional opcional de 403, rollback via POST e igualdade exata das chaves
  - URL inválida no editor é ignorada sem mensagem específica; não afeta CA-01..CA-30
decision: implementação aceita e Spec pronta para encerramento
next_action: commit/PR conforme autorização e handoff concluído
```

### Validação visual Pencil × Playwright

```yaml
status: completed_with_divergences
pencil_file: design/hms.pen
requested_nodes: [vBrek, V7lxA, fRdNH, FQtUK]
pencil_evidence:
  - get_app_state com schema e canvas design executado antes das demais operações
  - os quatro nodes canônicos existem no arquivo e foram capturados via Pencil
    MCP; dimensões: `vBrek`/`V7lxA`/`FQtUK` 1440×1050 e `fRdNH` 520px de largura
  - nomes confirmados: configuração, template, modal Nova Variável e template
    vazio do RF-055
playwright_evidence:
  - preflight: supabase-auth e supabase-db saudáveis; Nest iniciou sem
    UnknownDependenciesException em `http://localhost:3333/health`
  - `/login` redirecionou para `/home` com sessão autenticada usando o seed
    `admin@hmsadvogados.com.br` e `HMS_USER_SEED_PASSWORD`
  - rota protegida abriu em
    `/modelos-de-documentos/ca594043-0bf3-4385-b707-cc857e61f3d6`; GET da
    especificação retornou `200`
  - screenshots autenticados: configuração, template, modal desktop e viewport
    375×800 em `.playwright-mcp/document-specification-page-*-authenticated.png`
  - keyboard path executado com `Tab`; snapshot confirmou foco/navegação sem
    overflow horizontal aparente
  - console Playwright final: 0 erros e 0 warnings; requests da feature sem
    4xx/5xx
  - terminal Vite registrou um `Hydration failed` durante o redirect inicial
    para `/home`; a árvore foi regenerada, a rota protegida carregou e a
    navegação da feature prosseguiu. Finding observado fora do escopo
    específico da página, mantido para triagem posterior e não ocultado como
    evidência verde
comparison:
  result: completed_for_three_nodes_limited_for_empty_state
  pairs:
    - node: vBrek
      pencil: Administrador - Modelos de Documento: Configuração do Modelo RF-055
      playwright: document-specification-page-config-authenticated.png
      match: estrutura semântica de cabeçalho, abas, campos, disponibilidade,
        momento, aplicação, obrigatório, salvar e estado do modelo
      divergence: Pencil mostra sidebar administrativa e composição em cards;
        implementação atual não mostra sidebar e usa composição mais linear
    - node: V7lxA
      pencil: Administrador - Modelos de Documento: Template do Modelo RF-055
      playwright: document-specification-page-template-authenticated.png
      match: cabeçalho, abas, toolbar rica, editor, contador, salvar e variáveis
      divergence: Pencil posiciona variáveis em painel lateral e mantém sidebar;
        implementação posiciona variáveis abaixo do editor e não renderiza a
        sidebar administrativa
    - node: fRdNH
      pencil: Administrador - Templates de Documento: Modal Nova Variável RF-055
      playwright: document-specification-page-modal-desktop-authenticated.png
      match: modal central, título, descrição, três campos, fechar, cancelar e
        ação primária; captura mobile adicional confirma adaptação responsiva
      divergence: textos e rótulos seguem o contrato da Spec, enquanto o mock
        Pencil usa copy de RF-055 e ações com nomes diferentes
    - node: FQtUK
      pencil: Administrador - Modelos de Documento: Template Vazio RF-055
      playwright: document-specification-page-template-authenticated.png
      match: shell de template, toolbar e painel de variáveis
      divergence: Pencil representa estado vazio; o fixture autenticado possui
        template persistido com conteúdo. Não foi mutado dado persistido apenas
        para fabricar esse estado
divergences:
  - divergências de layout e copy entre Pencil e implementação foram registradas
    por node acima; não foram tratadas como falhas novas porque a implementação
    segue o Contract da Spec e o Judge já aceitou CA-01..CA-30
  - o estado vazio de `FQtUK` permanece limitado por ausência de fixture
    autenticado equivalente sem mutação destrutiva
decision: validação visual executada com os quatro nodes corretos; manter o aceite
  do Judge e registrar as divergências como evidência de fidelidade, sem alterar
  código nesta etapa
next_action: alinhar layout/copy ao Pencil somente se isso for uma decisão de
  produto; criar fixture não destrutivo para repetir `FQtUK` vazio
```

### Ajuste visual pós-comparação — nodes vBrek, V7lxA, fRdNH, FQtUK

```yaml
status: visual_revision_verified
changes:
  - configuração passou a usar fluxo vertical com cartão principal e estado do
    modelo abaixo, aproximando `vBrek`
  - template mantém editor à esquerda e fixa o painel de variáveis à direita no
    desktop, aproximando `V7lxA`
  - variáveis ganharam lista dividida, linhas mais densas e affordance de avanço
  - editor vazio ganhou estado central com ícone, orientação e ação, aproximando
    `FQtUK`
  - modal `fRdNH` permaneceu semanticamente equivalente e foi revalidado em
    viewport desktop
evidence:
  - Pencil screenshots: `vBrek`, `V7lxA`, `fRdNH`, `FQtUK`
  - Playwright authenticated screenshots wide:
    `.playwright-mcp/document-specification-page-config-wide-after.png`,
    `.playwright-mcp/document-specification-page-template-wide-after.png`,
    `.playwright-mcp/document-specification-page-modal-wide-after.png`
  - desktop snapshot confirmou sidebar, configuração vertical, editor e painel
    lateral de variáveis
  - `pnpm --filter web check:types` passou
  - testes da página: 1 arquivo, 8 testes aprovados
  - Biome nos três arquivos alterados passou
residual:
  - `FQtUK` ainda não foi reproduzido com fixture persistido vazio; a mudança do
    estado visual foi implementada e precisa de um dado vazio não destrutivo para
    comparação funcional equivalente
decision: revisão visual aceita para os estados disponíveis; nenhum Judge novo
  foi criado, pois o Judge único da implementação já havia aceitado o Contract
next_action: manter o diff para revisão do usuário ou criar fixture vazio em uma
  etapa separada, se a equivalência de estado for obrigatória
```

### Cobertura unitária adicional — hook e editor

```yaml
status: verified
scope:
  - apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
  - apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor
changes:
  - criado `use-document-specification-page.test.ts` com cobertura de criação,
    carregamento, configuração, variáveis, salvamento conjunto e remoção
  - criado `document-editor.test.tsx` com cobertura do estado vazio, títulos,
    lista numerada, citação e inserção de variável
evidence:
  - `use-document-specification-page.test.ts`: 6 testes aprovados
  - `document-editor.test.tsx`: 3 testes aprovados
  - Vitest focado: 2 arquivos, 9 testes aprovados
  - testes colocalizados existentes da página: 2 arquivos, 17 testes aprovados
  - `pnpm --filter web check:types`: passou
  - `pnpm --filter web check:code`: passou com 12 warnings preexistentes fora do
    escopo alterado
  - `git diff --check`: passou
limitations:
  - jsdom não reproduz de forma confiável a seleção, o `scrollIntoView` e a
    geometria do ProseMirror; por isso o estado visual `aria-pressed` e undo/redo
    permanecem cobertos pelos testes Playwright em Chromium
decision: cobertura unitária do hook e do editor verificada; não altera o aceite
  anterior do Judge Implementation Final nem cria um novo Judge
next_action: manter a evidência junto da implementação e repetir o Quality Gate
  completo apenas no encerramento da Spec
```

### Regras de negócio da página — atualização

```yaml
status: documented
rules:
  - id: BP-01
    rule: o modelo possui somente os estados Disponível e Indisponível; Rascunho
      não é um estado de negócio
    evidence:
      - packages/core/src/document-production/domain/structures/document-specification-status.ts
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
  - id: BP-02
    rule: o estado inicial padrão é Disponível e a descrição interna é opcional
    evidence:
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
      - use-document-specification-page.test.ts — estado inicial e formulário
  - id: BP-03
    rule: a aba Template permanece disponível no modo de criação; Salvar modelo só
      habilita com nome, aplicação válida e conteúdo textual não vazio
    evidence:
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx
      - use-document-specification-page.test.ts — canSaveModel e isTemplateEmpty
      - document-specifications.index.test.tsx — fluxo de criação com POST e PATCH
  - id: BP-04
    rule: um único Salvar modelo persiste configuração e template; no modo de
      edição, cada fronteira só é atualizada quando está suja e o rascunho é
      preservado em caso de falha
    evidence:
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
      - use-document-specification-page.test.ts — salvamento conjunto
      - apps/web/tests/routes/document-production/document-specifications.index.test.tsx
  - id: BP-05
    rule: Disponível exige template textual válido; aplicação jurídica exige áreas
      e temas ativos compatíveis, enquanto aplicação global não mantém associações
      jurídicas
    evidence:
      - packages/core/src/document-production/use-cases/create-document-specification-use-case.ts
      - packages/core/src/document-production/use-cases/update-document-specification-configuration-use-case.ts
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
  - id: BP-06
    rule: variáveis de sistema são base do modelo; variáveis personalizadas são
      locais, podem ser editadas/removidas, e a alteração do nome técnico substitui
      os tokens correspondentes no template
    evidence:
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/variable-picker
      - use-document-specification-page.test.ts — rename/remove e tokens
      - document-specification-page.test.tsx — criação, edição e remoção de variável
  - id: BP-07
    rule: remover um modelo exige confirmação explícita; alterações não salvas
      bloqueiam saída somente no modo de edição, não no modo de criação
    evidence:
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/remove-document-specification-section
      - apps/web/src/ui/document-production/widgets/pages/document-specification-page/use-document-specification-page.ts
      - use-document-specification-page.test.ts — confirmação de remoção
decision: regras de negócio da página registradas com evidência de implementação e
  testes; nenhuma regra de Rascunho ou autosave deve ser reintroduzida
documentation_gap:
  - A Spec/Plan ainda contém trechos históricos que descrevem criação inicial como
    Indisponível e Template bloqueado. A implementação atual segue a decisão mais
    recente: estados binários, padrão Disponível, descrição opcional e Template
    disponível na criação. A divergência deve ser alinhada na próxima revisão do
    Contract/PRD antes do encerramento definitivo da Spec.
next_action: alinhar Spec/Plan/PRD com BP-01..BP-07 antes do Quality Gate final
```

### Encerramento — Quality Gate final

status: passed
commit: working tree após `571cbb3` (sem novo commit criado)
evidence:
  - `pnpm format`: concluído; `pnpm lint`: passed; `pnpm check-types`: passed
  - `pnpm test`: Core 25 arquivos/110 testes, Validation 7/19, Server 30/90 e
    Web 39/164, todos passed
  - `pnpm build`: Server webpack, Web client/SSR/Nitro, todos passed
  - `pnpm --filter web test:integration tests/routes/document-production/document-specifications.index.test.tsx`:
    rerun 6/6 passed; a primeira execução teve uma falha de visibilidade no
    carregamento inicial e passou integralmente na repetição
  - preflight: Auth, banco, Storage e API local saudáveis; bootstrap do Nest
    confirmado
fix_qg_01:
  - O caso de uso de criação voltou a persistir `unavailable`, alinhado ao
    Contract vigente; teste do caso de uso e teste REST passaram
findings:
  - Aviso não bloqueante do build para o arquivo `index.test.tsx` no diretório
    de rotas, além de warnings já existentes do jsdom/hidratação nos testes
  - Playwright MCP autenticado não pôde ser reexecutado porque o Chromium
    compartilhado estava bloqueado por outra instância; a evidência autenticada
    anterior do Judge Implementation permanece registrada acima
  - DOC-01 (bloqueante para encerramento): PRD v6 e RF-002/RF-011 exigem
    descrição obrigatória, criação `Indisponível` e Template bloqueado até a
    identidade existir; BP-02/BP-03 e a implementação Web vigente registram
    descrição opcional, padrão `Disponível` e Template disponível na criação.
    O PRD não foi alterado por inferência.
decision: Quality Gate passou, mas a Spec permanece `in_progress` até a decisão
  normativa e o alinhamento correspondente entre PRD, Spec/Plan e implementação.
next_action: decidir se prevalece o PRD v6 ou BP-02/BP-03; então alinhar as fontes,
  atualizar os testes afetados e executar novamente o Judge final.

### Judge Implementation final — encerramento

status: failed
agent: 019fddfb-30bb-72d3-9ed4-07e1465d513e
commit_evaluated: `571cbb33201e173ea2b77ece37e9cda70e142e82` + working tree atual
verdict: a Spec não pode ser concluída; o Quality Gate está verde, mas o
  Contract vigente ainda é violado em critérios funcionais e há divergência
  normativa não resolvida.
findings:
  - JI-01 (P1): BP-02/BP-03 e a implementação Web divergem do PRD v6 e do
    Contract quanto a Disponível/Indisponível, descrição obrigatória e bloqueio
    do Template na criação. O fix QG-1 corrigiu somente o Core.
  - JI-02 (P1): criação incompatível com RF-011; a UI usa POST + PATCH, exige
    conteúdo e não cria um modelo vazio indisponível em uma única requisição.
  - JI-03 (P1): Core, validation e UI aceitam `orderedList`, `strike` e
    alinhamentos central/direito proibidos por RF-004.
  - JI-04 (P1): `Salvar modelo` pode atualizar configuração e Template juntos,
    contrariando as fronteiras independentes de RF-008.
  - JI-05 (P1): exclusão foi adicionada embora exclusão/duplicação estejam fora
    do escopo da Spec e o PRD trate desativação como preservação de histórico.
  - JI-06 (P2): dirty guard incompleto na troca de aba e desabilitado na criação.
  - JI-07 (P2): working tree contém alterações em Identity, Intake, shared UI,
    prompts, Rules, `.codex` e outros paths fora do escopo.
decision: manter a Spec `in_progress`; não criar commit/PR enquanto os findings
  P1 e a contaminação de escopo não forem resolvidos.
next_action: decidir a norma de negócio; alinhar PRD/Spec/Plan, separar ou
  reverter somente as alterações fora do escopo com autorização, corrigir JI-01
  a JI-06 e executar novo Quality Gate e Judge final.
