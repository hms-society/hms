---
title: Produção e revisão documental no contexto da consulta
status: completed
revision: 24
sources:
  - type: jira-ticket
    ref: https://plataformahms.atlassian.net/browse/SCRUM-138
    role: delivery_scope
  - type: prd
    ref: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
    role: product_requirements
  - type: design
    ref: design/hms.pen#F9JxU
    role: visual_reference
  - type: design
    ref: design/hms.pen#hq7Ty
    role: visual_reference
  - type: design
    ref: design/hms.pen#Y5vBQ
    role: visual_reference
  - type: design
    ref: design/hms.pen#Q5lD9
    role: visual_reference
  - type: design
    ref: design/hms.pen#CcIqS
    role: visual_reference
  - type: design
    ref: design/hms.pen#AjCXk
    role: visual_reference
  - type: direct-request
    ref: codex-task
    role: delivery_scope
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
jira_tickets:
  - SCRUM-138
scope:
  - packages/core/src/consultation/domain/structures
  - packages/core/src/consultation/interfaces
  - apps/web/src/constants/routes.ts
  - apps/web/src/rest/services
  - apps/web/src/routes/consultas
  - apps/web/src/routeTree.gen.ts
  - apps/web/src/ui/shared/contexts/rest-context
  - apps/web/src/ui/document-production
  - apps/web/src/ui/shadcn/dialog.tsx
  - apps/web/src/ui/shadcn/alert-dialog.tsx
  - apps/web/tests/routes/document-production
  - packages/core/src/consultation/use-cases
  - apps/server/src/consultation/rest/controllers
last_updated_at: 2026-08-14
---

# Contexto

O ticket `SCRUM-138` solicita a primeira integração web da produção documental no
contexto de uma consulta. O advogado associado e o administrador devem visualizar os documentos já
vinculados, solicitar gerações elegíveis, abrir o histórico, revisar uma versão,
salvar uma edição manual como nova versão, aprovar ou rejeitar a versão e escolher
explicitamente uma versão aprovada como vigente.

Esta é uma Spec em modo completo. Embora a implementação pretendida seja
predominantemente web, ela cria duas rotas protegidas, um adapter REST com nove
operações, múltiplos estados assíncronos, edição rica, decisões humanas finais e
integração com contratos de Consulta e Produção Documental. O risco de representar
estados que o servidor não expõe também exige limites explícitos.

A fonte de produto é a versão 9 do **PRD — Módulo de Produção Documental**, em
especial as decisões prevalentes das seções 12.1–12.8. O Jira e o PRD pedem ainda
seleção persistente de modelos, cancelamento de gerações, detalhes de falha e
remoção de pendências. A seleção persistente e o cancelamento agora são conectados
por contratos próprios; detalhes de execução e remoção de pendências continuam
diferidos, sem simulação local enganosa. A regeneração agora aceita instruções
explícitas e as conduz pelo contrato REST até o job de geração.

Há uma exceção técnica estreita ao item do Jira que exclui alterações em Core. As
Rules exigem que todo serviço REST voltado ao client implemente uma interface do
Core, e a resposta resumida da listagem agora possui projeção compartilhada para
o status da geração ativa.
Esta Spec adiciona o contrato de transporte e suas estruturas sob Consulta;
adiciona contratos, use cases, controllers e persistência da seleção; não altera
jobs, IA ou o fluxo de geração existente.

# Escopo

## Incluído

- criar as rotas protegidas de documentos da consulta e revisão de uma versão;
- listar documentos vinculados e todo o histórico resumido retornado pelo servidor;
- representar **Não gerado**, **Em revisão**, **Rejeitado**, **Aprovado** e
  **Aprovado vigente** a partir de dados persistidos;
- solicitar geração individual pela ação de cada documento; o CTA global de
  geração em lote não é exibido nesta página, embora o endpoint batch permaneça
  disponível para fluxos futuros;
- representar **Gerando** a partir de uma geração persistida em `pending`/`running`
  e também de forma otimista durante a sessão que iniciou a solicitação;
- carregar conteúdo completo de uma versão, pendências e motivo de rejeição;
- localizar no editor marcadores conhecidos que ainda existam no conteúdo;
- editar qualquer versão visualizável e salvar uma nova versão manual imutável;
- aprovar ou rejeitar uma versão em revisão, exigindo motivo na rejeição;
- tornar vigente somente uma versão aprovada ainda não vigente;
- solicitar uma nova geração individual com instruções obrigatórias no dialog de
  nova versão, preservando o texto no evento assíncrono até os agentes de geração;
- cancelar a última geração `pending`/`running` do documento por ação explícita,
  persistindo o estado `cancelled` e liberando nova geração após a confirmação
  autoritativa da listagem;
- abrir o modal de seleção, filtrar modelos por texto/área/tema e persistir a seleção;
- manter no modal os documentos já versionados bloqueados e rejeitar no backend
  qualquer tentativa de removê-los; documentos associados ao pacote que ainda não
  possuem versão podem ser removidos;
- preservar e reutilizar o editor Tiptap já instalado, promovendo-o a componente
  compartilhado da feature Produção Documental;
- tratar carregamento, vazio, erro, retry, pendência de mutation, conflito, acesso
  negado e não encontrado;
- cobrir adapter, hooks, composição real dos widgets e rotas com transporte mockado;
- validar o fluxo autenticado e server-backed disponível no ambiente local.

## Fora de escopo desta entrega

- reconstruir após reload o estado **Falha na geração** ou exibir código, execução e
  achados de uma geração;
- persistir a remoção de uma ou de todas as pendências;
- exibir detalhes de execução, remover pendências persistidas e editar instruções
  de uma geração já iniciada;
- baixar DOCX, inserir quebra de página ou garantir paginação idêntica ao Word;
- cadastrar, editar, duplicar, remover ou controlar disponibilidade de modelos;
- alterar classificação, estado ou avanço da Consulta;
- confirmar pacote ou bloquear o fluxo da Consulta pela ausência/estado de documentos;
- assinatura, envio, Formalização, Produção jurídica ou reutilização posterior;
- alteração do fluxo de geração, jobs, IA ou storage fora da associação do pacote;

Os itens acima não são removidos do PRD nem considerados satisfeitos por controles
visuais. Precisam de contratos de backend próprios antes da integração web.

# Alinhamento de produto

Esta entrega implementa parcialmente as seções 12.2, 12.3, 12.4, 12.5, 12.6,
12.7 e 12.8 do PRD:

- entrega geração individual/em lote já suportada, versões imutáveis, edição manual,
  revisão final, vigência explícita, histórico e autorização pelo contexto;
- entrega localização de pendências, mas não sua remoção persistente;
- entrega estado otimista e acompanhamento persistido de geração, além do
  cancelamento explícito de uma geração ativa;
- entrega a seleção definida em 12.1 com leitura dos modelos aplicáveis ao contexto
  jurídico e substituição persistente das associações do pacote;
- entrega instruções na regeneração: o endpoint individual aceita body opcional
  `{ instructions }`; a geração inicial pode omitir o body, mas a UI exige texto;
- não entrega download porque nenhum endpoint de arquivo autorizado integra o ticket.

O agrupamento continua opcional e sem confirmação. A interface não bloqueia a
Consulta, não cria um estado de pacote e não interpreta obrigatoriedade como gate.

# Contract

## Requisitos funcionais

### RF-001 — Proteger e endereçar as rotas

A área usa `/consultas/$consultationId/documentos`; a revisão usa
`/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId`.
Os parâmetros possuem nomes semânticos e são validados pelo contrato tipado do
TanStack Router. Ambas permanecem sob o `AppLayout` já montado em
`apps/web/src/routes/consultas/route.tsx`, usam `requireAuthMiddleware` e têm
`ssr: false` herdado do parent. A autenticação impede render sem sessão; a
autorização documental continua exclusivamente no servidor.

`ROUTES` recebe os dois patterns canônicos e builders tipados para locais que não
podem usar `Link` com `params`. A revisão não usa interpolação ad hoc. O index
`/consultas` não inventa uma consulta selecionada e permanece fora desta entrega.

### RF-002 — Implementar um adapter REST tipado

`ConsultationDocumentProductionService(restClient)` implementa a interface
homônima do Core e expõe dez operações, incluindo:

```ts
interface ConsultationDocumentProductionService {
  listDocuments(
    consultationId: string,
  ): Promise<RestResponse<readonly ConsultationDocumentListItem[]>>
  getDocumentSelection(
    consultationId: string,
  ): Promise<RestResponse<ConsultationDocumentSelection>>
  replaceDocumentSelection(
    consultationId: string,
    documentSpecificationIds: readonly string[],
  ): Promise<RestResponse<ConsultationDocumentSelection>>
  generateDocument(
    consultationId: string,
    documentId: string,
  ): Promise<RestResponse<ConsultationDocumentGeneration>>
  generateDocuments(
    consultationId: string,
  ): Promise<RestResponse<readonly ConsultationDocumentGeneration[]>>
  getDocumentVersion(
    consultationId: string,
    documentId: string,
    documentVersionId: string,
  ): Promise<RestResponse<DocumentVersion>>
  saveManualVersion(
    consultationId: string,
    documentId: string,
    sourceDocumentVersionId: string,
    content: DocumentTemplateContent,
  ): Promise<RestResponse<DocumentVersion>>
  reviewVersion(
    consultationId: string,
    documentId: string,
    documentVersionId: string,
    request: ConsultationDocumentVersionReviewRequest,
  ): Promise<RestResponse<DocumentVersion>>
  selectCurrentVersion(
    consultationId: string,
    documentId: string,
    documentVersionId: string,
  ): Promise<RestResponse<Document>>
  cancelDocumentGeneration(
    consultationId: string,
    documentId: string,
  ): Promise<RestResponse<void>>
}
```

O adapter apenas mapeia método, path e body. `RestContextProvider` constrói a
factory com o mesmo `RestClient` autenticado e expõe seu `ReturnType`; nenhum
widget acessa Axios, Supabase ou token diretamente. Valores controlados pelo
servidor — colaborador, autorização e timestamps — não aparecem em bodies.

Os contratos de transporte são exatos e usam datas ISO serializadas, não `Date`
do processo server:

```ts
type ConsultationDocumentVersionSummary = {
  readonly id: string
  readonly versionNumber: number
  readonly source: DocumentVersionSource
  readonly status: DocumentVersionStatus
  readonly pendingMarkersCount: number
  readonly createdByCollaboratorId: string
  readonly createdAt: string
  readonly reviewedByCollaboratorId?: string
  readonly reviewedAt?: string
  readonly rejectionReason?: string
}

type ConsultationDocumentListItem = {
  readonly id: string
  readonly title: string
  readonly currentVersionId?: string
  readonly versions: readonly ConsultationDocumentVersionSummary[]
}

type ConsultationDocumentVersionReviewRequest =
  | {
      readonly decision: typeof DocumentVersionStatus.Approved
      readonly rejectionReason?: never
    }
  | {
      readonly decision: typeof DocumentVersionStatus.Rejected
      readonly rejectionReason: string
    }
```

Cada tipo exportado vive em arquivo próprio e os barrels são atualizados. No
adapter, o tipo privado `ConsultationDocumentVersionResponse` representa o mesmo
shape de `DocumentVersion`, substituindo `createdAt` e `reviewedAt` por strings ISO.
A função privada `mapConsultationDocumentVersionResponse(response)` converte esses
dois campos explicitamente com `new Date(...)` apenas no body de sucesso antes de
devolver `DocumentVersion`, preservando status, headers e payload de erro do
`RestResponse`; a listagem resumida mantém strings ISO. Nenhum widget depende de
parsing implícito do Axios e nenhum response schema inexistente é pressuposto.

### RF-003 — Listar documentos e derivar o estado observável

`useConsultationDocumentsQuery(consultationId)` usa a key
`['consultation-documents', consultationId]`, chama `listDocuments` e não executa
sem ID. O page hook ordena versões por `versionNumber` decrescente sem mutar a
resposta e deriva para cada documento:

- geração mais recente `pending` ou `running`: **Gerando**, sem ação de nova
  geração;
- sem versão: **Não gerado**, ação **Gerar documento**;
- versão mais recente `in_review`: **Em revisão**, ação **Revisar**;
- versão mais recente `rejected`: **Rejeitado**, ações **Ver motivo** e
  **Visualizar**;
- versão mais recente `approved`: **Aprovado**, ação **Visualizar**;
- o chip **Vigente** aparece na revisão/histórico quando
  `version.id === currentVersionId`, podendo ser omitido da lista resumida conforme
  o PRD.

A lista de documentos exibe somente título, status e ação disponível. Não mostra
versão, quantidade de versões, resumo de histórico nem o controle **Ver histórico**;
versões mais antigas permanecem acessíveis na página de revisão. A lista não chama
uma versão aprovada de vigente sem comparar IDs. Falta de documentos é um estado
vazio válido e não bloqueante. Os chips de status da lista reutilizam o mesmo
componente visual do histórico de versões, incluindo ícone, cor, borda e tipografia;
`Vigente` é representado pelo mesmo componente como estado independente.

O modal de seleção segue o node `design/hms.pen#AjCXk`: pesquisa e filtros usam
labels explícitos, ícones e uma lista linear de modelos. Um modelo associado ao
pacote cujo documento possui ao menos uma versão aparece desabilitado, com o
marcador **Já adicionado**, e não pode ser desmarcado pelo usuário. Um modelo
associado sem versões permanece editável e pode ser removido. O contador e a ação
do rodapé consideram adições novas e também permitem salvar uma remoção sem adição;
o request envia a seleção final completa. O backend consulta as versões persistidas
e rejeita com `400` somente a remoção de uma associação versionada, sem alterar o
pacote.

### RF-004 — Solicitar geração com acompanhamento autoritativo

O CTA global **Gerar documentos** não é exibido no cabeçalho desta página. A
geração individual **Gerar documento** chama a operação do item. O servidor é a
autoridade sobre elegibilidade; mutation pendente desabilita apenas a ação
correspondente e impede submissão duplicada. O endpoint batch permanece fora da
composição visual desta página e não é chamado pela UI.

A geração individual inicial aceita um POST sem body ou com `{}`; o servidor não
pode rejeitar a solicitação por ausência de instruções opcionais. Somente quando
`instructions` for enviado ele deve ser validado como texto não vazio, limitado a
4.000 caracteres e encaminhado no evento `document-production/document.generation-requested`.

Antes de cada POST, o hook captura por `documentId` o maior `versionNumber`
observado, usando `0` quando ainda não existe versão. Após `202`, os IDs retornados,
o baseline e um `attemptId` monotônico entram no estado otimista do page hook, e os
itens são comunicados como **Gerando** enquanto o componente estiver montado. A
query é invalidada e refaz a listagem em intervalos limitados enquanto houver
requests otimistas. O estado só é removido quando a resposta autoritativa contém
para aquele documento `versionNumber > baselineVersionNumber`; uma versão antiga
já existente nunca conclui a regeneração. Um `409` significa geração ativa: usa
`HTTP_STATUS_CODE.conflict`, limpa o estado otimista da tentativa e refaz a listagem
autoritativa. Se a geração persistida ainda estiver `pending` ou `running`, o
documento continua em **Gerando** e sem ação de novo POST.

O polling usa intervalo de 3 segundos e encerra após 2 minutos. Cada callback
compara `attemptId`, `consultationId` e `documentId` antes de escrever estado;
unmount, mudança de rota ou tentativa nova invalida a anterior. O timeout não é
rotulado como falha da geração; apresenta “Ainda não foi possível confirmar o
resultado” com **Atualizar**. Reload restaura somente o estado persistido
`pending/running`; não inventa uma falha. Erros imediatos de request apresentam retry. O node
`veSuo` orienta a linguagem visual, mas código de execução e **Falha na geração**
só podem ser exibidos quando um contrato futuro fornecer esses dados.

Enquanto o item estiver **Gerando**, a UI oferece **Cancelar geração**. A ação não
envia o ID da geração: chama `POST /consultations/:consultationId/documents/:documentId/generations/cancel`,
e o servidor resolve a última geração do documento, valida que ela está
`pending`/`running`, persiste `cancelled` com timestamp e publica
`DocumentGenerationCancelledEvent`. O job Inngest observa esse evento para
interromper a execução correspondente. Em sucesso, a listagem é invalidada; como
`cancelled` não é estado ativo, a linha deixa **Gerando** e volta a oferecer
**Gerar documento**. Erro `404`/`409` preserva o estado autoritativo e apresenta
feedback recuperável; a mutation não pode produzir falso sucesso.

### RF-005 — Abrir revisão e histórico sem perder o contexto

A ação **Visualizar/Revisar** navega com `consultationId`, `documentId` e
`documentVersionId` explícitos. A review page carrega em paralelo a versão completa
e a listagem do documento para descobrir título, histórico e vigência. Um ID que
não pertença ao documento/consulta resulta em estado 404 orientado ao retorno para
a área documental.

O cabeçalho apresenta o retorno explícito para **Documentos**, título da página,
número da versão, origem, data e hora de criação, sem duplicar o chip de status que
já pertence à decisão da versão, e **Vigente** quando aplicável. A composição segue
o frame `design/hms.pen#Y5vBQ`: a decisão da versão fica em um card próprio,
separado da área **Documento em revisão**, que contém o editor em uma superfície
central com fundo de trabalho, borda e margens semelhantes a uma página A4.
**Ver versões** abre um dialog com todas as versões ordenadas, autoria, data, status,
  motivo de rejeição quando aplicável e ação **Visualizar**. O dialog segue o node
`design/hms.pen#Q5lD9`: cabeçalho contextual, divisor, linhas lineares separadas,
chips semânticos de status e ações de visualização alinhadas à direita; em viewport
estreito, cada linha refluí sem overflow horizontal. Selecionar outra versão
navega pela rota tipada sem descartar silenciosamente edição suja.

O dialog **Gerar nova versão** segue o node `design/hms.pen#CcIqS` em sua
hierarquia visual: superfície de 480 px, cabeçalho com divisor, corpo contextual
e rodapé separado com ações pill. Como o contrato atual de geração não aceita
instruções no body, a UI não exibe um campo editável que não seria persistido; a
solicitação continua explícita e preserva a versão atual no histórico.

A **Barra de decisão** deriva sua aparência e ações do estado autoritativo da
versão/geração. `pending`/`running` exibem **Gerando** e **Cancelar geração**;
`failed` exibe **Falha na geração** e **Tentar novamente**; uma versão **Em revisão**
exibe decisão de aprovação/rejeição; uma versão **Rejeitada** exibe seu motivo por
meio da ação clicável **Ver motivo**;
uma versão **Aprovada** permite torná-la vigente; uma versão vigente exibe o chip
**Vigente**; e a edição manual exibe **Salvar edição manual** e **Cancelar edição**.
Os botões de ação da barra usam o radius pill (`rounded-full`) previsto para
botões pelo design system, sem alterar o radius estrutural do card. Os textos e
ícones seguem os nodes `zBZ6j`, `JH360`, `Op56U`, `sJhUE`, `uupRa`,
`ca1dH` e `WpfrA`. A UI não oferece detalhes de erro quando o contrato não os
retorna.

### RF-006 — Exibir e editar conteúdo como página

O `DocumentEditor` existente é movido de dentro da página administrativa para
`widgets/components/document-editor/`, mantendo o contrato do template e ganhando
props explícitas para nome acessível, modo editável, estado vazio e termos
destacados. O admin continua consumindo o mesmo componente após atualização dos
imports; não há alias no caminho antigo.

A review page renderiza o `DocumentTemplateContent` em uma superfície central ampla,
ocupando mais espaço horizontal disponível no editor e mantendo proporção e margens
semelhantes a A4, sem afirmar equivalência de paginação com DOCX/Word. A folha usa
largura fluida limitada a `max-w-5xl` em telas grandes e não cria overflow em telas
estreitas. O editor usa os schemas de `@hms/validation`, as extensões Tiptap já
instaladas e tokens semânticos. Não adiciona dependência.

Todo conteúdo visualizável pode entrar em edição manual. O rascunho pertence ao
review page hook. **Cancelar edição** restaura o JSON carregado após confirmação
quando houver mudanças. **Salvar edição manual** abre confirmação e envia o JSON
validado para o endpoint manual; sucesso cria nova versão `in_review`, invalida
listagem/versão e navega com `replace` para o ID criado. A origem e a versão vigente
anterior permanecem inalteradas. Falha preserva o rascunho.

### RF-007 — Localizar e remover pendências de forma persistente

`pendingMarkers` da versão completa gera a lista do dialog `Fneph`. **Localizar**
procura o texto exato no documento, seleciona/focaliza o primeiro match e usa
realce textual além de cor. Se não encontrar, o dialog `fKgUJ` explica que o trecho
pode ter sido editado e oferece apenas **Manter pendência** nesta entrega. **Remover
pendência** e **Remover todas** removem os marcadores do conteúdo e reutilizam o
endpoint de versão manual para persistir uma nova versão `manual` em revisão. O
servidor recalcula `pendingMarkers`, exporta o arquivo correspondente e a UI navega
para a versão criada somente após a persistência ter sucesso. Falha de persistência
mantém a versão atual e comunica o erro sem esconder a pendência.

### RF-008 — Revisar uma versão de forma final

Somente versão `in_review` apresenta **Aprovar versão** e **Rejeitar versão**.
Aprovar abre confirmação e envia `{ decision: 'approved' }`. Rejeitar usa `RGqCe`,
com cabeçalho e rodapé delimitados, descrição contextual, label obrigatório, área
de texto ampla e ações alinhadas à direita. O dialog exige motivo com `trim` e ao menos 1 caractere conforme o
`reviewDocumentVersionSchema` canônico, envia
`{ decision: 'rejected', rejectionReason }` e explica que a decisão afeta somente
a versão, que permanece no histórico.

Sucesso substitui os dados visíveis e invalida queries relacionadas. Um `409`
indica decisão concorrente/final já aplicada: a UI fecha o estado pendente, refaz
a versão e explica o resultado atual. Rejeitada não oferece aprovação; aprovada não
oferece rejeição. Não existe rejeição do documento.

### RF-009 — Tornar vigente somente uma versão aprovada

Uma versão `approved` cujo ID difere de `currentVersionId` mostra **Tornar vigente**.
A ação exige confirmação e chama o endpoint `current`. Sucesso atualiza a listagem
e o chip **Vigente** sem alterar aprovação das demais versões. A ação não aparece
para `in_review`, `rejected` nem para a própria vigente. `409` refaz dados e comunica
conflito sem presumir sucesso.

### RF-010 — Solicitar uma nova versão com instruções

Versões `in_review`, `approved` ou `rejected` podem oferecer **Gerar nova versão**,
que abre o dialog `CcIqS`. O dialog exibe o campo obrigatório **Instruções para a
nova versão**, bloqueia a confirmação quando o valor está vazio após `trim`, limita
o texto a 4.000 caracteres e envia `{ instructions }` para o endpoint individual.
O servidor valida o contrato e inclui as instruções no evento
`document-production/document.generation-requested`; o job as encaminha ao fluxo
e aos prompts de escrita/revisão. A geração nunca apaga conteúdo, aprovação ou
vigência anteriores.

### RF-011 — Tratar falhas HTTP e corridas assíncronas

- `401` continua sob o handler global do transporte, que encerra a sessão e navega
  para login;
- `403` mostra acesso negado sem revelar título, conteúdo ou histórico;
- `404` diferencia consulta/documento/versão indisponível apenas na orientação
  necessária, sem inferir existência além do servidor;
- `409` refaz a query autoritativa e apresenta conflito recuperável;
- outros erros apresentam mensagem estável, retry e nunca deixam promise rejeitada
  sem tratamento.

Cada mutation usa sua própria chave/estado e ignora callbacks de uma tentativa
obsoleta depois de mudança de rota ou parâmetros. Cancelamento do componente impede
que resposta antiga sobrescreva consulta/documento/versão mais recente. Query keys
incluem todos os IDs. Nenhum conteúdo jurídico é persistido em localStorage, URL,
log ou mensagem de erro.

### RF-012 — Reproduzir a experiência acessível e responsiva

As páginas reutilizam `AppLayout`, tokens HMS e os wrappers `Icon`, `Anchor` e
shadcn existentes. Fraunces permanece nos headings e Plus Jakarta Sans nos controles
e texto. Status usa texto e ícone além de cor. Todos os botões/dialogs/editor têm
nome acessível, foco visível, ordem de tab coerente e retorno de foco ao trigger.

No desktop de referência (1200 × 980/1050), a composição segue os nodes mapeados.
Em viewport estreito, ações quebram em linhas, listas viram blocos legíveis e a
folha usa largura disponível; não há scroll horizontal na página. Zoom/reflow,
tema escuro e movimento reduzido usam os tokens/comportamentos existentes. O design
não autoriza hardcode de cor, radius, shadow, font ou largura fora de uma dimensão
intrínseca documentada da folha.

Dialogs e alert dialogs usam a escala tipográfica compartilhada: título em
`text-2xl` (ou maior que o mínimo `text-lg`), corpo e descrição em `text-base`, e textos auxiliares antes definidos
como `text-xs` ou `text-sm` sobem um nível semântico dentro da superfície. Nenhum
texto informativo dos dialogs da feature deve permanecer abaixo de `text-sm`.

## Critérios de aceitação

- **CA-01 — RF-001, RF-003**
  - **Given:** advogado autenticado e associado a uma consulta existente.
  - **When:** abre a rota de documentos pelo ID da consulta.
  - **Then:** vê somente os documentos e históricos retornados pelo servidor, com
    estado derivado corretamente e sem gate para a Consulta.
  - **Expected evidence:** teste de widget com composição real; integração browser
    com transporte mockado; fluxo autenticado server-backed.

- **CA-02 — RF-001, RF-011**
  - **Given:** sessão ausente, colaborador não associado ou recurso inexistente.
  - **When:** abre uma das rotas ou executa uma operação.
  - **Then:** recebe redirect ou estado `403/404` orientado à recuperação, sem
    conteúdo protegido; `401/403/404/409` são cobertos no adapter/rota.
  - **Expected evidence:** adapter test; browser integration; inspeção de rede e
    console no fluxo real.

- **CA-03 — RF-002**
  - **Given:** os nove endpoints de documentos da consulta.
  - **When:** cada método do adapter é chamado.
  - **Then:** método, path, parâmetros e body correspondem exatamente ao controller,
    sem identidade do colaborador no client.
  - **Expected evidence:** `consultation-document-production-service.test.ts`.

- **CA-04 — RF-004**
  - **Given:** documentos sem versões e nenhum request local pendente.
  - **When:** o advogado gera um item ou todos os elegíveis.
  - **Then:** há um único POST, a ação pendente desabilita, `202` produz estado
    otimista **Gerando**, nova versão encerra esse estado e `409` inicia recuperação
    sem duplicar geração.
  - **Expected evidence:** hook/widget tests; browser request/response/outcome.

- **CA-13 — RF-004, RF-011**
  - **Given:** uma geração `pending` ou `running` aparece como **Gerando**.
  - **When:** o colaborador autorizado aciona **Cancelar geração**.
  - **Then:** existe um único POST de cancelamento, o backend persiste `cancelled`,
    publica o evento de cancelamento do job, a listagem converge e a linha volta a
    exibir **Gerar documento**; acesso não autorizado retorna erro orientado.
  - **Expected evidence:** testes Core/controller/adapter/action/widget e browser
    autenticado com request, response, snapshot, console e network.

- **CA-05 — RF-003, RF-005**
  - **Given:** documento com múltiplas versões em revisão, rejeitadas e aprovadas.
  - **When:** o advogado abre histórico e seleciona uma versão.
  - **Then:** todas permanecem visíveis e a rota carrega exatamente a versão pedida;
    o motivo rejeitado e o chip vigente aparecem quando aplicáveis. A review page
    mantém a hierarquia visual do node `Y5vBQ`, com navegação, decisão e editor em
    áreas separadas, sem remover as ações suportadas. O histórico usa o node `Q5lD9`
    como referência: cabeçalho contextual, lista linear com divisores, status e
    vigência identificáveis, data/hora e um botão **Visualizar** por versão.
  - **Expected evidence:** widget tests; browser integration da rota dinâmica.

- **CA-14 — RF-003**
  - **Given:** um documento possui uma ou mais versões.
  - **When:** o usuário visualiza a lista de documentos da consulta.
  - **Then:** a linha mostra título, status e ação, sem versão, contador de versões
    ou controle de histórico; os detalhes continuam disponíveis na revisão.
  - **Expected evidence:** teste de composição da lista e snapshot browser.

- **CA-15 — RF-012**
  - **Given:** qualquer Dialog ou AlertDialog aberto, incluindo seleção de documentos,
    histórico de versões e pendências do documento.
  - **When:** o usuário lê títulos, descrições, campos, itens e ações.
  - **Then:** títulos usam no mínimo `text-lg` — as primitivas atuais usam `text-2xl` —, corpo/descrições usam `text-base` e textos
    auxiliares usam no mínimo `text-sm`, preservando largura, reflow e foco.
  - **Expected evidence:** check de código e screenshots browser dos três dialogs.

- **CA-06 — RF-006**
  - **Given:** qualquer versão visualizável.
  - **When:** o advogado edita e confirma **Salvar edição manual**.
  - **Then:** o POST contém apenas `content`, a origem não muda, a resposta criada
    abre como nova versão **Em revisão**, e falha preserva o rascunho.
  - **Expected evidence:** component/hook tests; browser payload e resultado visível.

- **CA-07 — RF-007**
  - **Given:** versão com marcadores conhecidos presentes ou ausentes no conteúdo.
  - **When:** o advogado usa **Localizar**.
  - **Then:** o match presente recebe foco/realce; a ausência abre orientação sem
    remover estado apenas no client.
  - **Expected evidence:** DocumentEditor test; review page test; keyboard path.

- **CA-08 — RF-008**
  - **Given:** versão `in_review`.
  - **When:** o advogado aprova ou rejeita com motivo válido.
  - **Then:** somente a decisão escolhida é enviada, o estado visível é atualizado,
    rejeição vazia é bloqueada e a decisão final remove ações incompatíveis.
  - **Expected evidence:** schema/UI validation; hook/widget tests; browser mutation.

- **CA-16 — RF-008**
  - **Given:** versão `in_review` e dialog de rejeição aberto.
  - **When:** o usuário informa ou remove o motivo.
  - **Then:** o modal mantém a hierarquia visual do node `RGqCe`, com descrição,
    label obrigatório, textarea expandida, rodapé separado e **Rejeitar versão**
    desabilitado enquanto o motivo estiver vazio; a regra atual de validação não
    é ampliada apenas por aparência.
  - **Expected evidence:** teste de composição do review page; screenshot Pencil/browser;
    caminho de teclado no dialog.

- **CA-17 — RF-005**
  - **Given:** uma versão carregada com estado de geração ou status persistido
    `in_review`, `rejected` ou `approved`.
  - **When:** o usuário visualiza a barra de decisão, cancela uma geração, tenta
    novamente uma falha, edita ou decide a versão.
  - **Then:** a barra usa a composição correspondente aos nodes `zBZ6j`, `JH360`,
    `Op56U`, `sJhUE`, `uupRa`, `ca1dH` e `WpfrA`; ações indisponíveis não aparecem;
    cancelamento e retry usam os endpoints já existentes; nenhum detalhe de erro é
    inventado.
  - **Expected evidence:** matriz de testes do widget/page, action existente,
    browser snapshot e screenshots desktop/mobile.

- **CA-18 — RF-005**
  - **Given:** uma versão rejeitada possui `rejectionReason` persistido.
  - **When:** o usuário aciona **Ver motivo** na barra de decisão.
  - **Then:** a interface abre um dialog intitulado **Motivo da rejeição**, exibe o
    texto persistido sem truncamento em um `textarea` somente leitura e oferece fechamento pelo botão
    **Fechar** e pelo controle de fechamento do dialog; nenhuma mutation é enviada.
  - **Expected evidence:** teste de composição com abertura e fechamento do dialog,
    inspeção Pencil do padrão de dialog e validação de foco/teclado.

- **CA-09 — RF-009**
  - **Given:** versão aprovada ainda não vigente.
  - **When:** o advogado confirma **Tornar vigente**.
  - **Then:** somente seu ID se torna vigente; a ação não existe para estados
    incompatíveis ou para a vigente atual.
  - **Expected evidence:** matriz de widget; browser PATCH e estado atualizado.

- **CA-10 — RF-010**
  - **Given:** versão visualizável e nenhuma geração ativa conhecida pelo client.
  - **When:** confirma **Gerar nova versão**.
  - **Then:** usa o POST individual sem instrução descartada e preserva todas as
    versões anteriores.
  - **Expected evidence:** hook/widget test e browser request/outcome.

- **CA-11 — RF-011**
  - **Given:** duas decisões concorrentes ou navegação durante mutation.
  - **When:** uma resposta antiga ou `409` chega.
  - **Then:** dados autoritativos são recarregados e a tela atual não é sobrescrita
    por IDs anteriores.
  - **Expected evidence:** hook tests com promises controladas; browser conflict flow.

- **CA-12 — RF-012**
  - **Given:** desktop de design e viewport estreito com teclado, tema escuro e zoom.
  - **When:** percorre lista, dialogs, histórico e editor.
  - **Then:** foco/nome/estado são perceptíveis, dialogs devolvem foco e não há
    overflow horizontal nem informação dependente somente de cor.
  - **Expected evidence:** Testing Library acessível; Playwright desktop/narrow;
    screenshots, accessibility snapshot, console e inspeção de layout.

# Estado atual

- `apps/web/src/routes/consultas/route.tsx` já protege o segmento, monta
  `AppLayout` e desabilita SSR.
- `apps/web/src/routes/consultas/index.tsx` aponta para
  `ui/identity/widgets/pages/lawyer-page/consultation.tsx`, cujo componente não
  retorna JSX e contém apenas o placeholder `oi`.
- `ROUTES` não possui rota dinâmica de consulta/documentos/revisão.
- `RestContext` possui `documentProductionService` administrativo, mas nenhum
  adapter para os endpoints de Consulta.
- `packages/core/src/consultation` já expõe os use cases e estruturas de geração;
  `packages/core/src/document-production` expõe `Document`, `DocumentVersion`,
  `DocumentTemplateContent`, status e source.
- O servidor já implementa e testa os sete endpoints originais listados no Jira;
  esta revisão adiciona os dois endpoints de seleção e o cancelamento contextual.
  A listagem retorna documento, resumo das versões e status da última geração.
- Não existe controller de detalhe da consulta, adição/remoção de documento,
  geração list/get, instruções de regeneração ou remoção de pendência.
- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/
  document-editor` já integra Tiptap 3 e o schema JSON compartilhado; sua localização
  atual é interna à página administrativa e impede consumo correto por outra página.
- `apps/web/package.json` já possui React 19, TanStack Query 5, Tiptap 3, Zod 4,
  Tailwind 4, shadcn e Testing Library; nenhuma dependência é necessária.

# Solução técnica

## Responsabilidades por camada

- **Core/Consulta:** define o contrato REST consumível, as projeções resumidas, a
  seleção e suas regras de aplicabilidade. Reutiliza entidades/estruturas de
  Produção Documental.
- **REST web:** mapeia as dez operações e é composto no `RestContext`.
- **TanStack Query:** possui queries por IDs e mutations com invalidação seletiva;
  dados persistidos pertencem ao cache, rascunho/editor e geração otimista pertencem
  aos page hooks.
- **Rotas:** validam/comunicam parâmetros, aplicam a proteção herdada e compõem pages.
- **Widgets:** renderizam lista, dialogs, histórico/editor e estados acessíveis.
  Decisões sobre disponibilidade das ações são derivadas por status no hook.
- **Servidor:** permanece autoridade de acesso, elegibilidade, imutabilidade,
  transição de revisão e vigência. Nesta revisão, administradores têm acesso total
  às consultas e operações de documentos; os demais colaboradores jurídicos seguem
  restritos às consultas atribuídas.

## Fluxos de runtime

1. A rota documental recebe `consultationId`, lista documentos e deriva a matriz.
2. Geração retorna `202`; o hook guarda IDs, baseline e `attemptId` otimistas e
   refaz a listagem até surgir versão com `versionNumber` estritamente maior que o
   baseline daquele documento ou o limite ser atingido.
3. A rota de revisão recebe os três IDs, carrega versão + listagem e determina
   título, histórico e vigência.
4. Aprovação/rejeição/vigência invalidam versão e lista; `409` sempre refaz dados.
5. Edição manual mantém clone JSON local; POST bem-sucedido retorna nova versão e
   substitui a URL, sem alterar a fonte nem a vigente.

# Blueprint de implementação

## Declarações e decisões

- `ConsultationDocumentProductionService` é factory PascalCase e não classe.
- `useConsultationDocumentsQuery` e `useConsultationDocumentVersionQuery` escondem
  `data/error/isLoading` genéricos com nomes de domínio.
- Actions usam `use<Name>Action`; page/widget hooks usam function declarations.
- `ConsultationDocumentsPage`, `ConsultationDocumentReviewPage` e todo nested widget
  exportam `<WidgetName>Props` quando recebem props.
- Nenhum novo Context/store é criado. `RestContext` + Query cache + estado local dos
  dois page hooks são as únicas fontes.
- Datas recebidas são tratadas como valores de transporte e formatadas na UI; não
  entram em URL nem em persistência do browser.
- A lista usa maior `versionNumber`, não ordem de array, como versão mais recente.
- O editor compartilhado mantém JSON estrito; não converte conteúdo em HTML para
  persistência.

## Inventário de arquivos

### Files to create

- `packages/core/src/consultation/domain/structures/consultation-document-version-summary.ts`

  - Declara `ConsultationDocumentVersionSummary` com o shape real da listagem.

- `packages/core/src/consultation/domain/structures/consultation-document-list-item.ts`

  - Declara `ConsultationDocumentListItem` com documento e versões resumidas.

- `packages/core/src/consultation/domain/structures/consultation-document-version-review-request.ts`

  - Declara a união discriminada `ConsultationDocumentVersionReviewRequest` de
    RF-002; rejeição exige string não vazia e aprovação não aceita motivo.

- `packages/core/src/consultation/interfaces/consultation-document-production-service.ts`

  - Declara as dez assinaturas de RF-002 usando `RestResponse` e tipos canônicos.

- `apps/web/src/rest/services/consultation-document-production-service.ts`
- `apps/web/src/rest/services/tests/consultation-document-production-service.test.ts`

  - Implementam e verificam método/path/body/response das dez operações.

- `apps/web/src/routes/consultas/$consultationId/documentos/index.tsx`
- `apps/web/src/routes/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId.tsx`

  - Rotas finas para listagem/produção e revisão.

- `apps/web/src/ui/document-production/widgets/components/document-editor/index.tsx`
- `apps/web/src/ui/document-production/widgets/components/document-editor/use-document-editor.ts`
- `apps/web/src/ui/document-production/widgets/components/document-editor/toolbar-button/index.tsx`
- `apps/web/src/ui/document-production/widgets/components/document-editor/tests/document-editor.test.tsx`
- `apps/web/src/ui/document-production/widgets/components/document-editor/pending-marker-extension.ts`

  - Nova localização coerente do editor compartilhado e suporte a localizar/realçar
    termos conhecidos sem alterar o JSON.

- `apps/web/src/ui/document-production/hooks/consultation-document-query-keys.ts`
- `apps/web/src/ui/document-production/hooks/use-consultation-documents-query.ts`
- `apps/web/src/ui/document-production/hooks/use-consultation-document-version-query.ts`
- `apps/web/src/ui/document-production/hooks/use-generate-consultation-document-action.ts`
- `apps/web/src/ui/document-production/hooks/use-generate-consultation-documents-action.ts`
- `apps/web/src/ui/document-production/hooks/tests/consultation-document-hooks.test.tsx`

  - Centralizam keys, queries e mutations compartilhadas; o teste cobre IDs nas
    keys, invalidação, baseline por documento, `attemptId`, timeout e respostas
    obsoletas após troca de rota/unmount.

- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/use-consultation-documents-page.ts`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-documents-loading/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-documents-error-state/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-documents-empty-state/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-document-list/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/consultation-document-row/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/select-consultation-documents-dialog/index.tsx`
- `apps/web/src/ui/document-production/hooks/use-consultation-document-selection-query.ts`
- `apps/web/src/ui/document-production/hooks/use-replace-consultation-document-selection-action.ts`

  - Compõem o modal do Node `AjCXk`, filtros, seleção controlada e persistência.
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/consultation-documents-page.test.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-documents-page/tests/use-consultation-documents-page.test.ts`

  - Compõem estados de lista, matriz de status, geração individual/lote e retry.

- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-consultation-document-review-page.ts`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-review-consultation-document-version-action.ts`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-save-manual-consultation-document-version-action.ts`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/use-select-current-consultation-document-version-action.ts`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/consultation-document-review-loading/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/consultation-document-review-error-state/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-decision-bar/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/document-version-history-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/reject-document-version-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/save-manual-version-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/cancel-manual-edit-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/pending-markers-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/pending-marker-not-found-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/regenerate-document-version-dialog/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/consultation-document-review-page.test.tsx`
- `apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/use-consultation-document-review-page.test.ts`

  - Compõem editor, histórico, decisões, vigência, edição manual, pendências e
    regeneração sem instruções; os testes cobrem permissões por status e races.

- `apps/web/tests/routes/document-production/consultation-documents.index.test.tsx`
- `apps/web/tests/routes/document-production/consultation-document-version.test.tsx`

  - Integração browser consumindo a fixture canônica de Produção Documental; não
    criam helpers locais de teste nem registram um segundo backend mockado.

### Files to modify

- `packages/core/src/consultation/domain/structures/index.ts`
- `packages/core/src/consultation/interfaces/index.ts`

  - Exportam os novos contratos.

- `apps/web/src/constants/routes.ts`

  - Adiciona `ROUTES.consultationDocuments` com
    `/consultas/$consultationId/documentos`,
    `ROUTES.consultationDocumentVersion` com
    `/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId`,
    `buildConsultationDocumentsPath(consultationId: string): string` e
    `buildConsultationDocumentVersionPath(params: { consultationId: string;
    documentId: string; documentVersionId: string }): string`.

- `apps/web/src/ui/shared/contexts/rest-context/types/rest-context-value.ts`
- `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts`
- `apps/web/src/ui/shared/contexts/rest-context/tests/rest-context.test.tsx`

  - Registra a nova factory e valida a composição.

- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/tests/document-specification-page.test.tsx`
- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/tests/use-document-specification-page.test.ts`

  - Atualiza import/mocks para o editor compartilhado sem mudar o Contract admin.

- `apps/web/tests/fixtures/document-production-fixture.ts`

  - Estende `DocumentProductionState` com documentos/versões serializáveis da
    consulta e um log stateful de `{ method, path, body }`; o fixture `test` já
    exportado registra os handlers sob `/consultations/:consultationId`,
    aplica no estado as criações/revisões/vigência e continua herdando autenticação
    de `auth-fixture.ts`. Ambos os testes de rota importam `test` e
    `DOCUMENT_PRODUCTION_BACKEND` desta fixture compartilhada e `expect` de
    `@playwright/test`, como o teste de rota existente da feature.

### Files to generate

- `apps/web/src/routeTree.gen.ts`

  - Gerado por `pnpm --filter web generate-routes`; nunca editado manualmente.

### Files to remove

- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/use-document-editor.ts`
- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/toolbar-button/index.tsx`
- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/document-editor/tests/document-editor.test.tsx`

  - Removidos após a promoção integral; não ficam aliases no path antigo.

## Referências existentes

- `apps/web/src/ui/document-production/widgets/pages/document-specification-page/`
  governa composição de page/hook, TanStack Query, dialogs e editor Tiptap.
- `apps/web/src/rest/services/document-production-service.ts` governa factory,
  `RestClient` e teste de mapeamento.
- `apps/web/src/ui/shared/contexts/rest-context/` governa composição do adapter.
- `apps/web/src/routes/modelos-de-documentos/` e
  `apps/web/tests/routes/document-production/` governam rotas dinâmicas protegidas e
  browser integration com transporte mockado.
- `apps/server/rest-client/consultation/consultations.rest` governa método/path/body
  e credenciais seeded para a validação real.
- os controllers sob `apps/server/src/consultation/rest/controllers/` governam
  status HTTP e valores extraídos do contexto autenticado.

# Mapeamento Pencil

| Pencil file | Node ID | Frame/state | Feature surface | Validação exigida |
|---|---|---|---|---|
| `design/hms.pen` | `F9JxU` | configuração | lista inicial já vinculada | screenshot + layout + browser 1200×980 |
| `design/hms.pen` | `AjCXk` | seleção aditiva | modal server-backed; associações existentes bloqueadas | screenshot + layout + browser 1200×980/390×844 |
| `design/hms.pen` | `hq7Ty` | produção | lista, histórico e gerações | screenshot + layout + browser 1200×980 |
| `design/hms.pen` | `Y5vBQ` | revisão | página/editor de versão | screenshot + layout + browser 1200×1050 |
| `design/hms.pen` | `zBZ6j` | gerando | estado otimista da sessão | screenshot + widget matrix |
| `design/hms.pen` | `Op56U` | em revisão | ações finais | screenshot + widget matrix |
| `design/hms.pen` | `JH360` | falha | design-only sem generation query | screenshot + layout; não fingir falha |
| `design/hms.pen` | `sJhUE` | rejeitado | decisão final | screenshot + widget matrix |
| `design/hms.pen` | `uupRa` | aprovado | tornar vigente/regenerar | screenshot + widget matrix |
| `design/hms.pen` | `ca1dH` | aprovado vigente | vigência atual | screenshot + widget matrix |
| `design/hms.pen` | `WpfrA` | edição manual | salvar/cancelar rascunho | screenshot + editor test |
| `design/hms.pen` | `RGqCe` | rejeição | motivo obrigatório | screenshot + dialog/keyboard test |
| `design/hms.pen` | `CcIqS` | regeneração instruída | design-only; endpoint sem body | screenshot + layout; não coletar texto |
| `design/hms.pen` | `Fneph` | lista de pendências | localizar marcadores | screenshot + editor/keyboard test |
| `design/hms.pen` | `fKgUJ` | marcador ausente | orientação | screenshot + dialog test |
| `design/hms.pen` | `w6YQr` | remover uma pendência | design-only sem mutação | screenshot + layout |
| `design/hms.pen` | `ckqHj` | remover todas | design-only sem mutação | screenshot + layout |
| `design/hms.pen` | `veSuo` | erro de geração | linguagem de erro imediato/limitação | screenshot + error test |

Todos os nodes foram inspecionados pelo MCP Pencil, inclusive screenshots e
estrutura; não houve leitura do arquivo criptografado por filesystem. Os frames
desktop não definem mobile. A implementação mapeia `$primary`, `$card`, `$border`,
`$highlight`, `$accent` e demais variáveis para tokens semânticos já presentes no
CSS, sem copiar hex values do Pencil.

# Plano de validação

## Checks automatizados

Executar na ordem:

```bash
pnpm --filter web generate-routes
pnpm --filter web check:code
pnpm --filter web check:types
pnpm --filter web test
pnpm --filter web test:integration tests/routes/document-production/consultation-documents.index.test.tsx
pnpm --filter web test:integration tests/routes/document-production/consultation-document-version.test.tsx
pnpm --filter web build
```

Os testes do adapter cobrem sucesso e preservação dos `RestResponse` para erros
`401`, `403`, `404` e `409`. Os hooks usam promises controladas para provar que
respostas obsoletas não vencem parâmetros novos. Os widgets cobrem loading, vazio,
erro/retry, cada status persistido, geração otimista, mutation pendente, dialogs,
histórico, edição dirty/cancel/save, rejeição inválida/válida, aprovação, vigência e
ações ausentes.

## Browser integration com transporte mockado

- route middleware real e pages reais, sem mock do page/hook;
- handlers stateful para que PATCH/POST alterem GET subsequente;
- redirect sem sessão, `403`, `404`, `409`, loading, retry e success;
- assertions de URL final, método, path, body, status e resultado visível;
- viewport desktop dos nodes e viewport estreito de 375 × 812;
- teclado em dialogs/editor, retorno de foco, nome acessível, overflow e tema escuro;
- console sem erro/hydration warning e rede sem request inesperado.

## Fluxo autenticado e server-backed

Seguir integralmente o workflow obrigatório do `AGENTS.md`:

1. verificar `docker compose ps -a`, Auth em
   `http://localhost:8000/auth/v1/health` e server em
   `http://localhost:3333/health`;
2. iniciar `pnpm --filter server dev` e `pnpm --filter web dev` em sessões
   persistentes, esperando bootstrap/compilação;
3. confirmar `lawyer@hmsadvogados.com.br` e a senha em seed/env antes do login;
4. autenticar por `/login`, confirmar URL e conteúdo protegido;
5. abrir a consulta seeded `00000000-0000-4000-8000-000000000101`, listar,
   gerar documento elegível, aguardar Inngest quando disponível, revisar, salvar uma
   edição manual, aprovar e tornar vigente;
6. após cada navegação/mutation, obter snapshot novo; testar teclado e 375 px;
7. inspecionar console e rede, classificando todo erro/4xx/5xx/hydration/auth;
8. comparar screenshots/layout com `F9JxU`, `hq7Ty` e `Y5vBQ` nos viewports de
   design e registrar limitações dos nodes design-only;
9. encerrar apenas as sessões web/server gravadas, mantendo Docker compartilhado.

Se Inngest não estiver disponível, o fluxo real valida listagem, histórico, revisão,
edição manual, decisão e vigência com dados seeded; geração assíncrona fica registrada
como bloqueada, não como aprovada por mock.

# Evaluation

A implementação final registrará resultados, screenshots, rotas/Node IDs, comandos,
console/rede, limitações e evidências em [`evaluation.md`](./evaluation.md).

# Alinhamento de documentação

- **PRD Produção Documental v9:** confirmado como autoridade; nenhum requisito
  diferido foi removido ou enfraquecido.
- **`documentation/modules.md`:** confirmado. Consulta controla contexto/autorização;
  Produção Documental controla documentos e versões. A UI feature permanece em
  `ui/document-production` e recebe `consultationId` como contexto.
- **`documentation/architecture.md` e `documentation/infrastructure.md`:** confirmados;
  React/TanStack Query/Router/Tiptap/Zod/Tailwind/shadcn existentes são suficientes.
- **`documentation/design.md`:** confirmado para tokens, tipografia, tema e WCAG 2.2 AA.
- **Rules:** UI Layer, Web App Routing, Widget Testing, REST Wiring, Core Package e
  Code Conventions aplicam-se. Não foi encontrada uma Rules file específica para
  testes de services, apesar da menção no router; os testes seguem o padrão local.
  A integração de rota reutiliza `tests/fixtures/document-production-fixture.ts`,
  como exige a convenção Playwright observada, sem criar test helpers paralelos.
- **Jira:** permanece inalterado. A divergência entre o escopo frontend-only e os
  endpoints ausentes está documentada nesta Spec para orientar tickets de contrato.

# Premissas e questões resolvidas

1. **Qual rota identifica a consulta?** Resolvido com segmento dinâmico, pois não há
   seleção global confiável nem ID de consulta na rota atual.
2. **O admin pode acessar documentos da consulta?** Sim. Administradores têm acesso
   total a qualquer consulta e a todas as operações de documentos. Advogados,
   paralegais e supervisores continuam autorizados somente quando são o advogado
   associado à consulta. Esta regra foi alterada por solicitação direta do usuário
   nesta revisão; o PRD externo ainda precisa ser sincronizado.
3. **Aprovar torna vigente?** Não. São mutations separadas.
4. **Edição altera a versão aberta?** Não. Sempre cria uma manual `in_review`.
5. **Qual versão governa a linha?** Maior `versionNumber`; vigência é comparação de ID.
6. **Pode haver confirmação de pacote?** Não. O agrupamento é opcional e sem estado.
7. **Pode haver seleção client-only?** Não. A seleção usa GET/PUT server-backed;
   associações existentes permanecem obrigatórias e não podem ser removidas.
8. **Pode haver falha simulada?** Não. O cancelamento só é representado quando o
   endpoint persistir `cancelled`; falhas de geração continuam sem reconstrução
   após reload.
9. **Pode remover pendência só da tela?** Não. Foi diferido para evitar restauração
   silenciosa após reload.
10. **O dialog de ajuste coleta instruções?** Sim. A regeneração exige instruções
    não vazias, que são enviadas no body e encaminhadas ao job; a geração inicial
    continua podendo omitir o campo.
11. **É necessário pacote/dep novo?** Não.
12. **Core muda apesar do Jira?** Sim, quando necessário para a regra de negócio:
    o Core protege associações existentes contra remoção e o controller REST expõe
    essa decisão sem deixar a UI como única barreira.
13. **Os testes de rota criam helpers próprios?** Não. O estado e os handlers
    compartilhados ampliam `apps/web/tests/fixtures/document-production-fixture.ts`,
    seguindo a convenção Playwright já usada pela feature.

## Requisitos de produto diferidos para contratos futuros

- leitura do contexto completo da consulta para inicializar área/tema;
- listar modelos elegíveis e adicionar documentos antes da primeira versão; uma
  associação já criada no pacote não pode ser removida por esta operação;
- listar/get/cancel gerações com status, código, mensagem, achados e timestamps;
- aceitar instruções opcionais na regeneração;
- remover uma/todas as pendências persistentemente;
- download autorizado do arquivo da versão.

# Amendments

- **2026-08-13 — Revision 1:** substituiu o stub com referência incorreta a
  `SCRUM-24` pela Spec completa de `SCRUM-138`; incorporou PRD v9, código real, sete
  endpoints existentes e 18 nodes Pencil; delimitou a primeira integração web e os
  contratos de backend ausentes sem simular persistência.
- **2026-08-13 — Revision 2:** corrigiu os blockers do Judge Spec: declarou o request
  de revisão e as datas de transporte, tornou a conclusão de geração dependente de
  versão estritamente posterior ao baseline com proteção contra resposta obsoleta,
  substituiu inventários curingas por paths e símbolos exatos e alinhou a rejeição
  ao mínimo canônico de um caractere após trim.
- **2026-08-13 — Revision 3:** removeu o helper de testes de rota proposto e passou
  todo estado/roteamento mockado de consulta para a fixture Playwright existente de
  Produção Documental, conforme correção direta do usuário e convenção local.
- **2026-08-14 — Revision 9:** refinou a composição visual da página de revisão para
  seguir `design/hms.pen#Y5vBQ`, separando navegação, decisão da versão e editor em
  revisão, sem alterar contratos ou ações de negócio.
- **2026-08-14 — Revision 11:** alinhou o dialog de rejeição ao node
  `design/hms.pen#RGqCe`, preservando a validação canônica de motivo não vazio e
  sem alterar o contrato da mutation.
- **2026-08-14 — Revision 12:** ampliou a folha editável compartilhada de `max-w-3xl`
  para `w-full max-w-5xl`, preenchendo mais espaço horizontal no editor sem perder a
  adaptação responsiva.
- **2026-08-14 — Revision 13:** especificou a matriz visual e comportamental da
  `DocumentVersionDecisionBar` conforme os nodes de estado `zBZ6j`, `JH360`, `Op56U`,
  `sJhUE`, `uupRa`, `ca1dH` e `WpfrA`, reutilizando cancelamento/retry existentes e
  mantendo a limitação de não exibir detalhes de erro sem contrato.
- **2026-08-14 — Revision 14:** passou a exibir data e hora de criação da versão nos
  metadados da revisão e do histórico, usando a formatação local `pt-BR`.
- **2026-08-14 — Revision 18:** tornou **Ver motivo** uma ação clicável na barra de
  decisão e especificou o dialog informativo que exibe o `rejectionReason` persistido.
- **2026-08-14 — Revision 22:** corrigiu o contrato da geração individual inicial:
  body ausente ou vazio é válido quando não há instruções. A validação Zod deixou
  de bloquear o POST da UI antes da publicação do evento no Inngest, e o controller
  recebeu regressão REST para o caminho sem body.
- **2026-08-14 — Revision 23:** definiu que o motivo exibido em **Motivo da
  rejeição** deve usar `Textarea` somente leitura, preservando quebras de linha e
  evitando apresentar o conteúdo persistido como parágrafo estático.
- **2026-08-14 — Revision 24:** encerrou a Spec após o Quality Gate integrado. A
  implementação foi considerada aprovada com blocker preexistente: o build e o
  type-check da Web continuam impedidos pelo import ausente de `react-pdf` no
  `document-viewer` fora do escopo desta feature. A avaliação final está em
  [`evaluation.md`](./evaluation.md).

## Encerramento

- **Status:** completed.
- **Veredito:** passed with pre-existing blocker; não foram identificados
  blockers novos na implementação da feature.
- **Commit avaliado:** working tree sobre `HEAD 1c557ed6`, com alterações da
  feature ainda não commitadas; nenhum commit ou PR foi criado neste encerramento.
- **Evidências:** [`plan.md`](./plan.md) e [`evaluation.md`](./evaluation.md).
