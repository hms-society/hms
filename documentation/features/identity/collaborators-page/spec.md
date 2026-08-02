---
title: Gestão e cadastro de colaboradores
status: completed
revision: 6
source:
  type: prd
  ref: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2228232
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2228232
jira_tickets:
  - SCRUM-132
plan: ./plan.md
evaluation: ./evaluation.md
scope:
  - packages/core/src/identity
  - packages/core/src/legal-catalog
  - packages/validation/src/identity
  - apps/server/src/identity
  - apps/server/src/legal-catalog
  - apps/server/rest-client/identity
  - apps/web/src/constants
  - apps/web/src/middlewares
  - apps/web/src/rest
  - apps/web/src/routes/colaboradores
  - apps/web/src/ui/identity
  - apps/web/src/ui/shared/widgets/layouts/app-layout
  - apps/server/src/shared/database/drizzle/migrations
  - documentation/modules.md
  - design/hms.pen
last_updated_at: 2026-07-31
---

# Contexto e objetivo

## Encerramento

Implementação aceita pelo Judge Implementation Final. O commit avaliado é
`16c2a3b4bec5dd6437a54ec40236382de2b3b0c4`, com Quality Gate e build do CI
verdes no PR [#19](https://github.com/hms-society/hms/pull/19). Evidências completas:
[`evaluation.md`](./evaluation.md).

O módulo de Identidade já representa contas, perfis e especialidades de
colaboradores no domínio, mas ainda não permite que um administrador consulte a
equipe, convide uma pessoa e persista seu vínculo profissional. Esta entrega cria
a página administrativa de colaboradores e o fluxo único de cadastro mais convite,
usando o Catálogo Jurídico como fonte das áreas e dos temas disponíveis.

A origem canônica desta Spec é a versão 2 da página Confluence `2228232`,
referenciada por `SCRUM-132` e atualizada em 29/07/2026 para o modelo de múltiplas
áreas. O tiny link `BIAC` presente no rascunho original resolve para a página
`163844`, versão anterior que ainda descreve apenas uma área por colaborador. Em
caso de divergência, prevalecem a página `2228232`, o ticket e a direção já
sincronizada em `documentation/design.md`.

Os frames aprovados no arquivo `design/hms.pen` são:

- `vuNXP`: listagem administrativa;
- `xtvMv`: modal de colaborador jurídico;
- `R1af6`: modal de colaborador administrativo.

## Objetivo

Permitir que um administrador ativo liste colaboradores e cadastre uma pessoa com
conta convidada, exatamente um perfil e, quando o perfil for jurídico, uma ou mais
áreas com seus respectivos temas, sem duplicidade nem associações inválidas.

# Escopo

## Incluído

- identificar o colaborador autenticado e seu perfil para compor a navegação;
- proteger no servidor a consulta e o cadastro para administradores ativos;
- listar colaboradores com busca, filtros, paginação e estados de carregamento,
  vazio e erro;
- exibir avatar circular com as iniciais e cor estável do colaborador na tabela;
- convidar por e-mail e cadastrar o colaborador no mesmo fluxo;
- oferecer uma tela pública dedicada em `/convite` para definir a senha do convite;
- consultar os detalhes do colaborador por `collaboratorId`;
- reativar contas desabilitadas, cancelar convites pendentes e remover convites
  cancelados por operações administrativas confirmadas;
- editar nome profissional, cargo, perfil e especialidades de um colaborador;
- persistir nome profissional, cargo/função opcional, perfil e especialidades;
- usar apenas áreas e temas ativos em novos cadastros;
- preservar referências históricas a áreas e temas que depois fiquem inativos;
- refletir o estado da conta como `Convidado`, `Ativo` ou `Desabilitado`;
- conectar o perfil real ao `AppLayout` e incluir a rota administrativa;
- validar domínio, integração REST, persistência e comportamento da página.

## Fora de escopo

- criar uma jornada visual própria para recuperação de senha; a definição de senha
  do convite usa a tela dedicada `/convite`, enquanto a recuperação continua em
  `/redefinir-senha`;
- criar ou editar áreas e temas pelo módulo de Identidade;
- ordenar, atribuir ou pesquisar colaboradores em agenda, consulta ou caso;
- implementar operações de outros módulos na ficha de detalhes; a edição possui
  Contract próprio em `changes/collaborator-profile-edit/spec.md`;
- atualizar automaticamente o status de `SCRUM-132`.

# Contract

## Requisitos funcionais

### RF-01 — Identificar e autorizar o administrador ativo

O sistema deve resolver o colaborador da sessão pela identidade do Supabase. A
listagem e o cadastro de colaboradores devem aceitar somente uma conta local
`active`, vinculada a um colaborador de perfil `admin`. A ausência de vínculo,
conta convidada ou desabilitada e qualquer outro perfil devem negar a operação sem
expor dados da equipe.

### RF-02 — Listar colaboradores

A página `Colaboradores` deve exibir nome profissional, e-mail da conta, perfil,
cargo/função opcional, estado da conta e último acesso. Deve oferecer busca por
nome ou e-mail, filtros por perfil, cargo/função e estado, limpeza dos filtros e
paginação. Busca e filtros são processados pelo servidor e preservados na URL da
página para navegação reproduzível.

Cada colaborador é identificado visualmente por um avatar circular com até duas
iniciais derivadas do nome profissional. A cor é escolhida de uma paleta dos
tokens do HMS por uma função determinística do identificador do colaborador,
evitando troca de cor entre renders sem exigir persistência de um campo visual no
domínio.

O e-mail é projetado da conta associada e não é duplicado no cadastro profissional.
O contador representa o total da consulta filtrada, não apenas os itens da página.

A query aceita `search?: string`, `profile?: CollaboratorProfile`,
`jobTitle?: string`, `status?: UserStatus`, `page?: number` e
`pageSize?: number`. `page` começa em 1 e usa 1 como default; `pageSize` usa 20
como default e aceita de 1 a 100. A ordenação é sempre por nome profissional
normalizado ascendente e, em empate, por `collaboratorId` ascendente. Busca remove
espaços periféricos e compara substring de nome ou e-mail sem diferença entre
maiúsculas e minúsculas. `jobTitle` remove espaços periféricos e compara o valor
completo sem diferença entre maiúsculas e minúsculas. Perfil e estado usam os
valores fechados de seus contratos. Busca e filtros são combinados por `AND`; a
busca interna entre nome e e-mail usa `OR`. Uma página válida além do total retorna
`items: []` com os metadados reais, sem alterar silenciosamente o número pedido.

A resposta contém `items`, `page`, `pageSize`, `total`, `totalPages` e
`availableJobTitles`. Os cargos disponíveis são valores distintos, não vazios e
ordenados, calculados para a equipe antes dos filtros da consulta, permitindo
compor o filtro sem carregar todos os colaboradores no navegador.

### RF-03 — Convidar e cadastrar no mesmo fluxo

O formulário deve exigir e-mail institucional válido, nome profissional não vazio
e exatamente um dos perfis `Administrador`, `Atendente`, `Advogado`, `Paralegal`
ou `Supervisor`. `Cargo/função` é opcional, conforme os frames aprovados.

Ao concluir, o servidor deve enviar o convite pelo Supabase Auth e persistir uma
conta local com estado `invited`, associada a exatamente um novo colaborador. O
mesmo e-mail, normalizado por trim e comparação sem diferença entre maiúsculas e
minúsculas, não pode originar duas contas. Uma conta não pode pertencer a dois
colaboradores. Sucesso só pode ser apresentado depois que convite e persistência
forem concluídos. O cadastro usa uma tentativa persistida e retomável, identificada
antes do efeito externo; falhas devem deixar o fluxo recuperável e não podem ser
apresentadas como sucesso.

Depois que a pessoa conclui a definição de senha pelo convite, o primeiro sign-in
por senha aceito pelo Auth transforma a conta local de `invited` para `active` e
registra `lastAccessAt` na mesma transação. Conta `disabled` continua rejeitada. Se
a transição local falhar, a sessão recém-criada é revogada e a conta permanece
`invited`, permitindo nova tentativa segura.

O redirect do convite aponta para `/convite`, que exibe a tela dedicada do frame
`DlEfU`. A recuperação de senha iniciada fora de um convite continua usando
`/redefinir-senha`. Sem sessão válida no link, `/convite` informa que o convite é
inválido ou expirou e bloqueia o envio.

### RF-04 — Validar especialidades jurídicas

Perfis `Advogado`, `Paralegal` e `Supervisor` devem informar pelo menos uma área.
Cada grupo contém uma área única e pelo menos um tema único pertencente àquela
área. Somente áreas e temas ativos do Catálogo Jurídico podem ser usados em um
novo cadastro.

O formulário inicia com um grupo `Área jurídica` + `Temas jurídicos`, permite
`Adicionar área de atuação`, impede repetir uma área e oferece temas pesquisáveis
com múltipla seleção. Cada tema selecionado aparece como chip removível; quando o
espaço acabar, os excedentes podem ser resumidos por `+N`. Trocar ou remover uma
área limpa somente os temas daquele grupo e não altera os demais.

### RF-05 — Impedir especialidades em perfis administrativos

Perfis `Administrador` e `Atendente` não exibem nem persistem áreas ou temas. Se o
perfil mudar de jurídico para administrativo antes da conclusão, o formulário
remove as especialidades em memória após explicar o descarte. O servidor rejeita
payload administrativo que contenha especialidades, mesmo que a validação visual
seja contornada.

### RF-06 — Preservar referências históricas do Catálogo Jurídico

As associações de um colaborador armazenam referências às entidades do Catálogo
Jurídico sem transferir a propriedade de áreas ou temas para Identidade. Tornar uma
área ou tema indisponível não remove associações existentes. A projeção de leitura
de colaboradores deve conseguir resolver também referências inativas, indicando
textualmente a indisponibilidade.

Como os frames desta entrega não apresentam especialidades na tabela e não existe
frame de detalhe ou edição, a evidência de leitura histórica nesta revisão é o
contrato REST e sua integração. A exposição visual detalhada fica para o Contract
de detalhe/edição.

Cada item de `GET /collaborators` inclui `legalExpertises`. Para um perfil
administrativo, o campo é ausente. Para um perfil jurídico, cada grupo contém
`legalArea: { id, name, active }` e
`legalTopics: Array<{ id, name, active }>`; assim a API mantém nomes e sinaliza
indisponibilidade sem exigir uma tela de detalhe nesta entrega.

### RF-07 — Comunicar estados e resultado da interface

A página e o modal devem implementar estados de carregamento, vazio, erro,
validação, envio e sucesso. Enquanto houver campo obrigatório inválido ou grupo
jurídico incompleto, `Criar colaborador` permanece indisponível. Após sucesso, o
modal fecha, a lista é atualizada e a interface informa que o convite está
pendente. Erros preservam os dados válidos digitados e mantêm foco associado ao
primeiro campo inválido ou ao resumo do erro.

### RF-08 — Manter navegação e acessibilidade consistentes

A rota canônica é `/colaboradores`, protegida por middleware/loader que consulta o
vínculo atual e exige conta local ativa com perfil administrador. Navegação direta
por outro perfil, conta convidada/desabilitada ou identidade sem vínculo redireciona
para uma rota interna segura ou para login, conforme a sessão, sem renderizar dados
administrativos. O item `Colaboradores` aparece somente na coleção de navegação do
perfil administrador.
O `AppLayout` deixa de usar o perfil temporário fixo e passa a selecionar a coleção
do colaborador autenticado.

A interface deve seguir os tokens do HMS, usar títulos serifados e controles em
sans, funcionar por teclado, manter foco visível, apresentar labels persistentes,
associar mensagens de erro aos campos e não depender apenas de cor para comunicar
estado. O comportamento deve permanecer utilizável com zoom, reflow e tema escuro.

### RF-09 — Reenviar convite pendente

Um administrador ativo pode solicitar o reenvio do convite de um colaborador com
status `invited`. O servidor valida novamente o status local, usa o
`AuthAdministrationProvider` para disparar um novo e-mail pelo Supabase e mantém
o status como `invited`. Colaboradores `active` ou `disabled` não podem receber
essa operação.

### RF-10 — Inativar colaborador

Um administrador ativo pode confirmar a inativação de um colaborador `active` ou
`invited`. A operação altera a conta local para `disabled`, preserva seus dados e
faz a listagem refletir o novo estado. A API é idempotente para uma conta já
`disabled`; reativação é definida no RF-12.

### RF-11 — Consultar detalhes

O menu de cada linha deve abrir `/colaboradores/:collaboratorId` por meio de
`Ver detalhes`, independentemente de o colaborador estar `active`, `invited` ou
`disabled`. A rota exige um administrador ativo e exibe a primeira aba de visão
geral com os dados do colaborador e suas especialidades projetadas.

### RF-12 — Administrar o ciclo do acesso

Um administrador ativo pode reativar uma conta `disabled` que já tenha acessado a
plataforma. Um convite `invited` pode ser cancelado; a conta passa a `disabled`
sem `lastAccessAt`, e o Auth não deve mais concluir o acesso local. Somente esse
estado de convite cancelado pode ser removido pelo menu. A remoção exclui a conta
Auth, a tentativa de cadastro, o colaborador e as associações locais, após
confirmação explícita.

## Critérios de aceitação

| CA | RF | Dado | Quando | Então | Evidência esperada |
|---|---|---|---|---|---|
| CA-01 | RF-01 | sessão de conta ativa vinculada a administrador | consulta a listagem ou envia cadastro | a operação é autorizada | teste de use case + integração REST |
| CA-02 | RF-01 | sessão ausente, convidada, desabilitada, sem colaborador ou com outro perfil | consulta ou cadastra | a API responde sem dados com `401` ou `403`, conforme autenticação | integração REST |
| CA-03 | RF-02 | colaboradores com dados distintos | abre `/colaboradores` | a tabela apresenta os campos do Contract, avatar com iniciais, total e primeira página | teste de widget + integração REST + navegador |
| CA-04 | RF-02 | busca, filtros ou página na URL | altera ou recarrega a consulta | servidor devolve somente o recorte esperado e a URL preserva o estado | testes de use case, serviço e rota + navegador |
| CA-05 | RF-02 | consulta sem resultados | conclui o carregamento | estado vazio explica o resultado e permite limpar filtros ou criar colaborador | teste de widget + navegador |
| CA-06 | RF-03 | e-mail novo, nome profissional e perfil válidos | confirma o cadastro | convite é enviado, conta `invited` e colaborador são persistidos uma vez | teste de use case + integração REST |
| CA-07 | RF-03 | e-mail equivalente a uma conta existente ou conta já vinculada | confirma o cadastro | operação é rejeitada sem criar segundo vínculo nem indicar sucesso | teste de use case + integração REST |
| CA-08 | RF-03 | falha do convite ou da persistência | cadastro é executado | a operação falha de forma observável e preserva uma tentativa segura para retry ou reconciliação | teste de use case/provider + integração |
| CA-09 | RF-04 | perfil jurídico e dois grupos válidos | confirma o cadastro | as duas áreas e os temas de cada grupo são persistidos sem mistura | teste de use case + integração REST |
| CA-10 | RF-04 | área repetida, tema repetido, tema de outra área, área/tema inativo ou grupo vazio | valida ou envia o formulário | conclusão é bloqueada no cliente e rejeitada no servidor | testes de schema, use case e widget |
| CA-11 | RF-04 | dois grupos preenchidos | troca ou remove a área de um grupo | somente os temas daquele grupo são descartados e a área fica disponível para nova seleção | teste de hook/widget + navegador |
| CA-12 | RF-05 | perfil administrativo | abre ou envia o modal | especialidades não aparecem nem são aceitas no payload | testes de widget, schema e use case |
| CA-13 | RF-05 | formulário jurídico preenchido | muda para perfil administrativo | interface explica e remove as especialidades antes da conclusão | teste de widget + navegador |
| CA-14 | RF-06 | colaborador associado a item depois inativado no catálogo | lista a projeção pela API | associação permanece e inclui nome e indicação de indisponibilidade | integração REST e banco |
| CA-15 | RF-07 | campos inválidos ou grupo incompleto | interage com o formulário | ação final fica indisponível e erros são associados aos campos | teste de widget + navegador |
| CA-16 | RF-07 | cadastro concluído | API retorna sucesso | modal fecha, consulta é invalidada e mensagem informa convite pendente | teste de widget + navegador |
| CA-17 | RF-07 | falha na listagem ou no cadastro | requisição termina | interface orienta nova tentativa sem perder dados válidos | teste de widget + navegador |
| CA-18 | RF-08 | colaborador autenticado de cada perfil | layout é carregado | sidebar usa a coleção do perfil real e só administrador vê `Colaboradores` | teste do app layout + integração de rota |
| CA-19 | RF-08 | usuário navega por teclado, com zoom/reflow ou tema escuro | usa página e modal | foco, labels, contraste, ordem e conteúdo permanecem compreensíveis | navegador + auditoria de acessibilidade |
| CA-20 | RF-08 | frames `vuNXP`, `xtvMv` e `R1af6` | valida a implementação | composição, hierarquia e estados correspondem aos frames, ressalvados os alinhamentos documentais desta Spec | comparação visual no navegador |
| CA-21 | RF-03 | convite externo existe para uma tentativa HMS cujo commit local falhou | repete o mesmo cadastro | a tentativa reconhece o usuário pelo marcador próprio, retoma o commit sem novo convite e conclui uma única conta e um único colaborador | teste de use case/provider + integração |
| CA-22 | RF-03 | e-mail já existe no Auth sem marcador da tentativa HMS | tenta cadastrar | a operação não adota nem remove a conta externa e retorna conflito para reconciliação operacional | teste de use case/provider + integração |
| CA-23 | RF-08 | sessão não administrativa, conta não ativa ou identidade sem vínculo | navega diretamente para `/colaboradores` | loader/middleware não renderiza a página e o servidor continua respondendo `403` aos endpoints administrativos | integração de rota + REST + navegador |
| CA-24 | RF-03 | pessoa convidada definiu a senha e a conta local está `invited` | realiza o primeiro sign-in válido | conta muda atomicamente para `active`, `lastAccessAt` é registrado e a sessão é devolvida | teste de use case + integração Auth/REST |
| CA-25 | RF-03 | transição local do primeiro sign-in falha | Auth devolve uma sessão | sessão é revogada, conta continua `invited` e uma nova tentativa pode concluir a ativação | teste de use case/provider + integração |
| CA-26 | RF-03 | conta externa apresenta marcador somente em metadata editável pelo usuário ou ID diferente do persistido | tentativa tenta retomar | a identidade não é adotada e a tentativa passa a reconciliação segura | teste de use case/provider |
| CA-27 | RF-09 | colaborador `invited` | administrador abre o menu `…` e confirma o reenvio | o Supabase dispara novo convite, a resposta mantém `invited` e a consulta é invalidada | teste de use case/provider + serviço REST + widget |
| CA-28 | RF-09 | colaborador `active` ou `disabled` | tenta reenviar convite por UI ou API | a ação não é oferecida ou a API responde conflito sem chamar o Auth administrativo | teste de use case + integração REST + widget |
| CA-29 | RF-10 | colaborador `active` ou `invited` | administrador abre o menu `…` e confirma a inativação | o acesso local muda para `disabled`, os dados são preservados e o modal fecha após sucesso | teste de use case + integração REST + widget |
| CA-30 | RF-10 | colaborador já `disabled` | a operação é repetida | a API retorna o resumo atual sem nova escrita; não há ação executável na UI | teste de use case + integração REST |
| CA-31 | RF-11 | colaborador em qualquer status | seleciona `Ver detalhes` | a rota `/:collaboratorId` abre a primeira aba com os dados atuais | teste de rota/widget + navegador |
| CA-32 | RF-12 | colaborador `disabled` com `lastAccessAt` | confirma reativação | o status muda para `active` e a lista é invalidada | teste de use case/REST/widget |
| CA-33 | RF-12 | colaborador `invited` | confirma cancelamento | o status muda para `disabled`, sem `lastAccessAt`, e o acesso local permanece bloqueado | teste de use case/REST/widget |
| CA-34 | RF-12 | convite cancelado | confirma remoção | Auth, tentativa, colaborador e associações locais são removidos | teste de use case/REST/widget |
| CA-31 | RF-09, RF-10 | requisição sem sessão ou sem administrador ativo | chama qualquer endpoint de ação | a API responde `401`/`403` sem executar efeito externo ou alteração local | integração REST |

## Restrições técnicas

- O servidor é a autoridade de autorização e de todas as invariantes; ocultar
  controles no navegador não substitui a validação.
- A chave administrativa/secret do Supabase permanece somente no servidor.
- Convites usam `supabase.auth.admin.inviteUserByEmail`; `redirectTo` deve estar na
  allowlist do projeto. Metadados do Supabase não são fonte de perfil ou permissão.
- Operações administrativas do Auth pertencem a `AuthAdministrationProvider`,
  disponível somente no servidor. O `AuthProvider` comum continua implementável
  pelos adapters server e web e não recebe métodos de service role.
- O comprovante de retomada usa `app_metadata`, gravado apenas pela API
  administrativa, e nunca confia em `user_metadata` editável pelo usuário. Quando
  `authUserId` já estiver persistido, a igualdade do ID também é obrigatória.
- O fluxo registra e associa os identificadores devolvidos pelo Auth sem expor a
  implementação do Supabase no domínio.
- Identidade não importa tabelas, mappers ou repositórios do Catálogo Jurídico.
- Referências a áreas e temas não possuem foreign key física entre módulos; sua
  validade é garantida pelo caso de uso e pelo provider publicado pelo Catálogo.
- Busca textual e unicidade de e-mail usam normalização consistente no domínio e
  índice case-insensitive no PostgreSQL.
- A listagem é paginada no servidor e não executa uma consulta remota ao Supabase
  por linha.
- Datas trafegam em ISO 8601 e são formatadas para exibição apenas no web app.

## Premissas confirmadas pelas fontes

- A página `2228232` substitui, para esta entrega, a modelagem de uma única área da
  página `163844`.
- `Cargo/função` é opcional e faz parte do ticket por estar presente nos três
  frames aprovados, embora não seja uma invariante do PRD.
- O primeiro administrador de produção continua sendo criado por processo
  operacional controlado; seeds e fixtures criam o vínculo necessário apenas em
  desenvolvimento e testes.
- Administradores podem editar colaboradores conforme o Contract desta revisão;
  o e-mail permanece imutável por ser a identidade da conta de autenticação.
- O PRD, o Jira e o código definem cinco perfis. A menção anterior a nove perfis
  em `documentation/modules.md` era uma divergência factual e foi sincronizada
  nesta revisão.
- Não há questões pendentes materiais para abrir esta Spec. A ausência de frames e
  critérios para detalhe, edição e desabilitação foi resolvida limitando o escopo.

# Rastreabilidade

| RF | PRD Confluence | Jira | Design/repositório |
|---|---|---|---|
| RF-01 | Cadastro de colaborador; Perfis e permissões gerais | SCRUM-132 — somente administradores ativos | `AuthGuard`, `CollaboratorProfile` |
| RF-02 | Cadastro de colaborador; Qualidade dos dados | SCRUM-132 — listagem `vuNXP` | frame `vuNXP` |
| RF-03 | Conta de acesso; Convite e primeiro acesso; Cadastro de colaborador | SCRUM-132 — convite e cadastro no mesmo fluxo | frames `xtvMv`, `R1af6`; Supabase Auth |
| RF-04 | Área e temas do profissional jurídico | SCRUM-132 — múltiplas áreas e temas | frame `xtvMv`; `documentation/design.md` |
| RF-05 | Perfis e permissões; Área e temas | SCRUM-132 — perfis administrativos sem especialidades | frame `R1af6` |
| RF-06 | Área e temas; relação com Catálogo Jurídico | SCRUM-132 — preservar associações históricas | módulos Identity e Legal Catalog |
| RF-07 | Regras de UI/UX do cadastro | SCRUM-132 — estados de carregamento, vazio, erro, validação e sucesso | frames `vuNXP`, `xtvMv`, `R1af6` |
| RF-08 | Linguagem e acessibilidade | SCRUM-132 — design system | `documentation/design.md` e frames Pencil |

# Estado atual

- `Collaborator`, `CollaboratorProfile` e `LegalExpertise` já modelam a distinção
  entre perfis administrativos e jurídicos e aceitam múltiplas áreas.
- `Collaborator` não possui `jobTitle`; não há criação/projeção específica para o
  cadastro desta feature.
- `users` persiste e-mail e estado, mas o repositório só oferece `addMany` e
  `removeAll`; não há unicidade explicitamente normalizada nem último acesso local.
- Não existem tabela, mapper, repositório, seeder, use cases ou endpoints de
  colaboradores.
- `AuthProvider` cria usuários com senha, mas não expõe convite administrativo nem
  compensação. `SignInUseCase` não consulta o estado local da conta.
- o web app autentica diretamente pelo `AuthProvider` do navegador e não consome o
  `SignInController`; portanto uma mudança isolada no use case atual do server não
  atualizaria a conta local.
- `AuthGuard` comprova a sessão e resolve o status da conta local; colaborador e
  perfil continuam sendo resolvidos pelos use cases/guards específicos.
- o Catálogo Jurídico oferece apenas listagens de itens ativos; falta uma porta
  interna capaz de validar seleções e resolver referências históricas por ID.
- o web app já possui serviços REST do Identity e Catálogo Jurídico, mas não possui
  página, rota, hooks ou serviço para colaboradores.
- `useAppLayout` ainda força `CollaboratorProfile.Attendant`, e a sidebar de admin
  não possui a rota de colaboradores.
- os frames usam `Nome completo` e `Inativo`; o PRD exige o conceito de nome
  profissional e os rótulos `Convidado`, `Ativo` e `Desabilitado`.

# Solução técnica

## Domínio e contratos compartilhados

1. Evoluir `Collaborator` para incluir `jobTitle?: string` e criar, em arquivos
   próprios, os contratos de criação, resumo/detalhe, filtros e paginação.
2. Criar `CollaboratorsRepository` com operações explícitas para consultar por
   usuário, verificar vínculo/e-mail, inserir o agregado completo e listar uma
   projeção paginada.
3. Ampliar `UsersRepository` com consultas por ID/e-mail e atualização explícita
   do último acesso/estado necessária à autorização e à listagem.
4. Criar `LegalExpertiseCatalogProvider` como porta consumida pelo Identity. A
   implementação pertence ao Catálogo Jurídico, consulta apenas seus próprios
   repositórios e oferece duas capacidades: validar itens ativos para criação e
   resolver nomes/estado por IDs incluindo itens inativos.
5. Criar `RegisterCollaboratorUseCase`, `ListCollaboratorsUseCase`,
   `GetCurrentCollaboratorUseCase` e `CompleteSignInUseCase`. Regras,
   normalização, autorização, ativação e compatibilidade perfil/especialidades
   permanecem nos use cases.
6. Criar `AuthAdministrationProvider`, separado de `AuthProvider`, com operações
   server-only para convidar, localizar usuário por e-mail, gravar
   `app_metadata`, banir/reativar identidades e revogar a sessão recém-criada. O
   marcador técnico da tentativa não usa metadata editável pelo usuário; perfil e
   autorização não usam metadata.
7. Criar schemas Zod compartilhados para corpo de cadastro e query da listagem,
   mantendo refinamentos equivalentes aos invariantes do use case.
8. Criar `CompleteSignInUseCase` para receber a identidade já autenticada pelo
   guard, rejeitar conta desabilitada, ativar atomicamente a conta convidada e
   atualizar `lastAccessAt` com `DatetimeProvider`. Se a conclusão local falhar, o
   endpoint nega a entrada e o web app encerra a sessão recém-criada.

## Persistência

Criar migration gerada pelo Drizzle para:

- adicionar `last_access_at` opcional a `users` e garantir unicidade de e-mail por
  `lower(btrim(email))`;
- criar `collaborators` com `id`, `user_id` único, `professional_name`,
  `job_title`, `profile`, timestamps e foreign key somente para `users`;
- criar `collaborator_legal_expertises` com chave própria, `collaborator_id` e
  `legal_area_id`, com unicidade por colaborador + área;
- criar `collaborator_legal_expertise_topics` com `expertise_id` e
  `legal_topic_id`, com unicidade por grupo + tema;
- criar `collaborator_registration_attempts` com `id`, e-mail normalizado único,
  hash do payload, `auth_user_id` opcional, estado, último erro e timestamps.

`legal_area_id` e `legal_topic_id` são referências UUID sem foreign key física
para tabelas de outro módulo. O repositório do Identity grava o agregado em uma
transação PostgreSQL e reconstrói a projeção por seus próprios modelos.

O seed de desenvolvimento e as fixtures passam a criar ao menos um colaborador
administrador ligado à conta administrativa. O provisionamento de produção segue
processo operacional externo aprovado; a migration não inventa perfil para contas
existentes e este repositório não armazena instruções ou credenciais de produção.

## Consistência e retomada do convite

O cadastro segue esta sequência:

1. normalizar e validar a entrada, perfil e especialidades ativas;
2. em transação curta, criar ou recuperar uma tentativa por e-mail normalizado,
   guardando o hash do payload antes de qualquer efeito externo;
3. se outra tentativa pendente tiver payload diferente, responder conflito; se o
   hash for igual, retomar a mesma tentativa;
4. convidar pelo Auth, obter o identificador externo e gravar
   `hmsInvitationAttemptId` em `app_metadata` pela API administrativa;
5. se o Auth informar e-mail existente, localizar o usuário: somente um usuário
   com o mesmo marcador server-only pode ser retomado e, quando a tentativa já
   possuir `authUserId`, o ID também deve coincidir. Marcador presente apenas em
   `user_metadata`, marcador divergente ou outro ID nunca autoriza adoção, remoção
   ou associação automática;
6. em uma transação, persistir `authUserId`, conta `invited`, colaborador e
   especialidades e
   marcar a tentativa `completed`;
7. se o commit local falhar após o convite, manter a tentativa `auth_invited`, o
   identificador externo quando disponível e o erro. Uma repetição com o mesmo
   payload localiza o usuário pelo marcador, não envia outro convite e repete o
   commit;
8. responder sucesso somente após `completed`.

Estados mínimos são `pending_auth`, `auth_invited`, `completed` e
`reconciliation_required`. O último estado é usado quando o Auth tem uma conta do
mesmo e-mail sem marcador server-only confiável, com ID divergente, ou quando o estado externo não pode ser
confirmado; ele bloqueia adoção/remoção automática e oferece diagnóstico
operacional sem expor detalhes ao usuário. Conflitos de unicidade continuam sendo
a última barreira contra concorrência. A tentativa concluída torna retries
idempotentes e retorna o colaborador já criado.

## Semântica de último acesso

`lastAccessAt` significa o instante em que a HMS concluiu um sign-in por senha e
validou que a conta local está ativa ou pode ser ativada por ser convidada e estar
vinculada a um colaborador. O
`CompleteSignInUseCase` recebe `UsersRepository`, `CollaboratorsRepository` e
`DatetimeProvider`: depois do Auth, rejeita conta desabilitada, valida o vínculo e,
em uma transação, muda `invited` para `active` quando necessário e grava o instante
do provider. Só então o endpoint confirma a conclusão para o navegador. Definir a
senha pelo convite não preenche esse campo isoladamente. Falha da escrita faz o
endpoint retornar erro e o navegador revogar a sessão recém-criada; portanto a
lista nunca apresenta como acesso concluído uma sessão que o HMS recusou. Testes
usam tempo fixo e cobrem conta ausente, primeiro acesso convidado, conta ativa,
desabilitada, sem vínculo, escrita falha e sucesso.

## Server e fronteiras de módulos

- separar a composição de autenticação/guards do restante do módulo de Identidade
  para que Catálogo Jurídico possa usar o guard sem criar dependência circular;
- o Catálogo Jurídico registra e exporta a implementação de
  `LegalExpertiseCatalogProvider`; Identity consome apenas a porta/token;
- criar `ActiveAdminGuard`, que resolve a sessão, a conta local ativa e o
  colaborador admin, anexando o contexto autorizado à requisição;
- criar o grupo `CollaboratorsController` e uma ação por controller:
  `GET /collaborators`, `GET /collaborators/me` e `POST /collaborators`;
- criar `POST /auth/complete-sign-in`, protegido pelo guard de sessão externa, para
  concluir ativação/registro de acesso antes que o web app navegue;
- documentar sucesso e erros esperados no Swagger e manter
  `apps/server/rest-client/identity/collaborators.rest` sincronizado;
- cobrir cada controller por integração HTTP real com Testcontainers, repositories,
  mappers e migrations reais.

`GET /collaborators/me` exige autenticação e retorna somente vínculo cuja conta
local esteja ativa; conta convidada/desabilitada ou identidade sem vínculo recebe
`403`. Os endpoints de listagem e criação também aplicam `ActiveAdminGuard`. A
listagem aceita `search`, `profile`, `jobTitle`, `status`, `page` e `pageSize`
validados.

## Web app

- adicionar `ROUTES.collaborators = '/colaboradores'`, arquivo de rota protegido e
  sincronizar `routeTree.gen.ts` apenas pelo gerador;
- criar `requireAdminMiddleware`/loader sobre o contrato do colaborador atual;
  sessão ausente redireciona a login e sessão sem autorização redireciona a uma
  rota interna segura sem montar a página;
- incluir `Colaboradores` somente em `SIDEBAR_ITEMS[Admin]` e fazer
  `useAppLayout` consumir uma query semântica do colaborador atual;
- ampliar `IdentityService` com listagem, colaborador atual, cadastro, reenvio de
  convite e inativação;
- fazer `useSignInAction` autenticar no provider do navegador e, antes de navegar,
  chamar `completeSignIn` com o Bearer atual; em qualquer falha, executar `signOut`,
  não montar área interna e apresentar o erro;
- criar hooks de query/action com chaves que incluam busca, filtros e página, além
  das mutações de reenvio e inativação;
- implementar a página, tabela, paginação e modal como widgets com hooks próprios;
- usar React Hook Form + Zod para o formulário, TanStack Query para requests e
  invalidação e os wrappers HMS `Anchor` e `Icon`;
- carregar áreas uma vez e temas por grupo/área com query key dependente; impedir
  requests sem área selecionada;
- usar os componentes shadcn existentes e tokens sem copiar primitives ou
  hardcodar cores, raios, sombras e fontes.

No alinhamento dos frames, usar `Nome profissional` no lugar de `Nome completo` e
`Desabilitado` no lugar de `Inativo`, pois o PRD é a fonte superior de vocabulário.
O título da ação final deve ser `Criar colaborador`, explicitando o resultado. O
menu de ações por linha usa o botão `…`; somente ações com Contract são
publicadas: reenvio para `invited` e inativação para `active`/`invited`.

## Segurança, privacidade e performance

- a API retorna apenas os dados necessários à gestão administrativa;
- mensagens de conflito não revelam dados adicionais de outra conta;
- status e perfil são sempre consultados localmente pelo servidor antes das ações
  administrativas;
- índices cobrem e-mail normalizado, vínculo por usuário e unicidade das
  associações; filtros/paginação não carregam toda a equipe em memória;
- consultas de catálogo para projeção devem ser agregadas por lote para evitar
  N+1;
- logs não incluem token, secret, link de convite ou payload pessoal completo.
- o navegador nunca recebe credenciais administrativas; dialogs apenas confirmam
  chamadas protegidas pelo servidor.

# Plano de validação

## Automatizada

1. `pnpm format` ao final da implementação integrada.
2. `pnpm lint`.
3. `pnpm check-types`.
4. `pnpm test`.
5. testes focados de schemas em `packages/validation`.
6. testes unitários dos use cases de Identity, incluindo autorização,
   normalização, concorrência, especialidades, retomada da saga e último acesso.
7. testes de integração dos controllers com PostgreSQL/Testcontainers e Supabase
   Auth local quando praticável; testes de contrato isolam somente as falhas
   externas que o serviço local não consegue produzir deterministicamente.
8. testes de serviço REST, hooks e widgets no web app.
9. `pnpm --filter web generate-routes` antes dos checks do web app.
10. `pnpm --filter server test:e2e` quando o ambiente de integração estiver
    disponível.

## Navegador

Validar com Playwright, em viewport desktop e estreita:

- acesso de administrador e negação para outro perfil;
- busca, cada filtro, limpeza, paginação e recarga com URL preservada;
- estados de carregamento, vazio e erro;
- modal administrativo e jurídico;
- múltiplas áreas, pesquisa de temas, chips, resumo `+N`, remoção e troca de área;
- bloqueio e mensagens para combinações inválidas;
- sucesso do convite/cadastro e atualização da tabela;
- abertura do menu `…`, disponibilidade condicional do reenvio, dialogs de reenvio
  e inativação e atualização de status após sucesso;
- navegação completa por teclado, foco, labels e mensagens;
- tema escuro, zoom/reflow e comparação visual com `vuNXP`, `xtvMv` e `R1af6`.

## CI

O Quality Gate repete lint, tipos e testes. O build de core, server e web é a
validação final no CI, depois do Quality Gate. Build local é recomendado porque a
entrega altera rotas, exports, migrations e composição de módulos.

# Avaliação

A avaliação formal, o histórico dos Judges, as evidências por critério, o
Quality Gate, o build e os findings remanescentes estão em
[`evaluation.md`](./evaluation.md). Esta Spec mantém o Contract, o status e a
rastreabilidade; permanece `in_progress` enquanto a avaliação final estiver
`failed`.

# Alinhamento documental

- PRD canônico: página Confluence `2228232`, versão 2.
- Ticket: `SCRUM-132`, preservado sem alteração de status.
- `documentation/modules.md` foi sincronizado de nove para os cinco perfis
  definidos no PRD, Jira, código e nesta Spec; o documento e
  `documentation/design.md` descrevem múltiplas áreas por colaborador. O link de
  requisito também aponta agora para a página canônica `2228232`.
- `design/hms.pen` precisa de sincronização futura de copy: `Nome completo` para
  `Nome profissional`, `Inativo` para `Desabilitado` e ação `Criar` para
  `Criar colaborador`. A Spec não altera o arquivo de design.
- o arquivo Pencil foi atualizado com o botão `…`, o menu `M6VHEL`, o modal de
  reenvio e o dialog de inativação `RRD4Z`; o código usa os mesmos estados e copy
  canônica, sem depender do arquivo `.pen` em runtime.
- o tiny link `BIAC` no rascunho original aponta para uma versão anterior do PRD e
  não deve substituir a página referenciada pelo ticket.
- não foi identificada lacuna recorrente sem mapeamento em
  `documentation/rules/rules.md`; o conjunto de regras selecionado cobre as
  camadas propostas.

# Amendments

- **2026-07-30 — revisão 3:** a listagem passou a exibir o componente
  `CollaboratorAvatar` do módulo Identity, com iniciais do nome e cor derivada de
  forma determinística do identificador, usando tokens visuais do HMS.

- **2026-07-30 — revisão 4:** a orquestração da página foi extraída para
  `use-collaborators-page.ts`; hooks de dados, ações e chaves de query permanecem
  dentro do widget da página. Filtros e paginação usam `nuqs` com o adapter do
  TanStack Router, e os handlers do hook seguem a declaração `function`.

- **2026-07-30 — revisão 2:** adicionada a mudança
  `changes/collaborator-access-actions/`, que torna implementáveis o reenvio de
  convites pendentes e a inativação idempotente; detalhes e edição continuam fora
  do escopo funcional, mas seus itens aparecem desabilitados no menu para manter
  a paridade com `M6VHEL`. A avaliação da mudança registra os sensores executados
  sem build local, conforme decisão da task.

- **2026-07-30 — revisão 5:** adicionada a mudança
  `changes/collaborator-invitation-page/`, estabelecendo `/convite` como tela
  pública dedicada para definição de senha de convites conforme `DlEfU`; a rota
  `/redefinir-senha` permanece exclusiva da recuperação de senha.

- **2026-07-30 — revisão 6:** adicionada a mudança
  `changes/collaborator-access-lifecycle/`, habilitando detalhes, reativação,
  cancelamento de convites e remoção exclusivamente de convites cancelados.
