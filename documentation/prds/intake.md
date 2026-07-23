# PRD — Módulo de Intake

---

## 1. Visão Geral

### 1.1 Objetivo do módulo

O módulo de Intake organiza o ciclo de entrada de uma nova demanda no escritório,
desde o primeiro registro do contato até a contratação ou o encerramento sem
contratação.

Seu objetivo é oferecer uma visão única, rastreável e operacional da jornada de
aquisição do cliente, sem assumir responsabilidades que pertencem aos módulos de
Identidade, Agendamento, Consulta, Produção Documental, Financeiro ou Gestão de
Casos.

O Intake deve permitir que a equipe:

- registre a demanda e o canal de contato;
- identifique ou cadastre o cliente relacionado;
- decida entre agendar uma consulta ou encerrar sem contratação;
- acompanhe o Intake por todo o seu ciclo de vida;
- registre a viabilidade e a formalização;
- conclua a jornada com contratação ou encerramento sem contratação;
- consulte o histórico completo de Intakes de um cliente.

### 1.2 Problema que resolve

Sem um módulo próprio, as informações que antecedem a contratação tendem a ficar
distribuídas entre mensagens, agenda, cadastro do cliente, anotações e documentos.
Isso dificulta saber:

- quais demandas estão em andamento;
- em que etapa cada demanda se encontra;
- quem é o cliente e qual foi o canal inicial de contato;
- se a consulta ocorreu;
- se a viabilidade foi registrada;
- se a formalização foi iniciada;
- por que uma oportunidade foi encerrada sem contratação;
- quantas vezes o mesmo cliente procurou o escritório e com quais demandas.

O Intake consolida esse histórico sem introduzir uma etapa intermediária de
qualificação. Cada Intake representa uma demanda concreta de um cliente e sua
evolução até um desfecho comercial.

### 1.3 Valor entregue

- Visibilidade operacional sobre todas as demandas de entrada.
- Histórico independente para cada contato relevante do cliente.
- Padronização do ciclo entre consulta, viabilidade, formalização e contratação.
- Redução de registros incompletos ou duplicados.
- Rastreabilidade das mudanças de status e dos encerramentos.
- Indicadores de conversão, tempo por etapa e motivos de perda.

### 1.4 Contexto do MVP

O MVP deve cobrir:

- listagem de Intakes em tabela;
- criação guiada em três etapas;
- criação efetiva somente ao finalizar a terceira etapa;
- vínculo obrigatório com um cliente;
- agendamento de consulta como caminho principal de abertura;
- encerramento sem contratação como caminho alternativo;
- acompanhamento do ciclo de vida completo;
- registro da viabilidade;
- início e acompanhamento da formalização;
- conclusão por contratação;
- encerramento sem contratação disponível durante toda a jornada ativa;
- histórico do Intake e histórico de Intakes no cadastro do cliente.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo de Intake

O módulo de Intake é responsável por:

- manter a identidade e o estado de cada Intake;
- registrar a demanda que motivou o contato;
- registrar canal de contato, origem e responsável operacional;
- referenciar o cliente relacionado;
- coordenar a criação do Intake com a reserva de uma consulta;
- refletir a realização da consulta no ciclo do Intake;
- registrar a decisão de viabilidade;
- controlar a passagem para formalização;
- refletir a contratação como desfecho terminal;
- permitir e registrar o encerramento sem contratação;
- manter a linha do tempo de eventos e mudanças de status;
- disponibilizar o histórico de Intakes por cliente;
- publicar eventos relevantes para outros módulos.

### 2.2 Responsabilidades de outros módulos

O Intake não deve duplicar responsabilidades de outros contextos:

- **Identidade:** cria e mantém o Cliente, seus documentos, contatos,
  consentimentos e regras de duplicidade.
- **Catálogo Jurídico:** fornece áreas, assuntos e classificações jurídicas
  utilizadas para contextualizar a demanda.
- **Agendamento:** controla disponibilidade, reserva, reagendamento e
  cancelamento de horários.
- **Consulta:** registra a realização da consulta, seu conteúdo jurídico,
  participantes, documentos e conclusão.
- **Produção Documental:** cria e mantém pacotes, versões e documentos usados na
  formalização.
- **Comunicação:** envia mensagens e registra entregas pelos canais suportados.
- **Financeiro:** controla propostas financeiras, contratos de honorários,
  cobranças e pagamentos.
- **Gestão de Casos:** assume a condução jurídica após a contratação, quando um
  caso for necessário.
- **Auditoria:** preserva eventos e evidências técnicas para conformidade.

### 2.3 Fronteira de orquestração

O Intake pode solicitar ações a outros módulos e reagir aos seus eventos, mas não
deve acessar nem alterar diretamente seus dados internos.

Exemplos:

- solicita ao Agendamento a reserva escolhida e armazena apenas sua referência;
- recebe da Consulta a confirmação de que o atendimento foi realizado;
- referencia documentos de formalização mantidos pela Produção Documental;
- recebe o sinal de contratação sem assumir a gestão financeira do contrato;
- solicita à Identidade a criação de um cliente sem manter uma cópia paralela do
  cadastro.

### 2.4 Conceitos centrais

#### Intake

Registro persistente da jornada de uma demanda de cliente até a contratação ou o
encerramento sem contratação.

Um Intake:

- possui identificador próprio e imutável;
- está vinculado a exatamente um Cliente;
- contém exatamente uma Demanda principal;
- possui um único status atual;
- mantém histórico de todas as mudanças relevantes;
- pode referenciar agendamento, consulta e formalização;
- termina como `Contratado` ou `Encerrado sem contratação`.

#### Demanda

Descrição do motivo pelo qual o cliente procurou o escritório. A Demanda pertence
ao Intake e não equivale a um Cliente, uma Consulta ou um Caso.

Ela deve permitir compreender o contexto inicial sem antecipar uma análise
jurídica conclusiva.

#### Cliente

Pessoa natural ou jurídica mantida pelo módulo de Identidade. Um Cliente pode
possuir vários Intakes ao longo do tempo, inclusive simultâneos, desde que cada um
represente uma demanda distinta.

#### Canal de contato

Meio pelo qual ocorreu o contato com o escritório, como WhatsApp, telefone,
e-mail ou atendimento presencial. O canal descreve onde o contato aconteceu.

#### Origem

Forma pela qual a demanda chegou ao escritório, como entrada direta, indicação ou
outra origem cadastrada. A origem descreve como o cliente chegou, enquanto o canal
descreve por onde ele se comunicou.

#### Registro temporário de criação

Estado de interface usado durante as três etapas do novo Intake. Ele não é um
Intake, não recebe identificador, não aparece em listagens e não integra o
histórico do cliente.

---

## 3. Requisitos

### 3.1 Listagem de Intakes

- [ ] **INT-001 — Exibir os Intakes em uma tabela operacional**

**Descrição:**

O módulo deve possuir uma tela de listagem em tabela, seguindo o padrão de tabelas
do produto. O Kanban não faz parte do MVP.

**Colunas obrigatórias:**

- ID do Intake;
- data de registro;
- cliente;
- demanda;
- canal de contato;
- status.

**Regras de negócio:**

- A coluna `Cliente` deve usar essa nomenclatura, e não `Pessoa`.
- A coluna `Demanda` deve apresentar um resumo legível, sem substituir o conteúdo
  completo do Intake.
- `Data de registro` corresponde ao momento da criação efetiva do Intake.
- A listagem não deve exibir uma coluna de próxima ação no MVP.
- Cada linha deve representar um único Intake, mesmo quando o cliente possuir
  outros Intakes.
- A seleção de uma linha deve abrir o detalhe daquele Intake.

**Regras de UI/UX:**

- A listagem deve ser acessível pelo item `Intake` na sidebar do perfil de
  atendente.
- O cabeçalho deve oferecer a ação primária `Novo Intake`.
- Cabeçalho, densidade, alinhamentos, paginação e estados da tabela devem seguir o
  padrão visual já adotado no produto.
- O ID deve ser facilmente copiável e visualmente distinguível.
- Status deve usar o componente padronizado de badge.
- Colunas textuais longas devem truncar com acesso ao conteúdo completo.
- Ações secundárias da linha devem ficar em menu contextual, quando necessárias.
- A tabela deve possuir estados de carregamento, vazio e erro.

### 3.2 Busca e filtros

- [ ] **INT-002 — Permitir localizar e segmentar Intakes**

**Descrição:**

A listagem deve oferecer busca textual, filtro principal por status e filtros
operacionais complementares.

**Regras de negócio:**

- A busca deve localizar por ID do Intake, nome do cliente e documento do cliente,
  respeitando permissões sobre dados pessoais.
- O filtro de status deve usar exatamente os estados válidos do ciclo de vida.
- Os filtros complementares do MVP são:
  - responsável;
  - origem;
  - canal de contato;
  - período da data de registro.
- Período deve usar seleção de calendário.
- A aplicação combinada dos filtros deve usar interseção entre os critérios.
- Filtros ativos devem ser removíveis individualmente e em conjunto.

**Regras de UI/UX:**

- O status deve ser apresentado como tabs, seguindo o padrão visual da antiga tela
  operacional de etapas.
- Cada tab deve exibir o nome do status e, quando disponível, sua contagem.
- O estado ativo não deve depender apenas de cor.
- Os demais filtros devem ficar em popover padronizado.
- O popover deve exibir ações claras para aplicar e limpar filtros.
- Nenhum filtro de próxima ação deve ser apresentado.

### 3.3 Início de um novo Intake

- [ ] **INT-003 — Conduzir a criação em três etapas sequenciais**

**Descrição:**

A criação deve ser conduzida pelas etapas:

1. Demanda;
2. Cliente;
3. Decisão.

**Regras de negócio:**

- As informações preenchidas antes da conclusão da terceira etapa são apenas
  estado temporário do formulário.
- Nenhuma entidade Intake deve ser criada ao avançar entre as etapas.
- Nenhum ID de Intake deve ser reservado ou exibido antes da finalização.
- O registro temporário não deve aparecer na listagem nem no histórico do Cliente.
- Voltar para uma etapa anterior deve preservar os dados temporários da sessão.
- Sair do fluxo com alterações deve solicitar confirmação para descartar os dados.
- Descartar o fluxo não deve gerar evento de Intake criado ou encerrado.

**Regras de UI/UX:**

- As etapas devem usar o componente compartilhado de tabs do fluxo de Intake.
- A tab atual, as tabs concluídas e as futuras devem possuir estados visualmente
  distintos.
- A distinção entre estados deve combinar texto, ícone ou forma, e não apenas cor.
- O usuário pode retornar a etapas concluídas.
- O avanço depende da validação da etapa atual.
- A ação principal deve usar o componente de botão do design system.

### 3.4 Etapa Demanda

- [ ] **INT-004 — Registrar o contexto inicial da demanda**

**Descrição:**

A primeira etapa deve coletar as informações necessárias para compreender o
contato inicial e encaminhar a demanda.

**Dados mínimos:**

- descrição ou resumo da demanda;
- canal de contato;
- origem;
- área ou assunto jurídico, quando já conhecido;
- responsável pelo Intake, quando a atribuição não for automática.

**Regras de negócio:**

- A descrição da demanda é obrigatória.
- O canal de contato é obrigatório.
- Área e assunto devem referenciar o Catálogo Jurídico, sem cópia independente.
- O texto da demanda não deve ser tratado como parecer ou conclusão jurídica.
- Dados sensíveis desnecessários não devem ser solicitados nesta etapa.
- O responsável inicial pode ser definido por regra operacional, desde que a
  atribuição fique visível e auditável.

**Regras de UI/UX:**

- O campo deve se chamar `Canal de contato`.
- A descrição da demanda deve oferecer espaço compatível com texto livre.
- Campos de catálogo devem utilizar seleção pesquisável quando o volume justificar.
- Erros devem ser apresentados junto ao campo correspondente.

### 3.5 Etapa Cliente

- [ ] **INT-005 — Vincular a demanda a um Cliente de Identidade**

**Descrição:**

A segunda etapa deve permitir localizar um Cliente existente ou cadastrar um novo
Cliente por meio do módulo de Identidade.

**Regras de negócio:**

- Todo Intake criado deve estar vinculado a exatamente um Cliente.
- A busca deve considerar os identificadores suportados pela Identidade.
- Um Cliente existente deve ser reutilizado; o Intake não deve criar uma cópia.
- A criação de um novo Cliente deve respeitar validação, duplicidade, contatos e
  consentimentos definidos por Identidade.
- Se a Identidade bloquear a criação por possível duplicidade, o usuário deve
  resolver o conflito antes de avançar.
- Um Cliente pode ter vários Intakes e o vínculo não deve sobrescrever os
  anteriores.
- A simples criação de um Cliente durante o fluxo não cria o Intake.

**Regras de UI/UX:**

- A interface deve deixar clara a escolha entre cliente existente e novo cliente.
- O cliente selecionado deve permanecer visível antes da decisão final.
- A tela deve informar quando o Cliente já possui outros Intakes, sem impedir a
  criação de uma demanda legitimamente distinta.

### 3.6 Etapa Decisão

- [ ] **INT-006 — Finalizar o fluxo por consulta ou encerramento**

**Descrição:**

A terceira etapa deve apresentar o resumo da Demanda e do Cliente e permitir uma
de duas decisões:

- agendar consulta;
- encerrar sem contratação.

**Regras de negócio:**

- A criação efetiva do Intake ocorre somente após a confirmação de uma das duas
  decisões.
- A requisição de finalização deve ser idempotente.
- Cliques repetidos, retentativas ou respostas tardias não podem criar Intakes
  duplicados.
- A finalização deve validar novamente os dados obrigatórios das três etapas.
- Após sucesso, o formulário temporário deve ser descartado.
- Após falha, os dados preenchidos devem permanecer disponíveis para correção ou
  nova tentativa.

**Regras de UI/UX:**

- O resumo deve permitir conferir demanda, cliente e dados de contato antes da
  confirmação.
- As duas decisões devem possuir hierarquia visual compatível com sua natureza.
- `Encerrar sem contratação` deve usar estilo destrutivo vermelho.
- A interface deve bloquear múltiplos envios enquanto a finalização estiver em
  andamento.

### 3.7 Criação com consulta agendada

- [ ] **INT-007 — Criar o Intake somente após a reserva da consulta**

**Descrição:**

Ao escolher agendar uma consulta, o usuário deve selecionar um horário válido no
módulo de Agendamento. O Intake nasce com o status `Consulta agendada`.

**Regras de negócio:**

- O Agendamento é responsável por validar disponibilidade e confirmar a reserva.
- O Intake deve armazenar a referência do agendamento, não uma cópia de sua agenda.
- O Intake só pode ser criado se a reserva for confirmada.
- Se a reserva falhar, nenhum Intake deve ser criado.
- A operação deve impedir que a mesma finalização crie mais de uma reserva ou mais
  de um Intake.
- O momento da criação deve definir a data de registro do Intake.
- Após sucesso, deve ser publicado o evento de Intake criado.

**Regras de UI/UX:**

- O usuário deve visualizar profissional, data, horário e modalidade antes de
  confirmar.
- Falhas de disponibilidade devem permitir a escolha de outro horário sem perder
  Demanda ou Cliente.
- Após sucesso, a interface deve abrir o detalhe do Intake criado.

### 3.8 Criação encerrada sem contratação

- [ ] **INT-008 — Registrar um Intake terminal sem agendamento**

**Descrição:**

Quando a decisão inicial for não prosseguir, o sistema deve criar o Intake já no
status `Encerrado sem contratação`, preservando a demanda e o desfecho no histórico
do Cliente.

**Regras de negócio:**

- O motivo do encerramento é obrigatório.
- Uma observação complementar pode ser informada.
- Nenhum agendamento deve ser criado.
- O registro deve armazenar autor, data e hora do encerramento.
- O Cliente e seu histórico devem permanecer ativos.
- O Intake encerrado deve aparecer na listagem e no histórico do Cliente.
- O encerramento não deve excluir Demanda, Cliente ou evidências anteriores.

**Regras de UI/UX:**

- A confirmação deve ocorrer em modal.
- O modal deve explicar que o Intake será criado e encerrado, enquanto o Cliente e
  o histórico serão preservados.
- O motivo deve ser selecionado antes de habilitar a confirmação.
- A ação final deve usar botão destrutivo vermelho.

### 3.9 Identificação do Intake

- [ ] **INT-009 — Gerar uma identidade estável para o Intake**

**Descrição:**

Cada Intake criado deve receber um identificador único, legível e imutável.

**Regras de negócio:**

- O identificador deve ser gerado pelo servidor.
- Não deve existir reaproveitamento de identificadores.
- O ID não deve conter dados pessoais do Cliente.
- O ID deve ser usado em busca, URLs, auditoria e integrações.
- Alterações de Cliente, Demanda ou status não podem alterar o ID.

### 3.10 Ciclo de vida

- [ ] **INT-010 — Controlar o Intake por estados explícitos**

**Status possíveis:**

- `Consulta agendada`;
- `Consulta realizada`;
- `Viabilidade registrada`;
- `Em Formalização`;
- `Contratado`;
- `Encerrado sem contratação`.

**Transições principais:**

| Estado de origem | Estado de destino | Gatilho |
| --- | --- | --- |
| Criação | Consulta agendada | Reserva de consulta confirmada |
| Criação | Encerrado sem contratação | Decisão de não prosseguir confirmada |
| Consulta agendada | Consulta realizada | Consulta concluída pelo módulo de Consulta |
| Consulta realizada | Viabilidade registrada | Viabilidade registrada por usuário autorizado |
| Viabilidade registrada | Em Formalização | Formalização iniciada explicitamente |
| Em Formalização | Contratado | Contratação confirmada |
| Qualquer estado não terminal | Encerrado sem contratação | Encerramento autorizado |

**Regras de negócio:**

- `Contratado` e `Encerrado sem contratação` são estados terminais.
- Transições devem ser validadas no servidor.
- Não são permitidos saltos, retrocessos ou alterações manuais fora das transições
  previstas.
- Cada transição deve armazenar estado anterior, estado novo, gatilho, autor e data.
- A ordem do ciclo deve ser exibida como referência, sem criar estados artificiais.
- Cancelamento, reagendamento ou não comparecimento não criam novos status de
  Intake no MVP.
- Após não comparecimento ou cancelamento, o Intake permanece em
  `Consulta agendada` até um reagendamento válido ou encerramento sem contratação.
- Eventos repetidos devem ser processados de forma idempotente.

### 3.11 Consulta realizada

- [ ] **INT-011 — Refletir a conclusão da Consulta no Intake**

**Descrição:**

O status deve mudar para `Consulta realizada` quando o módulo de Consulta concluir
o atendimento relacionado.

**Regras de negócio:**

- O Intake não conclui nem edita a Consulta diretamente.
- A transição depende de uma Consulta válida vinculada ao agendamento do Intake.
- O conteúdo jurídico da Consulta permanece no módulo de Consulta.
- A referência à Consulta deve ficar disponível no detalhe do Intake.
- Eventos duplicados de conclusão não podem repetir a transição.

### 3.12 Registro de viabilidade

- [ ] **INT-012 — Registrar a decisão sobre prosseguimento da demanda**

**Descrição:**

Após a consulta realizada, um usuário autorizado deve registrar a viabilidade da
demanda e a fundamentação operacional necessária para a continuidade.

**Regras de negócio:**

- A viabilidade só pode ser registrada após `Consulta realizada`.
- O registro deve identificar responsável, data e observação.
- A análise jurídica detalhada e documentos da Consulta devem permanecer no módulo
  de Consulta.
- Ao confirmar o prosseguimento, o Intake muda para `Viabilidade registrada`.
- Quando a decisão for não prosseguir, o Intake deve usar o fluxo de
  `Encerrado sem contratação`, com motivo obrigatório.
- A edição posterior da viabilidade deve manter histórico e não pode apagar a
  decisão anterior.

**Regras de UI/UX:**

- A ação deve estar disponível apenas quando aplicável ao status atual.
- A tela deve diferenciar claramente registrar viabilidade de iniciar
  formalização.
- O conteúdo salvo deve exibir autoria e data.

### 3.13 Formalização

- [ ] **INT-013 — Acompanhar a formalização da contratação**

**Descrição:**

Após a viabilidade, o Intake deve permitir iniciar a formalização e acompanhar sua
conclusão sem incorporar a gestão interna de documentos, assinatura ou cobrança.

**Regras de negócio:**

- A formalização só pode começar em `Viabilidade registrada`.
- O início deve ser uma ação explícita e auditável.
- Ao iniciar, o status muda para `Em Formalização`.
- O Intake pode referenciar pacote documental, proposta, contrato ou outros
  registros mantidos pelos módulos responsáveis.
- A ausência de um documento obrigatório deve impedir a confirmação da contratação,
  conforme regras do módulo responsável.
- A formalização pode ser encerrada sem contratação a qualquer momento antes da
  contratação.

### 3.14 Contratação

- [ ] **INT-014 — Concluir o Intake como contratado**

**Descrição:**

Quando os requisitos de formalização forem concluídos, o Intake deve mudar para
`Contratado`.

**Regras de negócio:**

- A contratação só pode ser confirmada a partir de `Em Formalização`.
- O sinal de conclusão deve vir do fluxo ou módulo responsável pela formalização.
- A transição deve registrar autor, data e referências relevantes.
- `Contratado` é terminal e não permite `Encerrar sem contratação`.
- A contratação não cria implicitamente um Caso quando o tipo de serviço não o
  exigir.
- Quando um Caso for necessário, sua criação deve ocorrer em Gestão de Casos por
  comando ou evento explícito.

### 3.15 Encerramento sem contratação durante a jornada

- [ ] **INT-015 — Manter a ação de encerramento disponível em estados ativos**

**Descrição:**

O detalhe do Intake deve oferecer a ação `Encerrar sem contratação` em qualquer
estado não terminal.

**Regras de negócio:**

- A ação deve estar disponível em:
  - `Consulta agendada`;
  - `Consulta realizada`;
  - `Viabilidade registrada`;
  - `Em Formalização`.
- A ação não deve estar disponível em `Contratado` ou
  `Encerrado sem contratação`.
- O motivo é obrigatório.
- Observação complementar pode ser informada.
- O encerramento deve armazenar autor, data, status anterior e motivo.
- O encerramento deve cancelar ou encerrar pendências relacionadas por meio de
  comandos aos módulos responsáveis, sem apagar seus históricos.
- A operação deve ser idempotente.
- O Cliente deve permanecer ativo e acessível.

**Regras de UI/UX:**

- O rótulo deve ser sempre `Encerrar sem contratação`.
- A ação deve permanecer acessível no detalhe do Intake sem depender da rolagem até
  o final do conteúdo.
- O botão deve usar a variante destrutiva vermelha do design system.
- O encerramento nunca deve ocorrer imediatamente no primeiro clique.
- A confirmação deve ocorrer em modal com motivo obrigatório.

### 3.16 Padrão do modal de encerramento

- [ ] **INT-016 — Confirmar ações destrutivas com o modal padronizado**

**Descrição:**

O encerramento deve usar o mesmo padrão visual dos demais modais do produto.

**Regras de UI/UX:**

- O modal deve conter:
  - título e descrição no cabeçalho;
  - botão circular de fechar;
  - divisores entre cabeçalho, conteúdo e rodapé;
  - campo obrigatório de motivo;
  - observação opcional, quando aplicável;
  - ação de cancelar;
  - ação destrutiva de confirmação.
- O modal deve utilizar raio, borda, sombra e backdrop definidos pelo design
  system.
- O foco inicial deve estar no primeiro campo necessário, não na ação destrutiva.
- Fechamento por teclado e navegação de foco devem ser acessíveis.
- O texto deve informar que Cliente e histórico serão preservados.
- Erros devem manter o modal aberto e preservar os dados informados.

### 3.17 Detalhe e histórico do Intake

- [ ] **INT-017 — Exibir o contexto e a evolução do Intake**

**Descrição:**

O detalhe deve consolidar as informações necessárias para compreender e operar o
Intake em seu status atual.

**Conteúdo mínimo:**

- ID e data de registro;
- status atual;
- Cliente vinculado;
- Demanda;
- canal de contato e origem;
- responsável;
- referências de agendamento e consulta;
- viabilidade, quando registrada;
- formalização, quando iniciada;
- motivo de encerramento, quando aplicável;
- linha do tempo de eventos.

**Regras de negócio:**

- Dados pertencentes a outros módulos devem ser exibidos por referência.
- A linha do tempo deve ser cronológica e imutável para o usuário comum.
- Cada evento deve identificar tipo, autor e data.
- Correções devem adicionar histórico, e não reescrever silenciosamente eventos.
- Ações disponíveis devem depender do status e das permissões.

**Regras de UI/UX:**

- ID, Cliente e status devem permanecer no primeiro nível da hierarquia visual.
- A próxima ação válida pode ser destacada como comando, mas não deve virar uma
  coluna ou um novo status.
- `Encerrar sem contratação` deve permanecer visível como ação destrutiva nos
  estados ativos.
- Estados terminais devem exibir claramente o desfecho e sua data.

### 3.18 Histórico de Intakes do Cliente

- [ ] **INT-018 — Exibir todos os Intakes vinculados ao Cliente**

**Descrição:**

O cadastro do Cliente deve apresentar seu histórico de Intakes, permitindo abrir
cada registro sem misturar suas demandas.

**Regras de negócio:**

- O histórico deve incluir Intakes ativos e terminais.
- Um Intake encerrado não pode ser removido do histórico.
- Cada item deve mostrar, no mínimo, ID, data de registro, resumo da demanda,
  status e responsável.
- A visualização deve respeitar as permissões do usuário sobre o Cliente e o Intake.
- A consulta do histórico não deve transferir sua propriedade para Identidade;
  Identidade apenas apresenta referências fornecidas pelo Intake.

### 3.19 Permissões

- [ ] **INT-019 — Restringir operações conforme função e contexto**

**Regras de negócio:**

- Usuários de atendimento autorizados podem iniciar o fluxo, vincular Cliente e
  agendar Consulta.
- O registro de viabilidade deve ser restrito a perfis autorizados para a decisão.
- O início da formalização e a confirmação da contratação devem respeitar as
  permissões dos processos relacionados.
- O encerramento sem contratação deve exigir permissão explícita.
- A leitura de dados pessoais deve respeitar as permissões de Identidade.
- O servidor deve validar permissões em todas as operações; ocultar um botão não é
  controle suficiente.

### 3.20 Auditoria e eventos

- [ ] **INT-020 — Tornar as decisões do ciclo rastreáveis**

**Regras de negócio:**

- Devem ser auditados:
  - criação do Intake;
  - vínculo ou troca autorizada de responsável;
  - alterações relevantes na Demanda;
  - mudanças de status;
  - vínculo com agendamento e consulta;
  - registro ou revisão de viabilidade;
  - início da formalização;
  - contratação;
  - encerramento sem contratação;
  - tentativas rejeitadas por transição inválida.
- Eventos publicados devem conter identificadores e referências mínimas, evitando
  dados pessoais desnecessários.
- Consumidores devem poder processar eventos de forma idempotente.
- Falhas em integrações devem ser observáveis e passíveis de retentativa segura.

---

## 4. Regras Gerais

### 4.1 Integridade

- Não existe Intake persistente antes da finalização da terceira etapa.
- Todo Intake persistente possui ID, Cliente, Demanda, status e data de registro.
- Um Intake pertence a um único Cliente.
- Um Cliente pode possuir vários Intakes.
- Um Intake possui apenas um status atual.
- O histórico de status não pode ser apagado.
- Estados terminais não podem ser reabertos no MVP.

### 4.2 Linguagem do produto

- O módulo deve se chamar `Intake`.
- A entidade principal deve se chamar `Intake` no domínio e no código.
- O motivo do contato deve se chamar `Demanda` na interface.
- O cadastro relacionado deve se chamar `Cliente`, nunca `Pessoa` nas telas do
  Intake.
- O fluxo não deve introduzir nomenclaturas de etapas legadas.
- O desfecho negativo deve se chamar `Encerrado sem contratação`.

### 4.3 Concorrência e idempotência

- A finalização do novo Intake deve aceitar uma chave de idempotência.
- Mudanças de estado devem validar a versão atual do Intake.
- Duas ações concorrentes não podem produzir dois desfechos.
- Se a contratação e o encerramento forem solicitados simultaneamente, apenas a
  primeira transição válida pode ser confirmada; a outra deve falhar com o estado
  atual explícito.

### 4.4 Privacidade

- A listagem deve apresentar apenas os dados necessários à operação.
- Logs e eventos não devem expor documentos, contatos ou texto integral da Demanda
  sem necessidade.
- Exportações, quando existirem, devem respeitar permissões e auditoria.
- A exclusão ou anonimização de dados pessoais deve ser coordenada com Identidade e
  com as obrigações de retenção do histórico jurídico.

### 4.5 Acessibilidade

- Tabs, tabela, menus e modais devem ser operáveis por teclado.
- Estados e status não devem depender apenas de cor.
- Badges e ações destrutivas devem possuir contraste adequado.
- Campos devem ter rótulos programáticos e mensagens de erro associadas.
- O foco deve retornar ao elemento de origem ao fechar um modal.

### 4.6 Responsividade

- A experiência principal é orientada a desktop, sem impedir consulta em telas
  menores.
- Em viewport reduzida, a tabela pode usar rolagem horizontal preservando ID,
  Cliente e status como referências prioritárias.
- O fluxo de criação deve manter a ordem das etapas e ações principais acessíveis.

---

## 5. Fluxos de Usuário

### Fluxo — Criar Intake com consulta agendada

1. O usuário abre a listagem de Intakes.
2. Seleciona `Novo Intake`.
3. Preenche a etapa `Demanda`.
4. Avança para `Cliente`.
5. Localiza um Cliente existente ou cria um novo pela Identidade.
6. Avança para `Decisão`.
7. Confere o resumo e escolhe agendar uma consulta.
8. Seleciona um horário disponível.
9. Confirma a decisão.
10. O Agendamento confirma a reserva.
11. O sistema cria o Intake com ID e status `Consulta agendada`.
12. O detalhe do novo Intake é aberto.

### Fluxo — Criar Intake encerrado sem contratação

1. O usuário preenche `Demanda` e `Cliente`.
2. Na etapa `Decisão`, escolhe `Encerrar sem contratação`.
3. O sistema abre o modal de confirmação.
4. O usuário informa o motivo obrigatório.
5. Confirma a ação destrutiva.
6. O sistema cria o Intake com status `Encerrado sem contratação`.
7. O Intake passa a integrar a listagem e o histórico do Cliente.

### Fluxo — Abandonar a criação

1. O usuário inicia o fluxo e preenche informações.
2. Tenta sair antes de finalizar a terceira etapa.
3. O sistema solicita confirmação para descartar.
4. O usuário confirma.
5. Os dados temporários são descartados.
6. Nenhum Intake, ID ou evento de histórico é criado.

### Fluxo — Registrar consulta realizada

1. O Intake está em `Consulta agendada`.
2. O atendimento é concluído no módulo de Consulta.
3. A Consulta publica sua conclusão.
4. O Intake valida a referência e o estado atual.
5. O status muda para `Consulta realizada`.
6. A linha do tempo registra a transição.

### Fluxo — Registrar viabilidade e iniciar formalização

1. O Intake está em `Consulta realizada`.
2. Um usuário autorizado registra a viabilidade.
3. O Intake muda para `Viabilidade registrada`.
4. O usuário inicia a formalização.
5. O sistema registra a ação e muda o Intake para `Em Formalização`.
6. Referências de documentos e processos relacionados ficam disponíveis no
   detalhe.

### Fluxo — Concluir contratação

1. O Intake está em `Em Formalização`.
2. O fluxo responsável confirma o atendimento dos requisitos de contratação.
3. O Intake muda para `Contratado`.
4. A linha do tempo registra o desfecho.
5. A ação `Encerrar sem contratação` deixa de estar disponível.
6. Quando necessário, um fluxo separado cria o Caso em Gestão de Casos.

### Fluxo — Encerrar um Intake ativo sem contratação

1. O usuário abre um Intake em estado não terminal.
2. Seleciona o botão vermelho `Encerrar sem contratação`.
3. O sistema abre o modal padronizado.
4. O usuário informa o motivo e, opcionalmente, uma observação.
5. Confirma a ação destrutiva.
6. O sistema valida permissão e estado atual.
7. O Intake muda para `Encerrado sem contratação`.
8. Pendências relacionadas recebem os comandos de encerramento aplicáveis.
9. Cliente, Demanda e histórico permanecem disponíveis.

### Fluxo — Consultar Intakes de um Cliente

1. O usuário abre o detalhe do Cliente.
2. Acessa seu histórico de Intakes.
3. Visualiza demandas ativas e encerradas.
4. Seleciona um registro.
5. O sistema abre o detalhe do Intake escolhido.

---

## 6. Critérios de Aceite do MVP

### 6.1 Criação

- [ ] O fluxo possui as etapas `Demanda`, `Cliente` e `Decisão`.
- [ ] As tabs utilizam o componente compartilhado aprovado.
- [ ] Nenhum Intake é criado antes da confirmação da terceira etapa.
- [ ] Nenhum ID aparece antes da criação efetiva.
- [ ] Cancelar o fluxo não gera histórico de Intake.
- [ ] Todo Intake criado está vinculado a um Cliente.
- [ ] A finalização repetida não cria duplicidade.

### 6.2 Decisão inicial

- [ ] Agendar consulta cria o Intake em `Consulta agendada`.
- [ ] Falha na reserva não cria Intake.
- [ ] Encerrar sem contratação exige motivo.
- [ ] O encerramento inicial cria um Intake terminal e visível no histórico.

### 6.3 Listagem

- [ ] A visualização principal é uma tabela.
- [ ] A tabela contém ID, data de registro, Cliente, Demanda, canal de contato e
  status.
- [ ] Não existe coluna de próxima ação.
- [ ] O filtro de status usa tabs.
- [ ] Os status exibidos correspondem exatamente ao ciclo definido neste PRD.
- [ ] Os filtros complementares incluem responsável, origem, canal e período.
- [ ] O período usa calendário.

### 6.4 Ciclo de vida

- [ ] Apenas transições válidas são aceitas.
- [ ] A conclusão da Consulta muda o Intake para `Consulta realizada`.
- [ ] A viabilidade só pode ser registrada após a Consulta.
- [ ] A formalização só começa após a viabilidade.
- [ ] A contratação só ocorre durante a formalização.
- [ ] `Contratado` e `Encerrado sem contratação` são terminais.
- [ ] Todas as mudanças registram autoria e data.

### 6.5 Encerramento

- [ ] O botão `Encerrar sem contratação` está disponível em todos os estados não
  terminais.
- [ ] O botão usa variante destrutiva vermelha.
- [ ] O botão não está disponível em estados terminais.
- [ ] A ação sempre abre modal de confirmação.
- [ ] O modal segue o padrão visual definido para o produto.
- [ ] O motivo é obrigatório.
- [ ] O Cliente e o histórico permanecem após o encerramento.

### 6.6 Histórico

- [ ] O detalhe apresenta a linha do tempo do Intake.
- [ ] O Cliente apresenta todos os seus Intakes.
- [ ] Intakes encerrados permanecem consultáveis.
- [ ] Correções não removem eventos anteriores.

### 6.7 Segurança e confiabilidade

- [ ] Permissões são validadas no servidor.
- [ ] Operações críticas são idempotentes.
- [ ] Eventos não carregam dados pessoais desnecessários.
- [ ] Conflitos de concorrência não produzem dois estados terminais.

---

## 7. Indicadores de Produto e Operação

O módulo deve permitir medir:

- quantidade de Intakes criados por período;
- quantidade por canal de contato e origem;
- quantidade por responsável;
- distribuição por status;
- tempo médio entre criação e consulta realizada;
- tempo médio entre consulta e viabilidade;
- tempo médio em formalização;
- taxa de consultas realizadas sobre consultas agendadas;
- taxa de Intakes com viabilidade registrada;
- taxa de contratação;
- taxa de encerramento sem contratação;
- motivos mais frequentes de encerramento;
- conversão por canal, origem e área jurídica;
- quantidade média de Intakes por Cliente;
- idade dos Intakes ativos por etapa.

Os indicadores devem utilizar eventos e estados oficiais do domínio, não inferências
baseadas apenas na interface.

---

## 8. Relação com Outras Áreas do Produto

### 8.1 Identidade

- fornece o Cliente referenciado pelo Intake;
- valida duplicidade e dados cadastrais;
- apresenta o histórico de Intakes sem assumir sua propriedade.

### 8.2 Catálogo Jurídico

- fornece áreas e assuntos usados para classificar a Demanda;
- mantém a taxonomia jurídica centralizada.

### 8.3 Agendamento

- confirma a reserva necessária à criação com consulta;
- controla reagendamento e cancelamento;
- publica os eventos consumidos pelo Intake.

### 8.4 Consulta

- registra o atendimento jurídico;
- informa sua conclusão ao Intake;
- mantém conteúdo, participantes e documentos da Consulta.

### 8.5 Produção Documental

- fornece pacotes e documentos de formalização;
- mantém versões e aprovações documentais;
- entrega referências ao Intake.

### 8.6 Comunicação

- envia confirmações, lembretes e mensagens relacionadas;
- informa status de entrega sem alterar o ciclo do Intake diretamente.

### 8.7 Financeiro

- mantém valores, condições, cobranças e pagamentos;
- pode fornecer a confirmação necessária à contratação quando aplicável.

### 8.8 Gestão de Casos

- recebe a demanda contratada quando houver trabalho jurídico a executar;
- cria e mantém o Caso sem reutilizar o Intake como Caso.

### 8.9 Auditoria

- recebe eventos relevantes para rastreabilidade e conformidade;
- não substitui a linha do tempo operacional do Intake.

---

## 9. Fora do Escopo

- Visualização em Kanban.
- Etapa intermediária de qualificação anterior ao Intake.
- Qualificação automática de demanda.
- Pontuação de oportunidade ou lead scoring.
- Sugestão automática de próxima ação.
- Automação de decisões de viabilidade.
- Criação automática de Cliente sem validação da Identidade.
- Gestão completa de agenda e disponibilidade.
- Registro do conteúdo jurídico da Consulta.
- Edição e versionamento de documentos.
- Assinatura eletrônica implementada dentro do Intake.
- Cobrança ou conciliação financeira.
- Gestão da execução jurídica após contratação.
- Reabertura de estados terminais.
- Exclusão de Intakes encerrados.
- Mesclagem ou divisão de Intakes.
- Importação em massa de demandas.
- Persistência de rascunhos abandonados entre sessões no MVP.

---

## 10. Perguntas Pendentes

- Quais valores compõem os catálogos iniciais de canal de contato, origem e motivo
  de encerramento?
- Quais perfis podem registrar viabilidade, iniciar formalização, confirmar
  contratação e encerrar sem contratação?
- Qual evento ou conjunto de requisitos caracteriza a formalização como concluída?
- Um não comparecimento deve permanecer indefinidamente em `Consulta agendada` ou
  deve gerar uma política operacional de prazo para reagendamento ou encerramento?
- Haverá SLA por status e alertas para Intakes sem movimentação?
- Em quais tipos de contratação a criação de Caso deve ser sugerida ou automática?
