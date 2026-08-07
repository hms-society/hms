---
title: Criação, detalhe e edição de modelo de documento
status: in_progress
revision: 2
verdict: failed_ji_01_to_ji_07
evaluation: ./evaluation.md
sources:
  - type: jira-ticket
    ref: https://plataformahms.atlassian.net/browse/SCRUM-136
    role: delivery_scope
  - type: prd
    ref: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
    role: product_requirements
  - type: design
    ref: design/hms.pen#K2Fvp
    role: visual_reference
  - type: design
    ref: design/hms.pen#vBrek
    role: visual_reference
  - type: design
    ref: design/hms.pen#V7lxA
    role: visual_reference
  - type: design
    ref: design/hms.pen#FQtUK
    role: visual_reference
  - type: design
    ref: design/hms.pen#fRdNH
    role: visual_reference
  - type: direct-request
    ref: codex-task
    role: delivery_scope
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673
jira_tickets:
  - SCRUM-136
scope:
  - packages/core/src/document-production
  - packages/core/package.json
  - packages/validation/src/document-production
  - packages/validation/package.json
  - apps/server/src/document-production
  - apps/server/rest-client/document-production/document-specifications.rest
  - apps/server/src/shared/database/drizzle/migrations
  - apps/server/src/shared/database/drizzle/schema.ts
  - apps/web/package.json
  - pnpm-lock.yaml
  - apps/web/src/constants/routes.ts
  - apps/web/src/rest/services/document-production-service.ts
  - apps/web/src/rest/services/tests/document-production-service.test.ts
  - apps/web/src/routes/modelos-de-documentos
  - apps/web/src/routeTree.gen.ts
  - apps/web/src/ui/document-production
  - apps/web/tests/routes/document-production
last_updated_at: 2026-08-06
---

# Contexto e objetivo

O ticket `SCRUM-136` entrega a tela administrativa de um modelo de documento. A
demanda direta desta revisão amplia o fluxo para que o administrador também possa
criar um modelo a partir da listagem, além de revisar e salvar separadamente sua
configuração de aplicação e seu template rico, incluindo variáveis de sistema e
variáveis personalizadas locais ao template.

A seção 11 do PRD de Produção Documental, revisada em 05/08/2026, prevalece
sobre trechos anteriores conflitantes. Ela substitui a antiga configuração
separada de pacotes por uma única aplicação no próprio modelo, limita os momentos
a **Consulta**, **Formalização** e **Produção jurídica**, elimina upload de
arquivo-base no MVP e define somente os estados **Disponível** e
**Indisponível**.

A listagem em `/modelos-de-documentos` já fornece a entrada administrativa e o
identificador de cada modelo, mas ainda não conecta **Editar** a uma rota de
detalhe. A fundação local de Produção Documental também está inconsistente: o
Core referencia `DocumentSpecificationApplication`,
`DocumentSpecificationStatus` e `DocumentTemplateVariable` sem que esses tipos
existam, e `DocumentGenerationMoment` usa `case` enquanto banco, REST e UI usam
`legal_production`. O typecheck do Core falha por essas lacunas. Este reparo é
pré-condição da feature e integra seu escopo.

## Objetivo

Permitir que um administrador ativo crie ou abra um modelo, configure sua
aplicação e edite seu template rico com variáveis válidas, preservando as
fronteiras entre Produção Documental, Catálogo Jurídico, autenticação e
transporte.

# Escopo

## Incluído

- iniciar um modelo pela ação **Novo modelo** da listagem;
- criar sua identidade e configuração inicial como **Indisponível**, sem estado
  Rascunho, e redirecionar ao detalhe criado;
- abrir o detalhe de um modelo pela ação **Editar** da listagem;
- carregar nome, descrição, disponibilidade, aplicação, obrigatoriedade,
  conteúdo rico e variáveis personalizadas;
- salvar nome, descrição, estado e uma única aplicação, global ou restrita a
  múltiplas áreas com temas compatíveis;
- editar ou colar conteúdo rico, aplicar os controles visuais contratados e
  salvar somente um documento válido e não vazio;
- buscar e inserir variáveis no cursor no formato `{{nome_tecnico}}`;
- criar variáveis personalizadas locais ao modelo, validando rótulo, nome
  técnico, descrição opcional, unicidade e colisão com variáveis de sistema;
- migrar o conteúdo textual existente para uma representação JSON rica e
  validável;
- proteger todas as operações para administradores ativos;
- tratar carregamento, não encontrado, erro, salvamento pendente, sucesso,
  validação e tentativa de saída com alterações não salvas;
- validar domínio, schema, persistência, REST, serviço web, widgets, rota e fluxo
  autenticado real.

## Fora de escopo

- duplicar ou excluir modelos;
- alterar o fluxo da ação **Duplicar** da listagem;
- manter áreas ou temas no módulo de Produção Documental;
- configurar fichas de atendimento, pacotes operacionais ou documentos já
  produzidos;
- upload ou importação de DOCX/PDF, substituição de arquivo-base e pré-visualização
  separada;
- colaboração simultânea, histórico administrativo de versões do template,
  autosave ou resolução de conflitos concorrentes;
- geração por IA, preenchimento das variáveis ou renderização do documento final;
- redesenhar sidebar, navbar ou o `AppLayout` compartilhado;
- atualizar automaticamente o ticket `SCRUM-136`.

# Referências de design

| Fonte | Node | Estado canônico | Contract relacionado |
|---|---|---|---|
| `design/hms.pen` | `K2Fvp` | listagem com ação principal **Novo modelo** | RF-011, RF-010 |
| `design/hms.pen` | `vBrek` | desktop, aba **Configuração**, duas áreas e temas, feedback salvo | RF-002, RF-003, RF-010 |
| `design/hms.pen` | `V7lxA` | desktop, aba **Template**, conteúdo existente, toolbar e painel de variáveis | RF-004, RF-005, RF-010 |
| `design/hms.pen` | `FQtUK` | desktop, template vazio, salvamento desabilitado e **Começar a escrever** | RF-004, RF-007, RF-010 |
| `design/hms.pen` | `fRdNH` | modal **Criar variável personalizada** | RF-006, RF-010 |

Os cinco frames têm 1440 px de largura, exceto o modal isolado de 520 px. Não
há frame canônico para viewport estreito, tema escuro, carregamento, erro, 404,
criação vazia, conflito de navegação ou validações inválidas; esses estados
derivam do Contract, de `documentation/design.md` e das Rules e serão validados
no navegador sem inventar Node IDs. O modo de criação deriva a hierarquia de
`vBrek`, com campos vazios, estado **Indisponível** bloqueado e aba Template
desabilitada até existir uma identidade persistida.

A sidebar e a navbar observadas nos frames são apenas contexto visual: a rota
reutiliza o `AppLayout` existente sem alteração estrutural. A integração funcional
permanece obrigatória: **Editar** na listagem abre o detalhe e o item
**Documentos** continua ativo na rota descendente.

Há uma divergência de fonte: `vBrek` rotula a descrição como opcional, enquanto a
seção 11.2 do PRD determina que todo modelo possua nome e descrição objetiva. O
PRD prevalece; a implementação deve apresentar a descrição como obrigatória e
registrar essa divergência na comparação visual.

# Contract

## Requisitos

### RF-001 — Autorizar e localizar o modelo

A rota e as quatro operações REST aceitam somente sessão válida de colaborador
local ativo com perfil `admin`. Ausência de sessão retorna `401`; vínculo
inexistente/inativo ou outro perfil retorna `403`. Um UUID inexistente retorna
`404` no REST e um estado de modelo não encontrado na rota. Nenhum perfil, user ID
ou dado derivado da sessão integra payloads do client.

### RF-011 — Criar um modelo a partir da listagem

A ação **Novo modelo** de `K2Fvp` abre
`/modelos-de-documentos/novo`, protegida pelo mesmo middleware administrativo. A
página reutiliza a composição visual da aba Configuração de `vBrek`, em modo de
criação, com nome e descrição vazios, aplicação inicial
`{ moment: 'consultation', scope: 'global' }` editável e `isRequired: false`. A
aba Template permanece desabilitada com texto que explica
que o modelo precisa ser criado antes da escrita; nenhuma entidade é criada ao
abrir ou abandonar a rota.

O formulário exige nome, descrição e uma aplicação válida conforme RF-002 e
RF-003. O estado inicial é sempre `unavailable`, exibido como controle bloqueado
com orientação para adicionar o template antes de disponibilizar. O client não
envia `status`, `content` ou `variables`; o caso de uso define
`status: 'unavailable'`, documento vazio canônico
`{ type: 'doc', content: [{ type: 'paragraph' }] }` e `variables: []`.

**Criar modelo** envia uma única requisição. O servidor normaliza textos, valida
referências jurídicas ativas e insere modelo, áreas e temas na mesma transação.
Falha não deixa linha nem associação parcial. Sucesso retorna `201` com a
projeção completa, invalida a listagem, redireciona com `replace` para
`/modelos-de-documentos/:documentSpecificationId` e exibe confirmação; a partir
desse momento as duas abas e os PATCHes normais ficam disponíveis. Submissão
pendente não duplica requests e alterações não salvas usam a mesma confirmação
de saída do detalhe.

### RF-002 — Exibir e salvar informações gerais

A configuração apresenta e permite alterar:

- `name`: texto obrigatório após `trim`;
- `description`: texto obrigatório após `trim`;
- `status`: `available` ou `unavailable`.

O cabeçalho apresenta o nome corrente e o estado por texto, além de indicar se a
aba não possui alterações, está salvando, foi salva ou falhou. Salvar sem mudança
não envia request nem cria atualização fictícia.

Um modelo só pode ser salvo como `available` quando sua configuração é válida e
seu template possui conteúdo válido e não vazio. Um modelo incompleto pode ser
salvo como `unavailable`; tentativa de disponibilizá-lo retorna erro de domínio
com orientação para completar a pendência.

### RF-003 — Configurar uma única aplicação

Cada modelo possui exatamente uma aplicação com:

- `moment`: `consultation`, `formalization` ou `legal_production`;
- `scope`: `global` ou `legal_context`.

`isRequired: boolean` é propriedade do modelo, ao lado de `application`, e não
integra a união discriminada. Esse shape é único em Core, banco, REST e UI.

Em abrangência global não há áreas ou temas persistidos. Em abrangência jurídica
deve existir ao menos uma área ativa e, para cada área, ao menos um tema ativo e
pertencente a ela. A mesma área e o mesmo tema não se repetem. Trocar para
`global` limpa as seleções jurídicas somente após a confirmação da ação; trocar
uma área remove apenas seus temas e exige nova seleção. O servidor valida as
referências pelo `LegalExpertiseCatalogProvider`, sem confiar nas opções exibidas
pelo client.

### RF-004 — Editar e validar o template rico

O template usa a árvore JSON abaixo, com propriedades adicionais proibidas:

```ts
type DocumentTemplateContent = {
  readonly type: 'doc'
  readonly content?: readonly BlockNode[]
}

type BlockNode = Paragraph | Heading | Blockquote | BulletList
type InlineNode = TextNode | { readonly type: 'hardBreak' }
type NonEmptyText = string & { readonly __brand: 'NonEmptyText' }
type AbsoluteHttpUrl = string & { readonly __brand: 'AbsoluteHttpUrl' }

type Paragraph = {
  readonly type: 'paragraph'
  readonly attrs?: { readonly textAlign: 'left' | null }
  readonly content?: readonly InlineNode[]
}

type Heading = {
  readonly type: 'heading'
  readonly attrs: { readonly level: 1 | 2; readonly textAlign: 'left' | null }
  readonly content?: readonly InlineNode[]
}

type Blockquote = {
  readonly type: 'blockquote'
  readonly content: readonly [BlockNode, ...BlockNode[]]
}

type BulletList = {
  readonly type: 'bulletList'
  readonly content: readonly [ListItem, ...ListItem[]]
}

type ListItem = {
  readonly type: 'listItem'
  readonly content: readonly [Paragraph, ...BlockNode[]]
}

type TextNode = {
  readonly type: 'text'
  readonly text: NonEmptyText
  readonly marks?: readonly TextMark[]
}

type TextMark =
  | { readonly type: 'bold' | 'italic' | 'underline' }
  | {
      readonly type: 'link'
      readonly attrs: {
        readonly href: AbsoluteHttpUrl
        readonly target: null
        readonly rel: null
        readonly class: null
      }
    }
```

`NonEmptyText` e `AbsoluteHttpUrl` são marcas obtidas somente após parse dos
schemas compartilhados: texto exige `.min(1)` e URL exige `new URL(value)` com
`protocol` exatamente `http:` ou `https:`. `href` aceita, portanto, somente URL
absoluta nesses dois protocolos. Os shapes recursivos de
`Blockquote` (`block+`) e `ListItem` (`paragraph block*`) espelham o schema das
extensões habilitadas, inclusive seus aninhamentos por escrita ou colagem. A
configuração do editor deve produzir exatamente esse shape; nós, atributos,
protocolos ou marcas fora dele são rejeitados pela validação compartilhada.

O editor suporta escrita e colagem, undo/redo, parágrafo, títulos 1/2, citação,
bold, italic, underline, lista, alinhamento à esquerda e link, conforme `V7lxA`.
O JSON, e não HTML arbitrário, é persistido e devolvido. Conteúdo válido deve
possuir ao menos um caractere textual não branco; documento estruturalmente vazio
não pode ser salvo.

### RF-005 — Listar, buscar e inserir variáveis

O painel mostra uma lista plana composta pelas variáveis de sistema e pelas
variáveis personalizadas do modelo. Cada item apresenta rótulo, nome técnico e
descrição acessível. A busca considera esses três campos, sem diferença de caixa
e ignorando espaços periféricos.

As variáveis de sistema iniciais são `cliente_nome`, `cliente_cpf`,
`area_juridica`, `tema_juridico` e `valor_honorarios`, declaradas em constante do
Core com rótulo e descrição. Inserir uma variável usa a seleção/cursor mais
recente do editor, restaura o foco e adiciona texto literal
`{{nome_tecnico}}`; se não houver seleção válida, insere no fim do bloco corrente.

Ao salvar, todo token que comece com `{{` deve respeitar exatamente
`{{[a-z][a-z0-9_]*}}` e referenciar uma variável de sistema ou personalizada
disponível no mesmo modelo. Tokens malformados ou desconhecidos impedem o
salvamento e são comunicados sem destruir o rascunho. A validação concatena o
texto inline contíguo de cada bloco antes de examinar tokens, portanto uma marca
de formatação não oculta nem invalida artificialmente uma variável.

### RF-006 — Criar variável personalizada local

O modal recebe:

- `label`: obrigatório, normalizado por `trim`;
- `technicalName`: obrigatório, editável e no padrão
  `[a-z][a-z0-9_]*`; a sugestão inicial é derivada do rótulo em `snake_case`,
  removendo diacríticos;
- `description`: opcional, normalizada para ausência quando vazia.

O nome técnico deve ser único no modelo e não pode colidir com variável de
sistema. Confirmar adiciona a variável somente ao rascunho do modelo atual e a
torna imediatamente pesquisável/inserível; a persistência ocorre junto de
**Salvar template**. Cancelar ou fechar não altera o rascunho. A variável não
aparece em nenhum outro modelo.

### RF-007 — Distinguir template vazio e conteúdo existente

Sem conteúdo textual, a aba apresenta o estado de `FQtUK`, **Começar a escrever**,
a orientação de colagem e **Salvar template** desabilitado. A ação foca o editor
sem inserir conteúdo fictício. Com conteúdo, apresenta a página editável de
`V7lxA`, contagem de palavras derivada apenas de texto e salvamento habilitado
somente quando o rascunho é válido e difere da versão carregada.

### RF-008 — Salvar por fronteiras independentes

**Salvar modelo** atualiza somente informações gerais e aplicação. **Salvar
template** atualiza somente conteúdo e variáveis personalizadas. Cada operação é
atômica e preserva a outra fronteira. A substituição da aplicação jurídica remove
e recria suas referências dentro da mesma transação do update principal.

Enquanto uma operação está pendente, seus controles de confirmação ficam
desabilitados e uma segunda submissão não é disparada. Sucesso atualiza o cache e
a referência salva da aba; falha preserva o rascunho e oferece nova tentativa. Sair da
rota, trocar de aba ou recarregar com alterações não salvas solicita confirmação;
sem alterações, a navegação segue diretamente.

### RF-009 — Preservar fronteiras modulares e dados existentes

Produção Documental possui modelo, aplicação, template e variáveis. Catálogo
Jurídico possui nomes, atividade e compatibilidade de áreas/temas; a feature usa
somente seu provider no Core/server e seu serviço REST existente no web. Não são
adicionadas FKs, joins ou imports para tabelas do Catálogo.

O conteúdo textual legado é convertido por migration para documento JSON rico,
sem perder o texto. Associações, variáveis e documentos/pacotes existentes não
são alterados. O valor canônico do terceiro momento é `legal_production` em Core,
banco, REST, validação, seed e UI.

### RF-010 — Reproduzir a experiência visual e acessível

O conteúdo principal segue hierarquia, rótulos, abas, toolbar, painel lateral,
estado vazio, modal, densidade e feedback dos cinco nodes. A implementação usa
tokens semânticos, Fraunces nos títulos e Plus Jakarta Sans na interface; não
recria primitivas shadcn nem hardcodeia cores, raios ou sombras disponíveis no
tema.

Abas, toolbar, selects, temas removíveis, modal, busca e salvamento funcionam por
teclado, têm foco visível e nomes acessíveis. Estado, obrigatoriedade, validação e
feedback não dependem somente de cor. O editor expõe nome/descrição acessível e
os botões de formatação comunicam estado pressionado. A página preserva operação
sem overflow em viewport estreito, zoom/reflow, tema escuro e WCAG 2.2 AA.

## Critérios de aceitação

| CA | SR | Dado | Quando | Então | Evidência esperada |
|---|---|---|---|---|---|
| CA-01 | RF-001 | administrador ativo autenticado | abre **Editar** em uma linha | chega à rota do ID e vê o modelo retornado pelo servidor | serviço + rota browser + navegador real |
| CA-02 | RF-001 | sessão ausente, perfil inválido, conta inativa ou ID ausente | acessa a rota/API | recebe redirect/`401`/`403`/`404` sem expor dados | integração REST + rota browser |
| CA-03 | RF-002 | nome, descrição e estado válidos | salva a configuração | somente esses dados e a aplicação são atualizados e o feedback indica sucesso | use case + integração REST + widget |
| CA-04 | RF-002 | modelo sem template válido | tenta marcá-lo disponível | salvamento é recusado com orientação e o rascunho permanece | use case + integração REST + widget |
| CA-05 | RF-003 | aplicação global | salva | nenhuma associação jurídica permanece persistida | use case + integração REST/persistência |
| CA-06 | RF-003 | múltiplas áreas e temas ativos compatíveis | salva aplicação jurídica | IDs únicos são persistidos e recarregados na mesma estrutura | use case + integração REST + widget |
| CA-07 | RF-003 | tema duplicado, inativo ou fora da área | tenta salvar | servidor recusa sem alterar o modelo | use case + integração REST |
| CA-08 | RF-004 | texto colado e formatado com o toolbar contratado | salva e recarrega | estrutura e formatação suportadas são preservadas em JSON | schema + integração REST + widget/browser |
| CA-09 | RF-004 | JSON com nó, marca, atributo ou link não permitido | envia à API | recebe `400` sem persistência parcial | schema + integração REST |
| CA-10 | RF-005 | cursor entre dois caracteres | seleciona uma variável | token é inserido exatamente no cursor e o editor recupera foco | widget + navegador |
| CA-11 | RF-005 | busca por rótulo, nome técnico ou descrição | digita termo com caixa/espaços diferentes | lista plana contém somente correspondências e preserva nomes acessíveis | hook/widget |
| CA-12 | RF-005 | token malformado ou desconhecido no conteúdo | tenta salvar | salvamento é impedido e o token problemático é informado | use case + widget |
| CA-13 | RF-006 | rótulo válido | abre o modal | nome técnico sugerido em snake_case continua editável | hook/widget |
| CA-14 | RF-006 | nome técnico duplicado, reservado ou inválido | confirma | modal permanece aberto com erro associado ao campo | schema + hook/widget |
| CA-15 | RF-006 | variável personalizada válida | confirma e salva template | variável fica apenas no modelo atual e reaparece após recarga | use case + integração REST + rota browser |
| CA-16 | RF-007 | template sem texto | abre a aba Template | vê estado vazio, botão de começar e salvamento desabilitado | widget + rota browser + comparação Pencil |
| CA-17 | RF-007 | template existente alterado | edita o conteúdo | contagem usa texto e salvar habilita somente para rascunho válido diferente | hook/widget |
| CA-18 | RF-008 | rascunhos distintos nas duas abas | salva somente uma aba | a outra fronteira e seu rascunho não são sobrescritos | use case + integração REST + widget |
| CA-19 | RF-008 | request pendente ou falha recuperável | confirma novamente | não duplica request; erro preserva rascunho e retry conclui | widget + rota browser |
| CA-20 | RF-008 | aba ou rota com mudanças não salvas | tenta trocar/sair/recarregar | recebe confirmação; cancelar preserva estado e confirmar permite sair | widget + navegador |
| CA-21 | RF-009 | conteúdo/variáveis legados válidos, inclusive conteúdo vazio disponível | aplica migration | texto vira JSON, vazio fica indisponível e variáveis são preservadas; variável inválida aborta sem perda | teste/migration + integração persistência |
| CA-22 | RF-009 | build integrado | verifica contratos de momento e tipos ausentes | Core, banco, REST e web usam `legal_production` e o typecheck passa | check-types + revisão arquitetural |
| CA-23 | RF-010 | nodes `K2Fvp`, `vBrek`, `V7lxA`, `FQtUK`, `fRdNH` | compara com desktop real | listagem, conteúdo principal e modal correspondem, com a divergência documentada da descrição | comparação Pencil + navegador real |
| CA-24 | RF-010 | teclado, viewport estreito, zoom e tema escuro | usa todos os estados | interface permanece legível, focável, operável e sem overflow | navegador real + auditoria a11y |
| CA-25 | RF-011 | administrador ativo na listagem de `K2Fvp` | aciona **Novo modelo** | abre a rota estática `/modelos-de-documentos/novo` sem criar registro | comparação Pencil + rota browser + navegador real |
| CA-26 | RF-011 | formulário novo global válido | seleciona **Criar modelo** | cria uma identidade indisponível com documento vazio/variáveis vazias e redireciona ao detalhe | use case + REST + rota browser |
| CA-27 | RF-011 | múltiplas áreas e temas ativos compatíveis | cria aplicação jurídica | modelo e associações são persistidos atomicamente na estrutura informada | use case + integração REST/persistência |
| CA-28 | RF-011 | body inválido, catálogo incompatível ou falha de persistência | tenta criar | recebe erro acionável, preserva o formulário e não deixa modelo/associação parcial | schema + use case + integração REST + widget |
| CA-29 | RF-011 | modo de criação ainda não persistido | observa estado e abas | estado permanece Indisponível, Template fica desabilitada com explicação e nenhum payload controla conteúdo/status | widget + rota browser + revisão de contrato |
| CA-30 | RF-011 | criação pendente ou formulário alterado | confirma novamente ou tenta sair | não duplica POST e aplica a confirmação de descarte já contratada | hook/widget + navegador |

## Rastreabilidade

| SR | Origem |
|---|---|
| RF-001 | `SCRUM-136`; PRD REQ-027; precedente `ActiveAdminGuard`/`requireAdminMiddleware` |
| RF-002 | `SCRUM-136`; PRD REQ-001, REQ-003, REQ-004 e seção 11.2; `vBrek` |
| RF-003 | `SCRUM-136`; PRD REQ-002 e seção 11.2; `vBrek` |
| RF-004 | `SCRUM-136`; PRD seção 11.3; `V7lxA` e `FQtUK` |
| RF-005 | `SCRUM-136`; PRD seção 11.3; `V7lxA` e `FQtUK` |
| RF-006 | `SCRUM-136`; PRD seção 11.3; `fRdNH` |
| RF-007 | `SCRUM-136`; PRD seção 11.3; `V7lxA` e `FQtUK` |
| RF-008 | `SCRUM-136`; PRD REQ-003 e regra geral de consistência |
| RF-009 | PRD seções 2, 4 e 8; `documentation/modules.md`; implementação existente |
| RF-010 | `SCRUM-136`; cinco nodes Pencil; `documentation/design.md` |
| RF-011 | demanda direta desta revisão; PRD REQ-001, REQ-027, seções 5, 11.1, 11.2 e 11.6; `K2Fvp` e `vBrek` |

# Estado atual

## Evidência local consolidada

| Path | Estado | Evidência |
|---|---|---|
| `packages/core/src/document-production/domain/entities/document-specification.ts` | existente | já prevê aplicação, conteúdo e variáveis, mas depende de três tipos ausentes |
| `packages/core/src/document-production/domain/structures/document-generation-moment.ts` | existente | usa `case`, divergindo de banco/REST/UI (`legal_production`) |
| `packages/core/src/document-production/interfaces/document-specifications-repository.ts` | existente | expõe somente `list`, `addMany` e `removeAll` |
| `apps/server/src/document-production/database/drizzle/models/document-specification-model.ts` | existente | conteúdo é `text`; variáveis já são `jsonb`; índices e checks de aplicação existem |
| `apps/server/src/document-production/database/drizzle/repositories/drizzle-document-specifications-repository.ts` | existente | já grava aplicação e associações, mas não lê detalhe nem atualiza fronteiras |
| `apps/server/src/document-production/rest/controllers/list-document-specifications.controller.ts` | existente | precedente do prefixo, guards, use case e DTOs |
| `apps/web/src/routes/modelos-de-documentos/index.tsx` | existente | rota de listagem protegida e envolvida por `AppLayout` |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page` | existente | listagem e botão **Editar** ainda sem navegação conectada |
| `apps/web/src/rest/services/document-production-service.ts` | existente | implementa somente listagem |
| `apps/web/package.json` | existente | React/Tailwind/shadcn presentes; nenhum editor rico instalado |
| `design/hms.pen` | existente, somente leitura | cinco nodes inspecionados via Pencil; não integra escopo de alteração |

## Inventário de alteração

| Path | Estado | Contrato da mudança |
|---|---|---|
| `packages/core/src/document-production/domain/structures/{document-specification-status,document-specification-application,document-template-variable,document-template-content,create-document-specification-input,document-specification-configuration-update,document-specification-template-update,document-specification-details}.ts` | novos | tipos compartilhados descritos em **Core**, um `export type` por arquivo; exports no `index.ts` existente |
| `packages/core/src/document-production/domain/errors/{document-specification-not-found-error,invalid-document-specification-configuration-error,invalid-document-template-error}.ts` | novos | erros sem dependência HTTP; exports no `index.ts` existente |
| `packages/core/src/document-production/use-cases/{create-document-specification,get-document-specification,update-document-specification-configuration,update-document-specification-template}-use-case.ts` | novos | criação, leitura e dois limites de update; teste homônimo em `use-cases/tests` |
| `packages/core/src/document-production/domain/entities/document-specification.ts` e `interfaces/{document-specifications-repository,document-production-service}.ts` | existentes | conteúdo JSON, métodos de detalhe/update e projeção serializável |
| `packages/validation/src/document-production/schemas/{create-document-specification,document-template-content,document-template-variable,document-specification-configuration-update,document-specification-template-update}-schema.ts` | novos | shapes estritos de transporte; teste homônimo em `schemas/tests`; exports nos `index.ts` existentes |
| `apps/server/src/document-production/database/drizzle/models/document-specification-model.ts`, mapper, repository e seeder do módulo | existentes | JSONB, reconstrução e updates transacionais |
| `apps/server/src/shared/database/drizzle/migrations/<sequência>_<nome-gerado>.sql` | novo, nome final gerado pelo Drizzle | preflight, backfill e alteração `text` → `jsonb`; snapshot e journal Drizzle gerados junto |
| `apps/server/src/document-production/rest/controllers/{create-document-specification,get-document-specification,update-document-specification-configuration,update-document-specification-template}.controller.ts` | novos | POST, GET e dois PATCHes; um teste homônimo por controller |
| `apps/server/src/document-production/rest/dtos/{create-document-specification-request,document-specification-response,update-document-specification-configuration-request,update-document-specification-template-request}.dto.ts` | novos | projeção ISO e bodies derivados dos schemas; exports no `index.ts` existente |
| `apps/server/src/document-production/document-production.module.ts` e `document-specifications.rest` | existentes | composição dos controllers e exemplos das quatro operações |
| `apps/web/src/routes/modelos-de-documentos/$documentSpecificationId.tsx` | novo | rota protegida, client-only e `AppLayout`; `routeTree.gen.ts` é regenerado |
| `apps/web/src/routes/modelos-de-documentos/novo.tsx` | novo | rota estática protegida que abre a página compartilhada em modo de criação |
| `apps/web/src/rest/services/document-production-service.ts` | existente | POST, GET e dois PATCHes tipados; teste existente ampliado |
| `apps/web/src/ui/document-production/widgets/pages/document-specification-page/**` | novo diretório | composição, hooks, widgets e testes com contratos abaixo |
| `apps/web/src/ui/document-production/widgets/pages/document-specifications-page/**` | existente | botão **Editar** passa a navegar e teste da listagem é alinhado |
| `apps/web/package.json` e `pnpm-lock.yaml` | existentes | dependências Tiptap v3 adicionadas somente ao workspace web |

O comando `pnpm --filter @hms/core check-types` falha pelos tipos ausentes. O
teste browser atual da listagem também conserva uma expectativa antiga de ausência
da coluna **Ação**, embora a implementação já renderize essa coluna; a integração
do botão **Editar** deve alinhar o teste ao comportamento atual, sem ampliar a
duplicação.

# Solução técnica

## Core

Criar, cada `export type` em arquivo próprio sob
`packages/core/src/document-production/domain/structures`:

- `DocumentSpecificationStatus = 'available' | 'unavailable'`;
- `DocumentSpecificationApplication`, união discriminada entre
  `{ scope: 'global'; moment }` e
  `{ scope: 'legal_context'; moment; legalAreaIds; legalTopicIdsByArea }`;
- `DocumentTemplateVariable = { label: string; technicalName: string;
  description?: string }`, representando somente variáveis personalizadas do
  modelo;
- `DocumentTemplateContent`, árvore readonly com raiz `doc` e somente os
  nós/marcas de RF-004; tipos auxiliares permanecem não exportados no mesmo
  arquivo;
- `DocumentSpecificationConfigurationUpdate = Pick<DocumentSpecification,
  'name' | 'description' | 'status' | 'application' | 'isRequired'>`;
- `DocumentSpecificationTemplateUpdate = Pick<DocumentSpecification,
  'content' | 'variables'>`.
- `CreateDocumentSpecificationInput = Pick<DocumentSpecification,
  'name' | 'description' | 'application' | 'isRequired'>`; não contém identidade,
  estado, conteúdo, variáveis ou datas.
- `DocumentSpecificationDetails`, projeção do contrato REST com
  `documentSpecificationId`, `name`, `description`, `application`, `isRequired`,
  `content`, `variables`, `status` e `updatedAt: string` ISO. A projeção omite
  `createdAt`, que não é consumido pela tela, e não expõe `Date` no transporte.

Alterar `DocumentGenerationMoment.Case` para
`DocumentGenerationMoment.LegalProduction = 'legal_production'` e ajustar os
consumidores. Alterar `DocumentSpecification.content` de `string` para
`DocumentTemplateContent`. Declarar e exportar
`SYSTEM_DOCUMENT_TEMPLATE_VARIABLES: readonly DocumentTemplateVariable[]` com
as cinco variáveis de RF-005; a constante não é persistida em cada modelo.

Ampliar `DocumentSpecificationsRepository` com assinaturas explícitas:

```ts
add(
  specification: DocumentSpecificationCreation,
): Promise<DocumentSpecification>

findById(
  documentSpecificationId: string,
): Promise<DocumentSpecification | undefined>

replaceConfiguration(
  documentSpecificationId: string,
  changes: DocumentSpecificationConfigurationUpdate,
): Promise<DocumentSpecification | undefined>

replaceTemplate(
  documentSpecificationId: string,
  changes: DocumentSpecificationTemplateUpdate,
): Promise<DocumentSpecification | undefined>
```

Criar `DocumentSpecificationNotFoundError`, estendendo `NotFoundError`, e
`InvalidDocumentSpecificationConfigurationError` e
`InvalidDocumentTemplateError`, estendendo `BadRequestError`, sem introduzir HTTP
no Core.

Criar os casos de uso:

```ts
class CreateDocumentSpecificationUseCase
  implements UseCase<CreateDocumentSpecificationInput, DocumentSpecification>

class GetDocumentSpecificationUseCase
  implements UseCase<{ documentSpecificationId: string }, DocumentSpecification>

class UpdateDocumentSpecificationConfigurationUseCase
  implements UseCase<{
    documentSpecificationId: string
    changes: DocumentSpecificationConfigurationUpdate
  }, DocumentSpecification>

class UpdateDocumentSpecificationTemplateUseCase
  implements UseCase<{
    documentSpecificationId: string
    changes: DocumentSpecificationTemplateUpdate
  }, DocumentSpecification>
```

Construtores e dependências:

```ts
new CreateDocumentSpecificationUseCase(
  specificationsRepository: DocumentSpecificationsRepository,
  legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
)

new GetDocumentSpecificationUseCase(
  specificationsRepository: DocumentSpecificationsRepository,
)

new UpdateDocumentSpecificationConfigurationUseCase(
  specificationsRepository: DocumentSpecificationsRepository,
  legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
)

new UpdateDocumentSpecificationTemplateUseCase(
  specificationsRepository: DocumentSpecificationsRepository,
)
```

O create normaliza nome/descrição e valida sua aplicação dentro de
`CreateDocumentSpecificationUseCase`. Para `legal_context`, consulta o provider
após as validações estruturais descritas abaixo. Depois compõe
`DocumentSpecificationCreation` com documento vazio canônico, variáveis vazias e
estado indisponível e chama `add`; identidade e datas são geradas pela
persistência.

O update de configuração mantém sua regra dentro de
`UpdateDocumentSpecificationConfigurationUseCase` e executa nesta ordem:

1. chama `findById` e converte ausência em
   `DocumentSpecificationNotFoundError`;
2. normaliza nome/descrição e valida o shape e as invariantes da aplicação;
3. se o status solicitado for `available`, valida o `content` e as `variables`
   atuais da entidade carregada, incluindo texto não vazio e tokens conhecidos;
4. para `legal_context`, valida as seleções no provider;
5. chama `replaceConfiguration` e converte uma ausência concorrente no mesmo
   erro de not-found.

O update de template valida documento, variáveis e tokens dentro de
`UpdateDocumentSpecificationTemplateUseCase`, chama `replaceTemplate` e converte
ausência em `DocumentSpecificationNotFoundError`. O get faz o mesmo com
`findById`. Nenhuma regra de negócio fica em função auxiliar externa aos casos de
uso.

Para `legal_context`, o use case rejeita chaves em `legalTopicIdsByArea` que não
existam em `legalAreaIds`, áreas sem chave/tópicos, áreas ou tópicos duplicados e
listas vazias. Depois transforma exatamente:

```ts
const selections: LegalExpertiseSelection[] = application.legalAreaIds.map(
  (legalAreaId) => ({
    legalAreaId,
    legalTopicIds: application.legalTopicIdsByArea[legalAreaId],
  }),
)
```

Somente após essa validação chama `validateActive(selections)`. Aplicação global
rejeita `legalAreaIds`/`legalTopicIdsByArea` no schema de transporte e não chama o
provider.

Ampliar `DocumentProductionService`:

```ts
createDocumentSpecification(
  request: CreateDocumentSpecificationInput,
): Promise<RestResponse<DocumentSpecificationDetails>>

getDocumentSpecification(
  documentSpecificationId: string,
): Promise<RestResponse<DocumentSpecificationDetails>>

updateDocumentSpecificationConfiguration(
  documentSpecificationId: string,
  request: DocumentSpecificationConfigurationUpdate,
): Promise<RestResponse<DocumentSpecificationDetails>>

updateDocumentSpecificationTemplate(
  documentSpecificationId: string,
  request: DocumentSpecificationTemplateUpdate,
): Promise<RestResponse<DocumentSpecificationDetails>>
```

## Validação compartilhada

Criar e exportar em `packages/validation/src/document-production/schemas`:

- `createDocumentSpecificationSchema`, derivado dos campos compartilhados de
  configuração, aceitando somente `name`, `description`, `application` e
  `isRequired`; propriedades `status`, `content`, `variables`, identidade e datas
  são estritamente rejeitadas;
- `documentTemplateContentSchema`, união recursiva estrita dos nós/marcas
  permitidos, links limitados a `http`/`https` e raiz `doc`;
- `documentTemplateVariableSchema`, com normalização e regex de RF-006;
- `documentSpecificationConfigurationUpdateSchema`, união discriminada por
  `scope`; global rejeita campos jurídicos e `legal_context` exige áreas/tópicos;
- `documentSpecificationTemplateUpdateSchema`, com conteúdo e array de variáveis
  personalizadas.

Schemas validam shape de transporte; unicidade, catálogo ativo, conteúdo textual,
tokens conhecidos e disponibilidade são regras dos casos de uso.

## Persistência e migration

Modificar o model existente para `content: jsonb(...).$type<DocumentTemplateContent>()`
`not null` e manter `variables` como array JSONB de variáveis personalizadas.
Gerar migration Drizzle que:

1. executa preflight e aborta com erro descritivo se `variables` não for array de
   objetos estritos com `label`/`technicalName` strings, `description` ausente ou
   string, nome técnico no regex de RF-006, sem duplicidade e sem colisão com as
   cinco variáveis de sistema; nenhum valor incompatível é descartado ou
   convertido silenciosamente;
2. marca como `unavailable` todo registro cujo `content` seja vazio ou somente
   whitespace, preservando a invariante de RF-002;
3. remove qualquer default textual de `content`;
4. converte cada valor legado não vazio em
   `{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text:
   <valor legado> }] }] }`;
5. converte valor vazio/whitespace em
   `{ type: 'doc', content: [{ type: 'paragraph' }] }`;
6. altera `content` de `text` para `jsonb` com backfill no `USING`;
7. preserva `NOT NULL` e adiciona check de que a raiz é objeto, `type = 'doc'` e
   `content`, quando presente, é array.

Não há nova tabela, FK, RLS ou grant. A migration não altera IDs, associações,
documentos ou pacotes. `variables` permanece JSONB e é preservado integralmente
quando passa no preflight; dados incompatíveis bloqueiam o deploy para correção
explícita. Atualizar mapper, tipos Drizzle e seeder para o novo conteúdo. O mapper
converte `null`/opcionais conforme o domínio e não valida regras de negócio.

No repository:

- `add` insere a linha e, para `legal_context`, suas áreas e temas na mesma
  transação; retorna a entidade recomposta e não reutiliza `addMany`, que continua
  reservado a seed/fixtures;
- `findById` carrega a linha e suas associações e recompõe a aplicação;
- `replaceConfiguration` executa update da linha e, na mesma transação, remove
  associações antigas, reinserindo áreas e temas somente para `legal_context`;
- `replaceTemplate` atualiza apenas `content`, `variables` e `updatedAt`;
- ambos retornam a entidade recarregada ou `undefined`, sem acessar tabelas do
  Catálogo Jurídico.

## REST e composição server

Criar controllers, DTOs de resposta e testes próprios para:

```http
POST  /document-specifications
GET   /document-specifications/:documentSpecificationId
PATCH /document-specifications/:documentSpecificationId/configuration
PATCH /document-specifications/:documentSpecificationId/template
```

Cada controller usa `@DocumentProductionController()`, `AuthGuard` e
`ActiveAdminGuard`, injeta repository/provider por token, instancia seu caso de
uso uma vez no construtor e deriva `RequestBody` de `execute`. Parâmetro inválido
ou body inválido retorna `400`; guards retornam `401`/`403`; ausência retorna
`404`; domínio inválido retorna `400`; sucesso de GET/PATCH retorna `200` com
`DocumentSpecificationResponseDto`; o POST retorna `201`. Todos os status e
payloads são documentados com `@ApiResponse` e `ErrorResponseDto`.

`DocumentSpecificationResponseDto` expõe exatamente
`documentSpecificationId`, `name`, `description`, `application` discriminada com
IDs jurídicos, `isRequired`, `content`, `variables`, `status` e `updatedAt`; a
data é string ISO no JSON. `static fromDomain(entity)` produz a projeção
`DocumentSpecificationDetails`, mapeia `entity.id` para
`documentSpecificationId` e chama `entity.updatedAt.toISOString()`. Nenhum nome
do Catálogo é duplicado nessa resposta, pois o web resolve os labels pelas
operações públicas já existentes.

Contratos concretos da camada REST:

```ts
class CreateDocumentSpecificationController {
  constructor(
    repository: DocumentSpecificationsRepository,
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  )
  handle(
    body: CreateDocumentSpecificationRequestDto,
  ): Promise<DocumentSpecificationResponseDto>
}

class GetDocumentSpecificationController {
  constructor(repository: DocumentSpecificationsRepository)
  handle(documentSpecificationId: string): Promise<DocumentSpecificationResponseDto>
}

class UpdateDocumentSpecificationConfigurationController {
  constructor(
    repository: DocumentSpecificationsRepository,
    legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
  )
  handle(
    documentSpecificationId: string,
    body: UpdateDocumentSpecificationConfigurationRequestDto,
  ): Promise<DocumentSpecificationResponseDto>
}

class UpdateDocumentSpecificationTemplateController {
  constructor(repository: DocumentSpecificationsRepository)
  handle(
    documentSpecificationId: string,
    body: UpdateDocumentSpecificationTemplateRequestDto,
  ): Promise<DocumentSpecificationResponseDto>
}
```

`CreateDocumentSpecificationRequestDto` corresponde exatamente a
`CreateDocumentSpecificationInput`: `name`, `description`, `application` e
`isRequired`. `UpdateDocumentSpecificationConfigurationRequestDto` corresponde exatamente a
`DocumentSpecificationConfigurationUpdate`: `name`, `description`, `status`,
`isRequired` e `application`. `UpdateDocumentSpecificationTemplateRequestDto`
corresponde a `DocumentSpecificationTemplateUpdate`: `content` e `variables`.
Os três requests são derivados dos schemas compartilhados; nenhum DTO redefine
regra.

Arquivos novos dessa fronteira:

- `apps/server/src/document-production/rest/controllers/get-document-specification.controller.ts`;
- `apps/server/src/document-production/rest/controllers/create-document-specification.controller.ts`;
- `apps/server/src/document-production/rest/controllers/update-document-specification-configuration.controller.ts`;
- `apps/server/src/document-production/rest/controllers/update-document-specification-template.controller.ts`;
- `apps/server/src/document-production/rest/dtos/document-specification-response.dto.ts`;
- `apps/server/src/document-production/rest/dtos/create-document-specification-request.dto.ts`;
- `apps/server/src/document-production/rest/dtos/update-document-specification-configuration-request.dto.ts`;
- `apps/server/src/document-production/rest/dtos/update-document-specification-template-request.dto.ts`;
- um teste homônimo por controller em `rest/controllers/tests` e atualização dos
  `index.ts` e do módulo de composição existentes.

Atualizar `document-specifications.rest` com as quatro operações, Bearer token,
UUID semântico e payloads representativos.

## Web e dependência do editor

Adicionar ao workspace `web`, via pnpm, dependências Tiptap v3 compatíveis:
`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` e
`@tiptap/extension-text-align`. A documentação oficial confirma integração React
por `useEditor`/`EditorContent`, `immediatelyRender: false` para SSR, JSON como
formato recomendado e inserção na seleção via cadeia `focus().insertContent()`
([React](https://tiptap.dev/docs/editor/getting-started/install/react),
[JSON/HTML](https://tiptap.dev/docs/guides/output-json-html),
[commands](https://tiptap.dev/docs/editor/api/commands)).
Tiptap é headless e fica isolado no widget; toolbar, tokens, acessibilidade e
estilo continuam pertencendo ao HMS. Não é introduzido segundo form framework,
state manager ou design system.

O editor registra `StarterKit` com nós não contratados desabilitados
(`orderedList`, `code`, `codeBlock`, `strike` e `horizontalRule`), headings
limitados aos níveis 1 e 2, e mantém paragraph, heading, blockquote, bullet list,
list item, hard break, bold, italic, underline e link. `TextAlign` atua somente
em `paragraph`/`heading`, aceita apenas `left` e usa `left` como default. Link usa
`openOnClick: false`, `autolink: false`, `linkOnPaste: false`, protocolos
`http`/`https`, atributos `target`, `rel` e `class` nulos e `isAllowedUri` que
chama o mesmo parser de URL absoluta `http`/`https` do schema compartilhado. O
comando `setLink(href)` também executa esse parser antes de chamar Tiptap e
retorna erro de campo sem modificar a seleção quando a URL é inválida. Assim,
`editor.getJSON()` produz a árvore de RF-004, inclusive os aninhamentos
`blockquote block+` e `listItem paragraph block*`; qualquer extensão futura
exige revisão do Contract e do schema antes de ser habilitada. Testes cobrem
paste aninhado válido, URL relativa/`mailto:` e rejeição de lista vazia, texto
vazio e nós/marcas desabilitados.

Criar `apps/web/src/routes/modelos-de-documentos/$documentSpecificationId.tsx`
(novo arquivo) com `requireAdminMiddleware`, `ssr: false`, parâmetro dinâmico
semântico e `DocumentSpecificationPage` dentro do `AppLayout`; regenerar
`routeTree.gen.ts`. Criar também a rota estática
`apps/web/src/routes/modelos-de-documentos/novo.tsx`, com a mesma proteção,
client-only e layout, passando `{ mode: 'create' }` à página compartilhada. A
rota estática não usa nem fabrica UUID. Adicionar seu path semântico a
`ROUTES`, conectar **Novo modelo** pelo `useNavigation` compartilhado e conectar
**Editar** usando o contrato tipado do TanStack Router com `to` dinâmico e
`params`, preservando **Duplicar** fora de escopo. O item compartilhado
**Documentos** já fica ativo em descendentes e não é reestruturado.

Ampliar `useDocumentSpecificationsPage` com
`openCreateDocumentSpecification(): void`, obtido do `useNavigation`, e fazer o
header da listagem renderizar o botão primário **Novo modelo** observado em
`K2Fvp`. O botão permanece acessível também no estado de lista vazia; filtros,
paginação e requests de listagem não são alterados pela navegação.

Ampliar `DocumentProductionService(restClient)` para mapear as quatro operações,
sem auth, cache ou regra de negócio. Criar em
`apps/web/src/ui/document-production/widgets/pages/document-specification-page`
(novo diretório):

- `index.tsx` e `use-document-specification-page.ts`, composição e coordenação das
  abas, queries/mutations, referências salvas e bloqueio de navegação;
- query semântica para GET e actions para POST e os dois PATCHes; o create
  invalida a listagem e navega ao ID retornado, enquanto queries/updates usam
  chaves contendo o ID e invalidam listagem/detalhe após sucesso;
- `document-specification-header`, `document-specification-tabs`,
  `document-specification-configuration`, `document-template-editor`,
  `document-template-toolbar`, `document-template-empty-state`,
  `document-template-variables-panel` e `create-document-template-variable-dialog`,
  cada widget em diretório próprio com props nomeadas e hook quando possuir
  comportamento;
- hooks de áreas/tópicos reutilizando `legalCatalogService`; cada grupo consulta
  temas por seu `legalAreaId`, e falha de catálogo mantém o rascunho visível,
  informa a indisponibilidade e impede salvar referências não verificáveis;
- estados próprios de loading, error/retry e not-found.

Usar React Hook Form + schemas Zod para os dois formulários. O hook do editor
inicializa Tiptap somente no client, expõe estado/commands sem deixar a view
depender de detalhes do ProseMirror, preserva a última seleção para inserir
variáveis e serializa por `editor.getJSON()`.

Contratos semânticos da página:

```ts
useCreateDocumentSpecificationAction(): {
  create(input: CreateDocumentSpecificationInput): Promise<DocumentSpecificationDetails>
  isPending: boolean
  error?: Error
}

useDocumentSpecificationQuery(documentSpecificationId: string): {
  documentSpecification?: DocumentSpecificationDetails
  isLoading: boolean
  error?: Error
  retry(): void
}

useUpdateDocumentSpecificationConfigurationAction(documentSpecificationId: string): {
  update(changes: DocumentSpecificationConfigurationUpdate): Promise<void>
  isPending: boolean
  error?: Error
}

useUpdateDocumentSpecificationTemplateAction(documentSpecificationId: string): {
  update(changes: DocumentSpecificationTemplateUpdate): Promise<void>
  isPending: boolean
  error?: Error
}
```

Os tipos de coordenação são:

```ts
type DocumentSpecificationTab = 'configuration' | 'template'
type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type LegalAreaOption = {
  legalAreaId: string
  label: string
}

type LegalTopicOption = {
  legalTopicId: string
  legalAreaId: string
  label: string
}

type LegalCatalogState = {
  legalAreas: readonly LegalAreaOption[]
  legalTopicsByAreaId: Readonly<Record<string, readonly LegalTopicOption[]>>
  isLoadingAreas: boolean
  loadingTopicAreaIds: readonly string[]
  error?: Error
  retryAreas(): void
  retryTopics(legalAreaId: string): void
}

type DocumentTemplateEditorController = {
  content: DocumentTemplateContent
  wordCount: number
  hasText: boolean
  canUndo: boolean
  canRedo: boolean
  active: {
    block: 'paragraph' | 'heading-1' | 'heading-2' | 'blockquote' | 'bullet-list'
    bold: boolean
    italic: boolean
    underline: boolean
    link: boolean
  }
  commands: {
    undo(): void
    redo(): void
    setParagraph(): void
    setHeading(level: 1 | 2): void
    toggleBlockquote(): void
    toggleBulletList(): void
    toggleBold(): void
    toggleItalic(): void
    toggleUnderline(): void
    setLink(href: string): { ok: true } | { ok: false; error: string }
    unsetLink(): void
    insertVariable(technicalName: string): void
    focus(): void
  }
}

type DocumentSpecificationPageController = {
  mode: 'create' | 'edit'
  documentSpecification?: DocumentSpecificationDetails
  activeTab: DocumentSpecificationTab
  setActiveTab(next: DocumentSpecificationTab): Promise<boolean>
  configurationForm: UseFormReturn<DocumentSpecificationConfigurationUpdate>
  templateDraft: DocumentSpecificationTemplateUpdate
  editor: DocumentTemplateEditorController
  catalog: LegalCatalogState
  configurationState: SaveState
  templateState: SaveState
  configurationDirty: boolean
  templateDirty: boolean
  canEditTemplate: boolean
  isLoading: boolean
  isNotFound: boolean
  loadError?: Error
  configurationError?: Error
  templateError?: Error
  retryLoad(): void
  setTemplateVariables(variables: readonly DocumentTemplateVariable[]): void
  createDocumentSpecification(): Promise<void>
  saveConfiguration(): Promise<void>
  saveTemplate(): Promise<void>
  confirmDiscard(destination: 'tab' | 'route' | 'reload'): Promise<boolean>
}

type DocumentSpecificationPageInput =
  | { mode: 'create' }
  | { mode: 'edit'; documentSpecificationId: string }

function useDocumentSpecificationPage(
  input: DocumentSpecificationPageInput,
): DocumentSpecificationPageController
```

A referência salva de cada aba só é substituída após sucesso do PATCH
correspondente. `setActiveTab` retorna `false` quando o descarte é cancelado;
guards de rota/reload chamam `confirmDiscard` e respeitam o mesmo resultado. No
modo `create`, `configurationForm` inicia com `status: 'unavailable'`, a view
renderiza esse campo bloqueado, `canEditTemplate` é `false`, `setActiveTab` não
entra em Template e `createDocumentSpecification` extrai somente os quatro
campos de `CreateDocumentSpecificationInput`. No modo `edit`, essa action não é
exposta por controles e os dois saves mantêm os contratos existentes.

Props mínimas dos widgets, sem acesso direto a REST:

- `DocumentSpecificationHeader`: `mode: 'create' | 'edit'`, `name: string`,
  `status: DocumentSpecificationStatus`, `saveState: SaveState`,
  `onBack(): void`;
- `DocumentSpecificationTabs`: `activeTab: DocumentSpecificationTab`,
  `configurationDirty: boolean`, `templateDirty: boolean`,
  `templateDisabled: boolean`,
  `onTabChange(tab): Promise<boolean>`;
- `DocumentSpecificationConfiguration`:
  `mode: 'create' | 'edit'`,
  `form: UseFormReturn<DocumentSpecificationConfigurationUpdate>`,
  `catalog: LegalCatalogState`, `isSaving: boolean`, `error?: Error`,
  `onSubmit(values: DocumentSpecificationConfigurationUpdate): Promise<void>`;
- `DocumentTemplateEditor`: `editor: DocumentTemplateEditorController`,
  `readOnly: boolean`;
- `DocumentTemplateToolbar`: `controller: DocumentTemplateEditorController`;
- `DocumentTemplateEmptyState`: `onStart(): void`;
- `DocumentTemplateVariablesPanel`:
  `systemVariables: readonly DocumentTemplateVariable[]`,
  `customVariables: readonly DocumentTemplateVariable[]`, `search: string`,
  `onSearchChange(value: string): void`,
  `onInsert(technicalName: string): void`, `onCreate(): void`;
- `CreateDocumentTemplateVariableDialog`: `open: boolean`,
  `existingTechnicalNames: readonly string[]`,
  `onOpenChange(open: boolean): void`,
  `onConfirm(variable: DocumentTemplateVariable): void`.

No modo `create`, header usa **Novo modelo**, o submit usa **Criar modelo** e o
campo de estado é indisponível para edição; no modo `edit`, permanecem o nome
corrente e **Salvar modelo**. Os rótulos de ação e feedback usam o mesmo verbo do
evento concluído.

Arquivos de hooks e actions ficam no diretório da página com os nomes
`use-create-document-specification-action.ts`,
`use-document-specification-query.ts`,
`use-update-document-specification-configuration-action.ts`,
`use-update-document-specification-template-action.ts` e
`use-document-template-editor.ts`. Os widgets nomeados acima ficam em diretórios
homônimos kebab-case, cada um com `index.tsx`; testes ficam no `tests` da página.

## Decisões técnicas

- **Criação em duas etapas, sem Rascunho:** o POST cria configuração válida como
  Indisponível e redireciona ao detalhe; só então o template pode ser salvo e o
  modelo disponibilizado. Um POST monolítico com editor local foi rejeitado por
  misturar as duas fronteiras de salvamento e um registro parcial implícito ao
  abrir a tela foi rejeitado por criar lixo abandonado.
- **JSON rico em vez de HTML:** JSON permite schema estrito e rejeita conteúdo
  executável na borda; HTML textual foi rejeitado por exigir sanitização adicional
  e por esconder estrutura do domínio. O custo é uma migration com backfill.
- **Tiptap headless:** atende toolbar, colagem, seleção e JSON sobre React/Vite e
  preserva o design HMS. Um `contenteditable` manual foi rejeitado por exigir
  reimplementar seleção, undo/redo, paste e acessibilidade; outro design system
  visual não será introduzido.
- **Dois PATCHes:** configuração e template possuem rascunhos, validações e botões
  independentes. Um update monolítico foi rejeitado por risco de sobrescrever a
  aba não salva.
- **Variáveis personalizadas no próprio modelo:** o JSONB existente representa
  somente variáveis locais; variáveis de sistema são constante do Core. Nova
  tabela ou catálogo global foi rejeitado por não haver requisito de gestão
  independente.
- **Validação de catálogo no servidor:** selects do web não são autorização nem
  prova de compatibilidade; somente o provider público valida IDs ativos.
- **Sem autosave/concurrency:** o PRD exclui colaboração simultânea do MVP e o
  design prevê salvamento explícito. Feedback de alteração não implica autosave.

# Plano de validação

## Automatizada

1. `pnpm format`;
2. `pnpm --filter @hms/core lint`, `check-types` e testes dos quatro casos de uso;
3. `pnpm --filter @hms/validation lint`, `check-types` e testes dos cinco schemas;
4. `pnpm --filter server check:code` e `check:types`;
5. testes REST com `DocumentProductionModuleFixture` e Testcontainers, um arquivo
   por controller, cobrindo guards, POST `201`, 400/404, rollback do create,
   backfill observável, update transacional e preservação entre fronteiras;
6. `pnpm --filter web generate-routes`, `check:code` e `check:types`;
7. `pnpm --filter web test`, incluindo serviço, hooks reais, formulários, editor,
   variáveis, estados, dirty guard e navegação da listagem;
8. `pnpm --filter web test:integration` nos arquivos
   `tests/routes/document-production/modelos-de-documentos.novo.test.tsx` e
   `modelos-de-documentos.$documentSpecificationId.test.tsx`, com transporte
   mockado stateful, identificado como integração de rota;
9. ciclo integrado `pnpm lint`, `pnpm check-types` e `pnpm test`.

O build é validação final do CI. Build local é recomendado nesta entrega porque
há nova dependência, alteração de route tree, exports e migration.

## Navegador real e Pencil

Seguir o workflow autenticado obrigatório de `AGENTS.md`: confirmar containers,
Auth e health do server; validar credencial seed na fonte; iniciar server/web em
sessões persistentes; autenticar em `/login`; então:

- abrir a listagem, acionar **Novo modelo** sem criar registro prematuro, validar
  estado indisponível/Template bloqueado, criar aplicação global e confirmar
  redirect ao novo detalhe;
- repetir a criação com múltiplas áreas/temas e validar rollback de uma tentativa
  incompatível;
- acessar um detalhe real por **Editar**;
- recarregar o detalhe e confirmar GET real, rota e conteúdo autenticado;
- salvar configuração global e jurídica com múltiplas áreas/temas;
- validar erro de tema incompatível/inativo e tentativa de disponibilizar modelo
  incompleto;
- editar, colar, formatar, desfazer/refazer, criar/buscar/inserir variável no
  cursor, salvar e recarregar o template;
- validar empty state, loading, 404, erro/retry e dirty guard;
- percorrer toda a experiência por teclado e verificar nomes, foco, estado
  pressionado e anúncio de erros;
- validar desktop, viewport estreito, zoom/reflow e tema escuro;
- comparar lista/criação/detalhe com `K2Fvp`, `vBrek`, `V7lxA`, `FQtUK` e
  `fRdNH`, registrando a divergência da descrição obrigatória e a derivação do
  modo vazio sem frame próprio;
- inspecionar console e requests ao final, classificando erros, warnings,
  hydration, refresh e qualquer `4xx/5xx` inesperado;
- encerrar apenas as sessões Web/Server iniciadas, preservando Docker compartilhado.

# Avaliação

Após implementação e julgamento, registrar evidências, vereditos, sensores,
Quality Gate e build em [`evaluation.md`](./evaluation.md) (novo arquivo). A Spec
mantém somente o Contract e seu estado.

# Alinhamento documental

- O Contract segue `SCRUM-136`, REQ-001 a REQ-004, REQ-027 e a seção 11 do PRD,
  que prevalece sobre conceitos anteriores de arquivo-base/configuração de pacote.
- A demanda direta adiciona o acionamento **Novo modelo** já presente em `K2Fvp`
  e concretiza o cadastro previsto por REQ-001 e pela seção 11.6 sem alterar Jira
  ou Confluence automaticamente.
- O reparo dos tipos e de `legal_production` restaura a intenção já declarada na
  Spec da listagem e não cria regra de produto nova.
- A migration altera somente a representação interna do conteúdo, preservando o
  texto existente e a fronteira do módulo.
- A nova dependência é localizada, justificada por requisito explícito e não
  compete com ferramentas aprovadas em `documentation/infrastructure.md`.
- Nenhuma Rule global ou fronteira arquitetural precisa mudar. O escopo está
  coberto pelo router atual de Rules; não foi identificada convenção recorrente
  sem mapeamento.
- Pelo número de camadas, migration, dependência e estados interativos, a
  implementação deverá ser faseada; `plan.md` permanece opcional neste momento e
  não é criado pela autoria da Spec.

# Premissas e questões pendentes

## Premissas aceitas com risco explícito

- o conteúdo legado em `text` representa texto puro e pode ser embrulhado em um
  único parágrafo sem perda semântica; a migration e a integração comprovam essa
  premissa antes do merge;
- as cinco variáveis vistas como base nos nodes são variáveis de sistema; a sexta
  variável exibida nos exemplos é personalizada e já pertence àquele modelo;
- alterações não salvas são locais à aba e não sobrevivem ao descarte confirmado,
  alinhado à ausência de autosave no MVP.
- a criação ocorre em duas etapas: primeiro persiste configuração válida como
  Indisponível, depois libera Template e disponibilidade; isso evita estado
  Rascunho e registro criado só por navegação.

## Questões pendentes

Nenhuma. Se alguma premissa for rejeitada ou surgir requisito de HTML, autosave,
histórico ou concorrência, o Contract deve ser revisado, a revisão incrementada e
o Judge Spec executado novamente antes da implementação.

# Amendments

| Revisão | Data | Alteração | Motivo |
|---|---|---|---|
| 1 | 2026-08-06 | Contract inicial completo da configuração, template rico, variáveis e integração do detalhe | `SCRUM-136`, PRD seção 11 e nodes `vBrek`, `V7lxA`, `FQtUK`, `fRdNH` |
| 2 | 2026-08-06 | Inclui criação de modelo pela listagem, POST transacional, rota estática e modo inicial indisponível | demanda direta; PRD REQ-001/REQ-027 e seções 5, 11.1, 11.2 e 11.6; `K2Fvp` |
