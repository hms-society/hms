---
title: Listagem operacional de Intakes
status: completed
revision: 3
verdict: accepted
commit: 8b0c165
sources:
  - type: prd
    ref: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2719765/PRD+M+dulo+de+Intake
    role: product_requirements
  - type: jira-ticket
    ref: https://plataformahms.atlassian.net/browse/SCRUM-133
    role: delivery_scope
  - type: design
    ref: design/hms.pen#rRdSU
    role: visual_reference
jira_tickets:
  - SCRUM-133
plan: plan.md
evaluation: evaluation.md
scope:
  - packages/core/src/intake/**
  - packages/core/src/identity/interfaces/**
  - apps/server/src/intake/**
  - apps/server/src/identity/**
  - packages/core/src/intake/use-cases/**
  - apps/server/rest-client/intake/intakes.rest
  - apps/web/src/rest/services/intake-service.ts
  - apps/web/src/routes/intakes/**
  - apps/web/src/constants/routes.ts
  - apps/web/src/ui/intake/widgets/pages/intake-details-page/**
  - apps/web/src/ui/intake/widgets/pages/intakes-page/**
  - apps/web/tests/routes/intake/intakes.index.test.tsx
  - apps/web/tests/routes/intake/intakes.$intakeId.test.tsx
last_updated_at: 2026-08-03
---

# Listagem operacional de Intakes

## Contexto e objetivo

O Intake já possui domínio, persistência, operações REST para cadastro, consulta
individual e histórico por Cliente, além da rota autenticada `/intakes`. A página
atual, porém, é apenas um estado introdutório com a ação `Novo Intake`: ela não
consulta dados, não permite busca ou segmentação e não oferece acesso ao detalhe.

Esta entrega transforma `/intakes` na fila operacional definida pelos requisitos
`REQ-001` e `REQ-002` do PRD. Usuários autenticados devem conseguir visualizar,
localizar e segmentar Intakes reais, compreender seu estado e seguir para o detalhe,
sem transferir para Intake a propriedade dos dados de Cliente, colaborador ou Catálogo
Jurídico.

A entrega usa modo completo porque combina projeção de leitura entre módulos,
contrato REST paginado, estado de busca/filtros na URL, uma tabela responsiva e
validação integrada de servidor e navegador. A implementação deve ser roteada para
`create-plan` após a aprovação desta Spec.

## Fontes e precedência

1. O PRD canônico no espaço **Plataforma HMS** define o comportamento de produto.
2. `SCRUM-133` delimita a entrega e exige dados reais, paginação e integração REST.
3. O frame Pencil `rRdSU` define composição, densidade e hierarquia visual, desde
   que não contradiga o PRD ou o ticket.
4. Architecture, Modules, Design System e Rules do repositório definem a solução.
5. A implementação atual é evidência do estado presente, não fonte de requisitos.

O ticket relacionado `SCRUM-109` não é fonte desta Spec: seu conteúdo trata do
design do fluxo **Novo Intake**, usa nomenclatura e estados anteriores ao PRD atual e
não descreve a listagem.

## Escopo

### Incluído

- tabela operacional autenticada em `/intakes`;
- busca por ID exibido do Intake, nome do Cliente e CPF/CNPJ;
- tabs de status e filtros complementares por responsável, origem, canal de contato
  e período de registro;
- paginação, ordenação determinística e contagens por status;
- projeção de leitura com dados mínimos e autorizados de Cliente e responsável, sem
  copiá-los para o agregado Intake;
- sincronização de busca, filtros e página com a URL;
- estados de carregamento, sucesso, vazio sem filtros, vazio com filtros e erro com
  nova tentativa;
- ação `Novo Intake`, cópia do ID exibido e navegação para a rota canônica do detalhe;
- boundary mínimo da rota autenticada `/intakes/$intakeId`, necessário para receber a
  navegação e usar a consulta individual já existente; a ficha completa não pertence
  a esta entrega;
- testes unitários, de widgets, integração REST e integração de rota no navegador.

### Fora de escopo

- alterar o fluxo de criação de Intake;
- implementar a ficha completa, linha do tempo ou ações do detalhe;
- editar ou encerrar um Intake a partir da listagem;
- Kanban, exportação, seleção em massa ou filtro de próxima ação;
- alterar cadastro, consentimentos ou regras de autorização de Cliente;
- alterar disponibilidade, reserva ou conteúdo de Consulta;
- persistir cópias de nome, documento, nome profissional ou área jurídica no Intake;
- corrigir nesta entrega a divergência histórica do status técnico `registered`;
- criar uma nova biblioteca de tabela, busca, estado de URL ou data.

## Contract

### Requisitos

| REQ | Requisito | Origem |
|---|---|---|
| REQ-01 | A rota autenticada `/intakes` deve exibir uma tabela paginada de dados reais, com uma linha por Intake. | PRD REQ-001; SCRUM-133 |
| REQ-02 | A tabela deve exibir ID do Intake, data de registro, Cliente, Demanda, canal de contato, status e ações, sem coluna de próxima ação. | PRD REQ-001; SCRUM-133; design `rRdSU` |
| REQ-03 | A busca deve localizar por ID exibido, nome do Cliente ou CPF/CNPJ normalizado, sem pesquisar o texto integral da Demanda. | PRD REQ-002; SCRUM-133 |
| REQ-04 | O status deve ser filtrado por tabs e os filtros complementares devem abranger responsável, origem, canal de contato e período de registro. | PRD REQ-002; SCRUM-133; design `rRdSU` |
| REQ-05 | Busca e filtros devem ser combinados por interseção, persistidos na URL e removíveis individualmente ou em conjunto. | PRD REQ-002; SCRUM-133 |
| REQ-06 | A consulta deve ser paginada, ordenada por registro mais recente e retornar contagens coerentes para `Todos` e para cada status do PRD. | SCRUM-133; design `rRdSU` |
| REQ-07 | A listagem deve expor somente projeções mínimas: documento mascarado na resposta e na tela, sem persistir dados de outros módulos em Intake. Qualquer usuário autenticado pode acessar a rota e o endpoint; usuários sem sessão recebem `401`/redirect. | SCRUM-133; Modules; decisão do usuário |
| REQ-08 | O ID exibido deve ser distinguível e copiável; a linha e a ação `Ver detalhes` devem abrir `/intakes/$intakeId` sem que o gesto de copiar dispare navegação. | PRD REQ-001; SCRUM-133; design `rRdSU` |
| REQ-09 | A página deve oferecer `Novo Intake` e estados distintos de carregamento, vazio inicial, vazio filtrado, erro recuperável e sucesso. | PRD REQ-001; SCRUM-133 |
| REQ-10 | Tabs, filtros, tabela, cópia, paginação e navegação devem ser operáveis por teclado, comunicar estado além da cor e preservar ID, Cliente e status em viewport reduzida. | PRD 4.5 e 4.6; Design System |
| REQ-11 | O servidor deve normalizar e validar a consulta, exigir autenticação e impedir que parâmetros inválidos causem falha ou ampliem a exposição de dados. | PRD 3.19 e 4.4; Architecture; REST Rules |
| REQ-12 | A solução deve manter as fronteiras: Intake conserva somente referências; cada módulo lê apenas suas próprias tabelas por um port público read-only; uma query de aplicação compõe os resultados por IDs, sem join entre tabelas internas, import cruzado de models/repositories ou persistência duplicada. | Modules; Architecture; Database Rules; SCRUM-133 |

### Critérios de aceitação

| CA | REQ | Dado | Quando | Então | Evidência esperada |
|---|---|---|---|---|---|
| CA-01 | REQ-01 | usuário autenticado e Intakes persistidos | acessa `/intakes` | visualiza uma tabela com uma linha por Intake e paginação derivada do servidor | teste de widget + integração de rota + navegador real |
| CA-02 | REQ-02 | uma página com Intakes distintos | a tabela é renderizada | aparecem ID, registro, Cliente, Demanda, canal, status e ações; não aparece próxima ação | teste de widget + snapshot de acessibilidade |
| CA-03 | REQ-03 | Intakes de Clientes e IDs distintos | pesquisa separadamente por ID exibido, nome ou CPF/CNPJ com e sem pontuação | somente os registros correspondentes são retornados e o texto da Demanda não é usado como critério | teste dos use cases/repositories + integração REST + browser integration |
| CA-04 | REQ-04 | Intakes distribuídos pelos estados válidos | seleciona cada tab | a URL, a requisição e a tabela refletem exatamente o status selecionado, com indicador textual/semântico ativo | teste de hook + integração de rota |
| CA-05 | REQ-04, REQ-05 | filtros complementares disponíveis | combina responsável, origem, canal e intervalo de calendário | o servidor aplica a interseção, a URL preserva os valores e a página volta para 1 | teste de hook + integração REST + integração de rota |
| CA-06 | REQ-05 | dois ou mais filtros ativos | remove um chip ou aciona `Limpar filtros` | o filtro individual some sem afetar os demais, ou todos os opcionais são removidos; status volta a `Todos` somente ao limpar tudo | teste de widget/hook + integração de rota |
| CA-07 | REQ-06 | mais de uma página de resultados | navega entre páginas ou altera um filtro | recebe no máximo `pageSize`, mantém ordenação por `createdAt DESC, sequenceNumber DESC` e recalcula a página sem duplicar linhas | teste dos use cases/repositories + integração REST |
| CA-08 | REQ-06 | busca e filtros complementares aplicados | observa as tabs | `Todos` e as contagens por status consideram os mesmos critérios, ignorando apenas a tab ativa | teste dos readers + teste de widget |
| CA-09 | REQ-07, REQ-11 | um Intake ligado a Cliente com CPF/CNPJ | consulta a listagem autenticada e inspeciona resposta/tela | recebe nome autorizado e documento mascarado; contato e documento integral não são expostos | integração REST + inspeção de rede no navegador |
| CA-10 | REQ-08 | uma linha carregada | aciona copiar ID | o clipboard recebe o ID exibido e permanece na listagem com confirmação acessível | teste de widget + navegador |
| CA-11 | REQ-08 | uma linha carregada | clica na linha, ativa por teclado o link principal ou escolhe `Ver detalhes` | navega para `/intakes/$intakeId`; a rota autenticada consulta o Intake correspondente sem exigir a ficha completa | teste de widget + integração de rota |
| CA-12 | REQ-09 | página sem busca ou filtros | o servidor retorna zero itens | exibe vazio inicial orientado à ação `Novo Intake` | teste de widget + integração de rota |
| CA-13 | REQ-09 | busca ou filtro ativo | o servidor retorna zero itens | exibe vazio filtrado com ação para limpar critérios, sem sugerir cadastro indevido | teste de widget + integração de rota |
| CA-14 | REQ-09 | a requisição falha | a página recebe o erro | exibe mensagem acionável e `Tentar novamente`; uma nova resposta bem-sucedida substitui o erro pela tabela | teste de widget + integração de rota |
| CA-15 | REQ-09 | a requisição está pendente | a página aguarda a resposta | exibe skeleton compatível com a tabela sem anunciar estado vazio | teste de widget |
| CA-16 | REQ-10 | viewport reduzida e somente teclado | percorre busca, tabs, filtros, tabela, cópia e paginação | todos os controles têm nome/foco visível e a tabela preserva acesso a ID, Cliente e status por reflow ou rolagem horizontal | browser integration + navegador real |
| CA-17 | REQ-07, REQ-11 | usuário sem sessão ou usuário autenticado com qualquer perfil | acessa `/intakes`, o detalhe ou o endpoint de listagem | sem sessão recebe `401`/redirect; qualquer usuário autenticado recebe os dados mascarados | integração de rota + integração REST |
| CA-18 | REQ-11 | query com status/data/página inválidos ou `pageSize` acima do limite | consulta a rota ou o endpoint | valores inválidos caem em defaults determinísticos e `pageSize` fica entre 1 e 100 | teste de rota + use case + integração REST |
| CA-19 | REQ-12 | implementação integrada | revisa dependências e imports | nenhum agregado ou repositório de Intake passa a possuir dados internos de Identidade ou Catálogo Jurídico | revisão arquitetural + Judge Implementation |
| CA-20 | REQ-01 a REQ-12 | entrega integrada | executa os sensores aplicáveis | format, lint, typecheck, testes unitários, integração REST e browser integration passam; o build final passa no CI | logs dos sensores + CI em `evaluation.md` |

## Semântica da consulta

### Parâmetros públicos

| Parâmetro | Tipo e default | Regra |
|---|---|---|
| `search` | string opcional | trim; comparação sem diferenciar caixa; aceita `INT-0142`, `142`, nome e CPF/CNPJ com ou sem pontuação |
| `status` | um dos seis status do PRD, opcional | ausência significa `Todos`; `registered` e valores desconhecidos são removidos pela validação da rota e normalizados no servidor |
| `responsibleId` | UUID opcional | filtra pela referência do responsável |
| `origin` | `IntakeOrigin` opcional | filtra pela origem existente no domínio |
| `contactChannel` | `ContactChannel` opcional | filtra pelo canal existente no domínio |
| `registeredFrom` | `YYYY-MM-DD` opcional | inclui desde o início do dia em `America/Sao_Paulo` |
| `registeredTo` | `YYYY-MM-DD` opcional | inclui até o fim do dia em `America/Sao_Paulo`; intervalo invertido é descartado como par |
| `page` | inteiro positivo; `1` | mudar busca ou filtro redefine para `1` |
| `pageSize` | inteiro de 1 a 100; `20` | valores fora do intervalo são normalizados pelo servidor |

O endpoint canônico é `GET /intakes`. Ele retorna `PaginationResponse<IntakeListItem>`
e `statusCounts` com a forma `{ all, byStatus, compatibility }`. `byStatus` aceita
somente as seis chaves do PRD e `compatibility.registered` explicita o volume técnico
sem criar uma tab. Os itens aplicam a tab ativa; as contagens aplicam busca,
responsável, origem, canal e período, mas não o status, para que a pessoa possa avaliar
e alternar entre as tabs sem números contraditórios.

O ID visual é derivado do `sequenceNumber` como `INT-` seguido de no mínimo quatro
dígitos. A resposta mantém também o UUID `intakeId`, usado no endpoint individual e na
rota de detalhe. O formatter deve ter uma única implementação coberta por teste; a UI
não deve reconstruir protocolos de modos diferentes.

### Status `registered` existente

O PRD define seis estados do ciclo, mas o código atual ainda expõe `registered` e o
use case de cadastro permite criá-lo. Esta Spec não altera a regra de criação. Para
não ocultar registros existentes:

- `registered` participa de `Todos`, da paginação e da busca;
- uma linha nesse estado usa o rótulo compatível `Registrado`;
- não é criada uma tab dedicada, pois isso contrariaria o PRD;
- `status=registered` não faz parte do contrato público e é normalizado para `Todos`;
- `statusCounts.all` inclui esses registros, `byStatus` inclui somente os seis estados
  do PRD e `compatibility.registered` informa por que `all` pode ser maior que a soma
  de `byStatus`;
- a divergência deve ser registrada em `evaluation.md` e encaminhada para decisão de
  produto separada antes de remover ou migrar o status.

## Premissas e questões pendentes

### Premissas adotadas

- O acesso exige apenas autenticação. O perfil e o status do colaborador não
  restringem a leitura da fila operacional.
- As colunas extras `Área jurídica` e `Atendente` do frame `rRdSU` não entram nesta
  entrega porque o PRD e o ticket definem seis colunas funcionais. `Responsável`
  permanece como filtro, com opções mínimas fornecidas por Identidade.
- O texto da Demanda não participa da busca. O placeholder do design que menciona
  `demanda` perde precedência para o PRD e para o escopo explícito de `SCRUM-133`.
- O menu de linha desta entrega contém apenas `Ver detalhes`. `Editar`, `Encerrar sem
  contratação` e o item residual `Reenviar convite` do componente visual não fazem
  parte do Contract.
- A rota de detalhe criada aqui é somente um boundary navegável e autenticado. Sua
  ficha completa será especificada e entregue separadamente.

Risco aceito nesta revisão: compatibilidade temporária de `registered`. Ele fica
visível no contrato de resposta e na avaliação, sem autorizar uma nova tab nem alterar
o PRD.

### Questões pendentes

Nenhuma questão pendente bloqueia a abertura da Spec. As divergências conhecidas têm
tratamento compatível e risco explícito acima, sem alterar o PRD nesta entrega.

## Estado atual

- `apps/web/src/ui/intake/widgets/pages/intakes-page/index.tsx` renderiza somente
  título, descrição e `Novo Intake`.
- `/intakes` já está protegido por `requireAuthMiddleware` e usa `AppLayout`.
- a sidebar já aponta `Intakes`/`Meus intakes` para a rota canônica conforme o perfil
  temporariamente configurado no layout;
- `IntakeService` oferece cadastro, consulta individual, histórico por Cliente,
  transição e encerramento, mas não lista a fila operacional;
- `IntakesRepository` consulta por ID, número sequencial e Cliente, mas não possui
  paginação, busca global nem filtros;
- o servidor não possui `GET /intakes` de listagem;
- o agregado contém somente referências de Cliente, responsável e área jurídica, como
  exige a fronteira modular;
- não existe rota web `/intakes/$intakeId`;
- o frame `rRdSU` apresenta cabeçalho, busca, popover, tabs, tabela, menu de ações e
  paginação; alguns textos e itens residuais conflitam com as fontes superiores e
  foram resolvidos neste Contract.

## Solução técnica

### Core e ports de leitura

- Criar estruturas próprias e exportadas em arquivos separados para
  `IntakeListQuery`, `IntakeListItem`, `IntakeListResult` e projeções mínimas de
  Cliente e responsável.
- Criar `IntakeListReader` em `packages/core/src/intake/interfaces`; sua implementação
  consulta somente tabelas de Intake, recebe IDs de Cliente já resolvidos e retorna
  referências, campos do Intake, paginação e contagens.
- Criar em Identidade um port read-only específico para a composição: resolve IDs de
  Clientes por nome/CPF/CNPJ e lê, em lote, resumos mascarados de Clientes e nomes
  profissionais de responsáveis. Sua implementação consulta somente tabelas de
  Identidade e não conhece Intake.
- Manter o agregado `Intake` e os repositórios transacionais sem nomes, documentos ou
  labels pertencentes a outros módulos. Os ports de leitura são separados desses
  repositórios e não oferecem escrita.

### Servidor e REST

- Implementar cada reader dentro da infraestrutura de banco do módulo proprietário.
  Nenhuma implementação pode importar model, mapper ou repositório do outro módulo.
- Criar `ListIntakesUseCase` e `ListIntakeResponsiblesUseCase` em
  `packages/core/src/intake/use-cases/`. São casos de uso de aplicação sem regra
  de infraestrutura: normalizam a entrada, pedem à
  Identidade os `clientIds` correspondentes à parcela textual, pede ao Intake a página
  filtrada e hidrata os itens com duas leituras em lote por IDs. Não há N+1, join
  cruzado ou persistência de snapshot.
- Quando a busca puder ser simultaneamente um protocolo e texto de Cliente, o handler
  envia ambos os critérios ao reader de Intake com semântica OR dentro da busca e AND
  com os demais filtros. Um resultado de Clientes vazio não pode remover um Intake que
  corresponda pelo protocolo.
- Projetar somente os campos do Contract e mascarar CPF/CNPJ dentro da implementação
  de Identidade antes de cruzar o port. O documento normalizado pode participar do
  predicado de busca de Identidade, mas não do payload ou de logs.
- Criar `ListIntakesController` em `GET /intakes`, com AuthGuard, parâmetros Swagger,
  DTO de página e respostas `200` e `401` documentadas.
- Reutilizar a política de autenticação no endpoint individual acessado pelo boundary
  de detalhe.
- Registrar cada reader por token no módulo proprietário e injetar os ports públicos
  no use case; o controller instancia o use case uma vez, seguindo o padrão das
  actions REST.
- Atualizar `intakes.rest`, fixture do módulo e teste de controller com banco real.

### Web

- Estender o contrato e o adapter `IntakeService` com `listIntakes(query)` para
  `GET /intakes`.
- Declarar e validar os search params na rota TanStack; usar o padrão existente de
  estado de URL (`nuqs`) no hook da página, com um único contrato de parsing.
- Manter `index.tsx` como composição declarativa e colocar comportamento em
  `use-intakes-page.ts`; consultas ficam em hook semântico `use-intakes-query`.
- Separar cabeçalho, busca/filtros, tabs e tabela em widgets internos com props
  específicas. Reusar shadcn, `Anchor`, `Icon`, tokens do Design System e componentes
  compartilhados existentes.
- Truncar Demanda com acesso por teclado ao conteúdo completo e oferecer controle de
  cópia com nome acessível e feedback anunciado.
- Representar cada destino por um link semântico `Ver detalhes de INT-####`; o clique
  na linha pode delegar ao mesmo destino, mas não transforma `<tr>` em botão e não
  captura interações dos controles internos.
- Criar a rota dinâmica tipada e sincronizar `ROUTES` e `routeTree.gen.ts` pelo
  gerador, nunca por edição manual.
- Proteger o parent `/intakes` com `requireAuthMiddleware`; qualquer sessão autenticada
  pode renderizar e consultar a fila operacional.

## Plano de validação

### Sensores automatizados

1. `pnpm format`.
2. `pnpm --filter @hms/core lint` e `pnpm --filter @hms/core check-types`.
3. `pnpm --filter @hms/core test` para os contratos e use cases core afetados e
   `pnpm --filter server test` com integração
   dos readers.
4. `pnpm --filter server check:code` e `pnpm --filter server check:types`.
5. `pnpm --filter server test` com integração focada em
   `GET /intakes`, cobrindo busca, interseção, intervalo, contagens, paginação,
   ordenação, máscara e autenticação.
6. `pnpm --filter web generate-routes`.
7. `pnpm --filter web check:code` e `pnpm --filter web check:types`.
8. `pnpm --filter web test` com suites focadas da página, hooks e adapter.
9. `pnpm --filter web test:integration tests/routes/intake/intakes.index.test.tsx`
   como browser integration com transporte mockado e stateful.
10. `pnpm --filter web test:integration
    'tests/routes/intake/intakes.$intakeId.test.tsx'`, cobrindo proteção, parâmetro no
    endpoint, carregamento, erro e conteúdo mínimo do boundary.
11. Revisão arquitetural dos imports e das fronteiras dos ports e da query composta.

### Navegador real

Seguir o workflow autenticado obrigatório de `AGENTS.md`: verificar Docker, Auth e
health do servidor; iniciar server e web em sessões persistentes; autenticar com a
credencial seed conferida na fonte; validar `/intakes` com REST real; exercitar busca,
uma tab, combinação e limpeza de filtros, paginação, cópia e navegação ao detalhe.
Repetir um caminho por teclado e em viewport reduzida. Ao final, inspecionar console e
requisições de rede e classificar qualquer erro, 4xx/5xx, warning de hidratação ou
falha de refresh.

O build é validação final do artefato no CI, depois do Quality Gate. As evidências
reais, versões dos comandos, falhas conhecidas e o veredito do Judge Implementation
serão registradas em `evaluation.md`.

## Avaliação

Após a implementação e o julgamento, criar
[`evaluation.md`](./evaluation.md) com a matriz CA → evidência real, resultados dos
sensores, validação de navegador, revisão arquitetural, findings, Quality Gate e build
do CI. A Spec não duplica essas evidências.

## Alinhamento documental

- O Contract implementa somente `REQ-001` e `REQ-002` do PRD de Intake, além das
  restrições de permissões, privacidade, acessibilidade e responsividade aplicáveis.
- Nenhuma mudança no PRD, em `documentation/modules.md` ou em Architecture é exigida
  para esta entrega.
- A divergência `registered` não deve ser silenciosamente promovida a regra de
  produto. Sua decisão pertence a uma demanda separada com atualização do PRD, se
  necessário.
- A query composta é uma decisão específica desta feature. Sua adoção como
  convenção recorrente requer decisão do usuário e nova Rule.

## Amendments

| Revisão | Data | Alteração | Motivo |
|---|---|---|---|
| 1 | 2026-08-02 | Contract inicial para listagem, busca, filtros, paginação, projeção autorizada e navegação ao detalhe. | SCRUM-133 e PRD REQ-001/REQ-002 |
| 2 | 2026-08-02 | Restringe acesso a atendentes ativos, substitui join entre módulos por composição via ports públicos, fecha a semântica de `registered` e inclui teste próprio do detalhe. | Findings P0/P1 do Judge Spec |
| 3 | 2026-08-03 | Remove a restrição de perfil/status de atendente; `/intakes`, detalhe e endpoints passam a exigir somente autenticação. | Decisão explícita do usuário |
