---
spec: ./spec.md
plan: ./plan.md
spec_revision: 3
status: accepted
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
documentation_gap: []
prd_alignment:
  status: updated
  page_id: 2588673
  version: 7
  section: "11.8 — Decisões de produto — Revisão do Contract da página de especificação"
  updated_at: 2026-08-09
next_action: concluir o Quality Gate e o único Judge Implementation da revisão 3
```

### Rebaseline normativo e correções aplicadas — 2026-08-09

```yaml
status: in_progress
decision:
  - as decisões de negócio mais recentes da demanda substituem os trechos antigos
    do PRD para esta implementação
  - a Spec revisão 3 passou a ser a fonte normativa local
changes:
  - criação envia configuração, conteúdo e variáveis no mesmo POST e inicia como
    Disponível
  - descrição interna permanece opcional
  - Template permanece acessível no modo de criação
  - schema e Core aceitam lista numerada, strike e alinhamentos left/center/right
  - botão Salvar modelo é a ação de confirmação do modo de criação
  - remoção confirmada permanece incluída conforme decisão explícita da demanda
evidence:
  - `pnpm --filter @hms/core check-types`: passed
  - `pnpm --filter @hms/core test`: 25 arquivos, 112 testes passed
  - regressão adicionada para edição de variável de sistema: o alias técnico
    derivado do rótulo preserva `systemTechnicalName` e passa pelo salvamento conjunto
  - `pnpm --filter @hms/validation check-types`: passed
  - `pnpm --filter @hms/validation test`: 7 arquivos, 19 testes passed
  - `pnpm --filter server check:types`: passed
  - `pnpm --filter web check:types`: passed
  - `pnpm --filter web test`: 39 arquivos, 164 testes passed
  - `pnpm --filter server build`: passed
  - `pnpm --filter web build`: passed; aviso preexistente de `index.test.ts` sem `Route`
  - testes de página/hook Web: 2 arquivos, 17 testes passed
  - Playwright da rota document-production: 6/6 passed
  - salvamento em edição: um PATCH de configuração carrega configuração,
    conteúdo e variáveis; o PATCH de template não é disparado
  - `git diff --check`: passed
  - Biome check dos arquivos alterados: passed
blocked:
  - teste REST com banco real não iniciou porque Testcontainers não encontrou um
    runtime de containers disponível no ambiente
  - Playwright emite aviso preexistente para `src/routes/modelos-de-documentos/index.test.ts`
  - gates Pencil e Playwright autenticado ainda precisam de evidência final
next_action: executar o Quality Gate completo e então rodar um único Judge
  Implementation final para a revisão 3
```

### Encerramento — Quality Gate final (histórico da revisão 2)

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

### Judge Implementation final — encerramento (histórico da revisão 2)

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

### Quality Gate final — revisão 3 — evidência atual

status: ready_for_final_judge
spec_revision: 3
prd_version: 7
evidence:
  - `pnpm lint`: passed
  - `pnpm check-types`: passed para Core, Validation, server e web
  - `pnpm test`: passed anteriormente no monorepo; Core 25/112, Validation 7/19,
    Web 39/164 e Server 30/90
  - `pnpm --filter @hms/core test`: 25 arquivos, 113 testes passed após a
    regressão de criação indisponível sem template
  - `pnpm --filter @hms/validation test`: 7 arquivos, 19 testes passed
  - `pnpm --filter server test -- src/document-production`: 7 arquivos, 25
    testes passed
  - `pnpm --filter web test`: 39 arquivos, 166 testes passed
  - `pnpm build`: server e web client/SSR/Nitro passed
  - Biome direcionado ao escopo Core/Validation/server/document-production/web:
    passed; `git diff --check`: passed
  - Pencil: screenshots verificadas para `K2Fvp`, `vBrek`, `V7lxA`, `FQtUK` e
    `fRdNH`; sem clipping ou desalinhamento estrutural evidente
  - Playwright autenticado real: `/login` redirecionou para `/home`, refresh
    token e `/collaborators/me` retornaram 200; listagem e detalhe usaram GET
    real; criação indisponível sem template foi salva via POST, redirecionou
    para o detalhe e foi removida via modal de confirmação real; retorno para a
    listagem confirmado
  - Playwright UI: Template acessível na criação, empty state, inserção de
    variável, Save habilitado somente após configuração/conteúdo mínimo (ou
    status indisponível), viewport 390px, caminho de teclado e reflow em tema
    escuro verificados
  - Playwright final: navegação nova sem erros de console; requests de
    colaboradores/lista em 200
known_non_blocking:
  - aviso de build para `apps/web/src/routes/modelos-de-documentos/index.test.ts`
    sem export `Route`, já existente no projeto
  - mensagens jsdom `requestSubmit`/navigation only durante testes, sem falha
scope_allowlist:
  - `packages/core/src/document-production/**`
  - `packages/validation/src/document-production/**`
  - `apps/server/src/document-production/**`
  - `apps/web/src/constants/routes.ts`
  - `apps/web/src/rest/services/document-production-service.ts`
  - `apps/web/src/ui/document-production/**`
  - `apps/web/src/ui/shared/widgets/components/{anchor,page-title,table-surface}/**`
  - `apps/web/tests/fixtures/document-production-fixture.ts`
  - `apps/web/tests/routes/document-production/**`
  - feature `spec.md`, `plan.md` e `evaluation.md`
unrelated_preserved_user_changes:
  - `.codex/skills/create-pr/SKILL.md`
  - `apps/web/src/ui/identity/**`
  - `apps/web/src/ui/intake/**`
  - `apps/web/src/ui/shared/**` fora dos componentes listados no allowlist
  - `packages/core/src/intake/domain/entities/intake.ts`
  - `documentation/agents/**`
  - `documentation/prompts/**`
  - `documentation/rules/**`
  - `documentation/sdd.md`
  - `PRD_RFC_TDD.excalidraw`
decision: manter essas alterações de usuário intactas e fora do julgamento da
feature; nenhum reset ou remoção destrutiva foi executado.
next_action: reavaliar a implementação inteira pelo mesmo único Judge

### Correções posteriores ao Judge — JI-10 a JI-13

status: ready_for_final_judge_retry
fixes:
  JI-10:
    - update de configuração indisponível com conteúdo vazio não força validação
      de template; criação e edição foram cobertas no Core e no hook
    - Playwright real confirmou POST 201, PATCH de configuração 200 sem template,
      toast de sucesso e DELETE 204 do registro descartável
  JI-11:
    - troca de aplicação jurídica para Global confirma antes de limpar áreas e
      temas; cancelamento real preservou `Áreas e temas selecionados`
  JI-12:
    - `status`, `isRequired`, `modelName`, toggles e valores derivados foram
      movidos para `use-document-specification-page.ts`; o entrypoint não chama
      mais `form.watch`/`form.setValue`
  JI-13:
    - criação e remoção aguardam `useNavigation().navigateTo` com rotas canônicas
      e `replace: true`; não há mais `window.location` na página
evidence_after_fixes:
  - Core: 25 arquivos, 114 testes passed
  - Validation: 7 arquivos, 19 testes passed
  - Server document-production: 7 arquivos, 25 testes passed
  - Web: 39 arquivos, 168 testes passed na repetição; a execução imediatamente
    anterior teve timeout flake em Identity e erro jsdom assíncrono, reproduzido
    como não determinístico e não presente na repetição
  - `pnpm build`: passed para server e web client/SSR/Nitro
  - check-types Core/Validation/server/web: passed
  - Biome direcionado e `git diff --check`: passed
  - Playwright real pós-correção: console sem erros; requests críticos 200/201/
    204, sem GET 404 após exclusão
next_action: reavaliar JI-10 a JI-13 pelo mesmo único Judge Implementation

### Judge Implementation final — revisão 3 — único julgamento da implementação inteira

status: accepted
agent: 019fe76d-f32e-7f03-bdcd-aa9cd03f6b07
judge: same_unique_final_judge
spec_revision: 3
prd: "v7 §11.8"
scope: implementação inteira da página de especificação de documento
criteria: CA-01–CA-32 atendidos
findings: []
sensors:
  lint: passed
  typecheck: passed
  tests:
    core: "25 arquivos, 114 testes"
    validation: "7 arquivos, 19 testes"
    server_document_production: "7 arquivos, 25 testes"
    web: "39 arquivos, 168 testes"
  build: passed
  biome: passed
  diff_check: passed
  playwright_authenticated: passed
  pencil: passed
  console_network: clean
observations:
  - JI-10–JI-13 foram corrigidos e verificados pelo mesmo Judge.
  - O flake anterior da suíte Web não foi reproduzido na repetição.
  - Alterações `unrelated_preserved_user_changes` permanecem preservadas e
    fora do julgamento.
decision: Quality Gate, Pencil, Playwright autenticado e o único Judge da
  implementação inteira foram concluídos com aceite.
next_action: handoff para commit/PR, quando solicitado

### Quality Gate final — rerun do conclude-spec

status: passed
date: 2026-08-09
evidence:
  - `pnpm format`: passed; após os ajustes finais, 1.587 arquivos foram
    verificados e 7 formatados
  - `pnpm lint`: passed
  - `pnpm check-types`: passed em Core, Validation, Server e Web
  - `pnpm test`: Core 25/114, Validation 7/19, Server 30/90 e Web 39/168,
    todos passed na execução final; notices do PostgreSQL e warnings jsdom
    conhecidos foram classificados como não bloqueantes
  - `pnpm build`: Server webpack e Web client/SSR/Nitro passed
  - `pnpm --filter web test:integration
    tests/routes/document-production/document-specifications.index.test.tsx`:
    6/6 passed após o teste passar a aceitar explicitamente o dirty guard ao
    trocar de Configuração para Template
  - correção QG-02: o teste unitário do editor passou a fornecer as APIs
    geométricas de `Range` exigidas pelo ProseMirror no jsdom; teste focado 3/3
    e suíte Web final 168/168 passaram sem erro não tratado
findings:
  - o primeiro rerun da suíte Web tinha 168 testes verdes, mas 1 erro não
    tratado de `Range.getClientRects`; corrigido no harness do teste e revalidado
  - a primeira integração completa teve 37/38 aprovados porque o teste de
    troca de aba não aceitava o `window.confirm` do dirty guard; corrigido e
    revalidado em 6/6
  - permanece o warning não bloqueante de `index.test.ts` tratado como arquivo
    de rota pelo TanStack Router, além de warnings conhecidos de hidratação/jsdom
scope_delivery:
  - contratos/core/validation
  - migrations 0011/0012
  - API/server e migration 0013
  - superfícies compartilhadas
  - listagem Web e integração
  - editor Web e integração
  - documentação da Spec/Plan/evaluation
pr_split:
  - cada fatia ficará abaixo de 5.000 linhas contra seu branch-base; ordem e
    dependências serão registradas nos PRs
decision: Quality Gate e integração final passaram; o único Judge da implementação
  inteira permanece aceito. A entrega está pronta para commits e PRs empilhados,
  mantendo alterações alheias fora do escopo.
delivery_prs:
  contracts: https://github.com/hms-society/hms/pull/48
  migrations: https://github.com/hms-society/hms/pull/51
  api: https://github.com/hms-society/hms/pull/52
  shared: https://github.com/hms-society/hms/pull/47
  listing: https://github.com/hms-society/hms/pull/49
  editor: https://github.com/hms-society/hms/pull/50
remote_ci:
  - PRs #47, #49, #50 e #52 estão mergeable; o único check Supabase foi skipped
    por ausência de mudanças em `supabase`.
  - PR #48 executou check-size com sucesso, mas Server/Web type checks falharam
    porque esta fatia de contratos altera interfaces consumidas pelo código
    legado de `develop`; as fatias API e editor seguintes fornecem a substituição
    compatível. Isso é uma limitação da validação isolada da cadeia empilhada,
    não uma falha do Quality Gate integrado, que passou localmente no HEAD final.
  - PR #51 ficou sem diff após a atualização contra `develop` remoto, pois as
    migrations 0011/0012 já estão presentes nessa base; o GitHub o registrou como
    merged/no-op e a migration 0013 permanece no PR #52.
next_action: resolver a validação isolada do PR #48 ou concluir a cadeia empilhada
  na ordem registrada antes de considerar o fechamento operacional definitivo.
