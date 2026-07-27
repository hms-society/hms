# PRD — Módulo de Comunicação

---

## 1. Visão Geral

O módulo de **Comunicação** centraliza os atendimentos realizados com clientes por
e-mail e mantém a integração operacional do WhatsApp somente para mensagens
automáticas e recebimento de documentos. O atendimento humano pelo WhatsApp
ocorre no WhatsApp Web e não é espelhado na HMS.

O módulo distingue três conceitos: o atendimento representa o período de contato
ativo com um cliente; a conversa representa um canal usado durante esse
atendimento; e a mensagem representa cada conteúdo recebido ou enviado. Assim, um
um atendimento reúne as mensagens de uma thread de e-mail sem criar atendimentos
paralelos.

No MVP, a HMS não utiliza filas especializadas, presença on-line, notas internas,
aprovação de mensagens ou respostas geradas por inteligência artificial. A
distribuição também não atribui automaticamente um atendimento. O sistema apenas
notifica um atendente sugerido, enquanto o vínculo efetivo acontece quando alguém
assume o atendimento.

### Objetivo

Oferecer uma central única, simples e rastreável para que a equipe receba e
responda contatos, saiba quem está atendendo cada cliente, acompanhe mensagens
automáticas e preserve os documentos enviados para os fluxos responsáveis.

### Problema resolvido

Sem uma central de comunicação, mensagens e arquivos ficam distribuídos entre
aplicativos externos, caixas de e-mail e registros manuais. Isso dificulta saber:

- se o cliente já está sendo atendido;
- qual colaborador assumiu o contato;
- se uma resposta foi enviada ou entregue;
- se a mensagem foi manual ou automática;
- se os arquivos recebidos foram encaminhados para triagem;
- se o remetente já corresponde a um cliente cadastrado;
- quando um novo atendimento começou e quando foi encerrado.

### Valor entregue

- histórico centralizado de e-mail e registro das automações do WhatsApp;
- um único atendimento ativo por cliente;
- atribuição explícita e segura a um atendente;
- notificação interna para reduzir o tempo até o primeiro atendimento;
- identificação visual de mensagens manuais e automáticas;
- envio confiável de confirmações de marcação e reagendamento;
- recebimento de arquivos integrado ao Motor Documental;
- vínculo automático da conversa após o cadastro do cliente;
- rastreabilidade de envio, entrega, leitura e falha quando o canal informar esses
  estados;
- prevenção de mensagens duplicadas durante retentativas.

### Contexto do MVP

Um contato envia um e-mail para a HMS. Quando não existe um atendimento ativo
correspondente, a primeira mensagem recebida inicia um novo atendimento não
atribuído. O sistema registra a conversa, apresenta o atendimento na central e
cria uma notificação para um atendente sugerido. Mensagens e documentos recebidos
por WhatsApp seguem o webhook da Meta Cloud API e não iniciam atendimento humano.

A notificação não reserva nem atribui o atendimento. Qualquer atendente autorizado
pode abrir a central e assumir um atendimento ainda não atribuído. A primeira
confirmação válida vence; tentativas concorrentes posteriores recebem a informação
de que outro atendente já assumiu.

Depois de assumir, o atendente pode responder, receber arquivos, abrir um novo
Intake em outra guia e encerrar o atendimento. Se o remetente ainda não estiver
vinculado a um cliente, a criação ou atualização do cliente em Identidade publica
seus contatos e a Comunicação realiza o vínculo automaticamente.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- receber e-mails e documentos enviados por WhatsApp;
- registrar mensagens recebidas e enviadas em ordem cronológica;
- iniciar um atendimento a partir da primeira mensagem recebida do contato;
- manter no máximo um atendimento ativo para cada cliente;
- agrupar mensagens da mesma thread de e-mail dentro do atendimento;
- identificar conversas pelos contatos fornecidos por Identidade;
- manter atendimentos sem cliente vinculado enquanto o cadastro não existir;
- vincular automaticamente o atendimento após a criação ou atualização do
  cliente correspondente;
- permitir que um atendente assuma um atendimento não atribuído;
- impedir que dois atendentes assumam simultaneamente o mesmo atendimento;
- escolher um atendente para receber a notificação de novo atendimento;
- manter notificações internas persistentes para o atendente sugerido;
- permitir respostas manuais pelo atendente responsável em threads de e-mail;
- enviar mensagens automáticas fixas após eventos suportados;
- validar o consentimento ativo antes de qualquer envio;
- registrar os estados de entrega disponibilizados por cada canal;
- encaminhar os arquivos recebidos ao Motor Documental por evento;
- permitir o encerramento explícito do atendimento;
- publicar eventos relevantes para atualização da interface e integração com
  outros módulos.

### 2.2 Responsabilidades que pertencem a outros módulos

- **Identidade:** mantém o Cliente, seu telefone, e-mail e consentimentos por
  canal.
- **Intake:** registra e acompanha a demanda comercial ou jurídica originada no
  contato.
- **Agendamento:** marca, cancela e remarca compromissos.
- **Consulta:** mantém o conteúdo e o resultado da consulta jurídica.
- **Motor Documental:** cria o lote documental, identifica o cliente dos arquivos
  e controla a triagem.
- **Supabase Storage:** armazena os bytes dos arquivos recebidos.
- **Auditoria:** preserva o subconjunto de eventos com valor probatório ou
  regulatório.
- **Meta Cloud API:** envia mensagens automáticas e entrega webhooks de documentos
  recebidos pelo WhatsApp.
- **Resend:** realiza o envio de e-mails e informa os estados disponíveis.

A Comunicação não cria ou atualiza lotes documentais, não cadastra clientes, não
marca consultas e não cria Intakes diretamente.

### 2.3 Conceitos de negócio

#### Atendimento

Representa um período contínuo de contato operacional entre a HMS e um cliente ou
remetente ainda não identificado.

Um atendimento:

- começa somente por uma mensagem recebida do contato;
- pode existir temporariamente sem Cliente vinculado;
- contém uma ou mais threads de e-mail;
- pode possuir no máximo uma atribuição ativa;
- pode estar aguardando atendente, ativo, aguardando cliente ou encerrado;
- não equivale a Intake, Consulta ou Caso;
- não é reaberto depois de encerrado.

#### Conversa

Representa o histórico de uma thread de e-mail dentro do atendimento. Preserva
endereço, assunto e referências necessárias para manter a thread.

#### Mensagem

Representa um conteúdo recebido ou enviado. Pode conter texto, arquivos ou ambos.
Um envio contendo apenas arquivo também é uma mensagem válida.

Toda mensagem registra:

- direção de entrada ou saída;
- origem no cliente, atendente ou automação;
- canal;
- momento da ocorrência;
- arquivos relacionados;
- identificador externo, quando disponível;
- estado de entrega aplicável ao canal.

#### Atribuição de atendente

Representa o vínculo explícito entre um atendimento e o colaborador que o
assumiu. A notificação de novo atendimento não cria essa atribuição.

#### Notificação interna

Aviso persistente exibido dentro da HMS para informar a um atendente que existe um
novo atendimento aguardando alguém. A notificação é uma orientação operacional,
não uma reserva exclusiva.

#### Mensagem automática

Mensagem de conteúdo fixo enviada pela Comunicação em resposta a um evento de
outro módulo. Ela não passa por aprovação humana e deve ser visualmente diferente
de uma mensagem redigida pelo atendente.

#### Remetente não identificado

Contato de e-mail que ainda não corresponde a um Cliente de Identidade. O
atendimento pode ser assumido e visualizado, mas o vínculo com o cliente depende
do cadastro mantido por Identidade.

---

## 3. Requisitos

### Recebimento por WhatsApp

- [ ] **COM-001 — Registrar documentos recebidos pela Meta Cloud API**

**Descrição:** A Comunicação deve receber documentos enviados pelo WhatsApp por
meio do webhook da Meta Cloud API, sem criar uma conversa ou atendimento humano.

#### Regras de negócio

- Todo webhook válido deve preservar o identificador fornecido pela Meta.
- O mesmo identificador externo não pode criar duas ocorrências de documento.
- O telefone deve ser normalizado antes de localizar o Cliente.
- Somente documentos recebidos são encaminhados ao Motor Documental.
- Uma mensagem sem arquivo não inicia atendimento nem aparece na central.
- O horário informado pelo canal deve ser preservado separadamente do horário de
  processamento interno.
- O documento recebido deve ser registrado mesmo quando o remetente ainda não for
  um Cliente.
- O recebimento não depende de consentimento ativo, pois o contato foi iniciado
  pelo próprio remetente.

#### Regras de UI/UX

- A ocorrência deve ficar disponível para o Motor Documental sem depender da
  central de atendimento.
- O telefone deve identificar o remetente quando não houver Cliente vinculado.
- Os arquivos devem ser armazenados e encaminhados conforme as permissões.

### Recebimento por e-mail

- [ ] **COM-002 — Registrar e agrupar e-mails recebidos**

**Descrição:** A Comunicação deve receber e-mails e manter o encadeamento da
conversa por assunto e referências da thread.

#### Regras de negócio

- O identificador externo do e-mail deve impedir registros duplicados.
- Devem ser preservados remetente, destinatários necessários, assunto, data,
  corpo e anexos.
- Respostas pertencentes à mesma thread devem permanecer na mesma conversa.
- Um novo e-mail sem relação com uma thread existente pode iniciar outra conversa
  dentro do atendimento ativo.
- A ausência de texto não invalida um e-mail que contenha anexos.
- Conteúdo técnico desnecessário do transporte não deve ser exibido como parte da
  mensagem.
- O recebimento não depende de consentimento ativo.

#### Regras de UI/UX

- O assunto deve permanecer visível no cabeçalho da conversa.
- Cada mensagem deve mostrar remetente, destinatário relevante e horário.
- O corpo deve preservar parágrafos e quebras de linha de forma legível.
- Conteúdo citado de respostas anteriores deve ser recolhível quando possível,
  evitando repetição excessiva na thread.

### Início e continuidade do atendimento por e-mail

- [ ] **COM-003 — Iniciar atendimento somente por mensagem do contato**

**Descrição:** A primeira mensagem de e-mail recebida após a inexistência de
atendimento ativo deve iniciar um novo atendimento.

#### Regras de negócio

- Colaboradores não podem iniciar manualmente um atendimento no MVP.
- Mensagens automáticas não iniciam nem reabrem atendimentos.
- Se já existir atendimento ativo para o Cliente, a nova thread deve ser
  associada a esse atendimento.
- Se o Cliente ainda não estiver identificado, deve existir no máximo um
  atendimento ativo para o mesmo endereço de e-mail.
- Uma nova mensagem em atendimento encerrado deve iniciar outro atendimento.
- O novo atendimento deve começar como **Aguardando atendente**.
- O início deve registrar o endereço de e-mail e o momento da primeira mensagem.
- O sistema deve publicar o evento de atendimento iniciado somente depois da
  persistência bem-sucedida.

#### Regras de UI/UX

- O atendimento novo deve aparecer em **Não atribuídas**.
- A conversa deve deixar claro que ainda não existe atendente responsável.
- Não deve existir botão **Novo atendimento** na central.

### Atendimento ativo único

- [ ] **COM-004 — Manter um único atendimento ativo por Cliente**

**Descrição:** Um Cliente pode possuir vários Intakes ativos, mas não pode possuir
mais de um atendimento ativo na Comunicação.

#### Regras de negócio

- A restrição vale para o atendimento por e-mail.
- Requisições concorrentes não podem criar dois atendimentos ativos para o mesmo
  Cliente.
- O banco de dados deve garantir a unicidade além da validação da aplicação.
- Quando o vínculo posterior identificar que duas conversas pertencem ao mesmo
  Cliente, elas devem ser consolidadas no atendimento ativo válido.
- A interface não deve apresentar o banner **Cliente já possui outro atendimento
  ativo**; a duplicidade deve ser evitada ou resolvida pelo sistema.
- Atendimentos encerrados permanecem no histórico e não participam da restrição.

#### Regras de UI/UX

- A thread de e-mail deve aparecer como o canal do atendimento.
- O histórico encerrado deve permanecer consultável sem competir com a caixa
  operacional.

### Vínculo com o Cliente

- [ ] **COM-005 — Vincular automaticamente o atendimento pelos contatos de Identidade**

**Descrição:** A Comunicação deve relacionar o atendimento ao Cliente usando os
contatos publicados por Identidade.

#### Regras de negócio

- Identidade continua sendo a fonte oficial do telefone e do e-mail do Cliente.
- O telefone do Cliente é singular; não existe uma coleção de telefones no MVP.
- Uma correspondência exata de e-mail pode vincular a conversa de e-mail.
- A Comunicação deve reagir aos eventos de criação e atualização do Cliente.
- Ao receber um contato novo ou alterado, deve procurar atendimento ativo ainda
  não vinculado para aquele e-mail.
- O vínculo deve ocorrer automaticamente quando a correspondência for única.
- O cadastro do Cliente não cria nem encerra um atendimento.
- A Comunicação mantém apenas os dados de contato necessários à integração, sem
  substituir o cadastro de Identidade.

#### Regras de UI/UX

- Antes do vínculo, deve ser exibido o banner **Remetente ainda não vinculado a um
  cliente**.
- O banner deve orientar o atendente a criar um Intake para localizar ou cadastrar
  o Cliente.
- Depois do evento de Identidade, nome e dados permitidos do Cliente devem aparecer
  sem recarregamento manual.
- Não deve existir ação de vínculo documental dentro da conversa.

### Organização da Central de Comunicação

- [ ] **COM-006 — Oferecer uma caixa operacional sem filas especializadas**

**Descrição:** A central deve organizar os atendimentos por situação operacional,
sem o conceito de filas como Atendimento inicial, Consultas, Casos ou Documentos.

#### Regras de negócio

- As visões do MVP são:
  - **Minha caixa:** atendimentos atribuídos ao usuário e que possuem atividade a
    tratar;
  - **Não atribuídas:** atendimentos aguardando um responsável;
  - **Aguardando cliente:** atendimentos atribuídos cujo próximo avanço depende de
    resposta do contato;
  - **Encerradas:** histórico de atendimentos concluídos.
- Um atendimento deve aparecer em uma única visão operacional por vez.
- A existência de arquivos não move o atendimento para uma fila de Documentos.
- Remetente não identificado é uma condição exibida na conversa, não uma caixa.
- Falha de envio é estado da mensagem, não uma caixa.
- Aprovação de mensagem e **Requer ação** não fazem parte da navegação do MVP.

#### Regras de UI/UX

- A coluna esquerda deve mostrar as visões, suas contagens e a lista de conversas.
- Cada item deve exibir canal, Cliente ou contato, prévia, horário e indicador de
  não lida quando aplicável.
- A busca deve localizar por nome do Cliente, telefone, e-mail ou assunto.
- O botão isolado de filtros não deve ser apresentado no MVP.
- Não deve existir seção **Filas de atendimento**.
- A visão selecionada não deve depender somente de cor.

### Área da conversa de e-mail

- [ ] **COM-007 — Exibir o histórico e as ações do atendimento selecionado**

**Descrição:** A área central deve apresentar o contexto do contato, o histórico
de mensagens e as ações permitidas ao atendente.

#### Regras de negócio

- Mensagens devem ser ordenadas pelo momento da ocorrência.
- Separadores de data devem facilitar a leitura do histórico.
- O cabeçalho deve informar Cliente ou contato, e-mail e situação da atribuição.
- A conversa permanece visível em modo somente leitura quando estiver atribuída a
  outro atendente.
- Atendimentos encerrados não podem receber respostas manuais.

#### Regras de UI/UX

- O cabeçalho deve concentrar **Assumir atendimento**, **Novo Intake** e
  **Encerrar atendimento**, conforme o estado e a permissão.
- Ações principais não devem ficar escondidas em um menu de reticências.
- O composer deve ficar na parte inferior da conversa.
- A interface deve possuir estados de carregamento, vazio, erro e reconexão.
- O painel lateral de contexto do Cliente deve poder ser recolhido e reaberto.
- Recolher o painel deve aumentar a área disponível para leitura das mensagens.

### Assunção do atendimento

- [ ] **COM-008 — Permitir que um atendente assuma um atendimento livre**

**Descrição:** O responsável pelo atendimento deve ser definido por uma ação
explícita de um atendente autorizado.

#### Regras de negócio

- A notificação não atribui o atendimento.
- Somente colaborador ativo e autorizado pode assumir.
- Um atendimento pode possuir no máximo uma atribuição ativa.
- A primeira operação confirmada em concorrência deve vencer.
- Quem tentar assumir depois deve receber o erro de atendimento já atribuído.
- O atendente responsável pode responder e encerrar o atendimento.
- Outros atendentes podem visualizar o histórico, mas não responder.
- Não existe transferência ou redistribuição de atendimento no MVP.

#### Regras de UI/UX

- Atendimento livre deve apresentar a ação **Assumir atendimento**.
- Depois da confirmação, o cabeçalho deve mostrar **Atribuído a você** para o
  próprio responsável.
- Quando pertencer a outra pessoa, deve mostrar o nome do atendente responsável.
- O composer deve explicar **Assuma o atendimento para responder** quando ainda
  estiver livre.
- Em caso de concorrência, a interface deve atualizar o responsável sem perder o
  histórico aberto.

### Notificação do atendente sugerido

- [ ] **COM-009 — Notificar um atendente sem realizar atribuição automática**

**Descrição:** Quando um novo atendimento começar, o sistema deve escolher um
atendente elegível para receber uma notificação interna.

#### Regras de negócio

- A escolha deve considerar, nesta ordem:
  1. menor quantidade de atendimentos ativos;
  2. quem foi notificado há mais tempo, considerando quem nunca foi notificado
     primeiro;
  3. `collaboratorId` como desempate determinístico.
- Somente colaboradores ativos e autorizados como atendentes são elegíveis.
- Presença on-line não participa da escolha no MVP.
- A notificação não impede outro atendente de assumir.
- O sistema não deve selecionar e notificar automaticamente outra pessoa caso o
  primeiro notificado não assuma.
- A notificação deve permanecer disponível até ser lida, dispensada ou perder o
  objeto porque o atendimento foi assumido.
- A mesma criação de atendimento não pode gerar notificações duplicadas para o
  mesmo destinatário.

#### Regras de UI/UX

- A notificação deve aparecer ao lado da área global de notificações da HMS.
- O componente deve mostrar o contato ou Cliente, a prévia da mensagem e a ação de
  abrir o atendimento.
- A notificação deve continuar disponível quando o atendente entrar na plataforma
  depois do recebimento.
- Não deve existir seletor **Disponível/Indisponível** na central.
- A interface não deve afirmar que o atendimento já pertence ao notificado.

### Resposta manual por e-mail

- [ ] **COM-011 — Permitir resposta livre em uma thread de e-mail**

**Descrição:** O atendente responsável deve redigir uma resposta de e-mail com
espaço adequado para conteúdo mais extenso.

#### Regras de negócio

- Aplicam-se as mesmas regras de atribuição, encerramento e consentimento.
- A resposta deve preservar assunto, `in-reply-to` e referências da thread.
- O atendente pode incluir texto e anexos.
- A autoria deve ser registrada como mensagem manual.
- A resposta não deve criar uma nova thread quando pertence à conversa aberta.

#### Regras de UI/UX

- O campo de resposta deve ser uma `textarea` expansível, não um input de linha
  única.
- Assunto e destinatário devem permanecer visíveis antes do envio.
- O composer deve permitir anexar arquivos.
- O botão **Enviar** deve permanecer alinhado à área de composição.
- Quando bloqueado, deve mostrar **Assuma o atendimento para responder por
  e-mail** ou a restrição correspondente.

### Diferenciação da origem das mensagens

- [ ] **COM-012 — Identificar mensagens do cliente, do atendente e da automação**

**Descrição:** A interface deve tornar inequívoca a origem de cada mensagem no
histórico de e-mail e de cada automação registrada do WhatsApp.

#### Regras de negócio

- Toda mensagem deve possuir exatamente uma origem: Cliente, Atendente ou
  Automação.
- Mensagem automática deve manter o evento que motivou seu envio.
- Mensagem manual deve manter o colaborador autor.
- Uma mensagem não pode mudar de origem depois de registrada.

#### Regras de UI/UX

- Mensagem automática deve exibir ícone e rótulo **HMS · Mensagem automática**.
- Mensagem manual deve exibir o nome do atendente, sem ícone de automação.
- Mensagem recebida deve exibir Cliente ou contato remetente.
- A diferenciação deve combinar texto, ícone e tratamento visual, não apenas cor.
- O registro de automação do WhatsApp deve indicar explicitamente que não é uma
  resposta de atendente.

### Mensagem automática de consulta marcada

- [ ] **COM-013 — Confirmar automaticamente a marcação da consulta**

**Descrição:** Após a confirmação do agendamento, a Comunicação deve enviar uma
mensagem fixa no canal solicitado pelo fluxo responsável.

#### Regras de negócio

- O Agendamento publica os dados confirmados; a Comunicação não consulta nem
  altera a agenda diretamente.
- O envio deve ocorrer somente depois da confirmação da reserva.
- O texto base do MVP é:
  **Consulta marcada para {data} às {hora} com {profissional}. Modalidade:
  {modalidade}.**
- A mensagem não deve começar com saudação, pois normalmente sucede o atendimento
  no qual a consulta foi marcada.
- Deve existir consentimento ativo para o canal solicitado.
- O mesmo evento não pode produzir duas confirmações.
- A mensagem automática não inicia nem reabre atendimento.
- Quando enviada por e-mail, pode ser registrada na thread de comunicação
  correspondente; quando enviada por WhatsApp, deve permanecer somente no registro
  de automação e entrega.

#### Regras de UI/UX

- A confirmação deve aparecer no histórico de e-mail quando esse for o canal
  utilizado. No WhatsApp, deve aparecer somente no registro de automação e entrega.
- Data, hora, profissional e modalidade devem ser legíveis e usar o fuso horário
  apresentado ao cliente.
- Falha de envio deve aparecer no estado da mensagem, sem criar uma caixa separada.

### Mensagem automática de consulta remarcada

- [ ] **COM-014 — Confirmar automaticamente o reagendamento**

**Descrição:** Após a confirmação de um novo horário, a Comunicação deve informar
o Cliente com o mesmo padrão da marcação inicial.

#### Regras de negócio

- O texto base do MVP é:
  **Consulta remarcada para {data} às {hora} com {profissional}. Modalidade:
  {modalidade}.**
- A mensagem deve refletir somente o novo horário confirmado.
- A falha no reagendamento não pode produzir mensagem de confirmação.
- Não deve existir saudação inicial.
- Consentimento, idempotência, canal e histórico seguem as regras da confirmação
  de marcação.

#### Regras de UI/UX

- O rótulo de automação deve deixar claro que o conteúdo foi enviado pelo sistema.
- A informação nova deve ser apresentada sem exigir comparação visual com a
  mensagem anterior.

### Arquivos recebidos e Motor Documental

- [ ] **COM-015 — Encaminhar documentos recebidos sem realizar triagem na conversa**

**Descrição:** Toda mensagem recebida com arquivos deve disponibilizar a ocorrência
ao Motor Documental.

#### Regras de negócio

- Um envio contendo somente arquivos continua sendo uma mensagem válida.
- A Comunicação deve preservar arquivos, canal, remetente e momento do
  recebimento.
- Depois de registrar a mensagem e os arquivos, deve publicar o evento consumido
  pelo Motor Documental.
- O Motor Documental decide sobre criação, identificação, vínculo e situação do
  lote.
- A Comunicação não atualiza o lote documental e não interpreta seu estado.
- Retentativas do mesmo webhook não podem criar mensagens ou ocorrências
  duplicadas.

#### Regras de UI/UX

- Os anexos devem permanecer visíveis na mensagem original.
- A conversa não deve exibir cartão **Lote documental**, estado de triagem ou ação
  **Abrir na triagem documental**.
- A central não deve solicitar que o atendente classifique ou vincule documentos.

### Estados de entrega

- [ ] **COM-016 — Exibir os estados informados pelos providers**

**Descrição:** Mensagens de saída devem acompanhar o ciclo de entrega que cada
canal disponibilizar.

#### Regras de negócio

- WhatsApp pode informar: pendente, enviado, entregue, lido e falhou.
- E-mail pode informar: pendente, enviado, entregue, devolvido e falhou.
- A Comunicação não deve inventar confirmação que o provider não forneceu.
- Atualizações repetidas ou fora de ordem não podem regredir um estado terminal
  válido.
- O identificador externo deve relacionar o callback à mensagem correta.
- Mensagens recebidas usam o estado de recebida e não exibem entrega ao remetente.

#### Regras de UI/UX

- Estados de sucesso devem ser discretos e não competir com o conteúdo.
- Falha ou devolução deve ser claramente identificável na própria mensagem.
- Quando disponível, a leitura do WhatsApp pode ser representada pelo padrão de
  confirmação do canal acompanhado de texto acessível.
- O status não deve depender apenas de ícones ou cor.

### Consentimento por canal

- [ ] **COM-017 — Impedir envios sem consentimento ativo**

**Descrição:** A Comunicação deve consultar o estado publicado por Identidade
antes de qualquer mensagem manual ou automática.

#### Regras de negócio

- Consentimento de WhatsApp não autoriza e-mail e vice-versa.
- Mensagens recebidas devem continuar sendo registradas após revogação.
- Mensagens de saída devem ser bloqueadas quando o consentimento estiver ausente
  ou revogado.
- A revogação deve afetar novas tentativas ainda não enviadas.
- Não deve existir fallback automático para outro canal.
- A Comunicação não concede nem revoga consentimentos.

#### Regras de UI/UX

- O bloqueio deve aparecer próximo ao composer.
- A mensagem deve indicar qual canal não está autorizado.
- A interface não deve oferecer o envio como se estivesse disponível.
- O atendente deve ser orientado ao cadastro do Cliente quando a regularização
  depender de Identidade.

### Criação de Intake a partir da central

- [ ] **COM-018 — Abrir um novo Intake sem abandonar a conversa**

**Descrição:** O atendente deve iniciar o fluxo de novo Intake a partir do
atendimento selecionado.

#### Regras de negócio

- A Comunicação apenas navega para o fluxo; o Intake continua responsável por sua
  criação.
- Um Cliente pode possuir mais de um Intake ativo.
- A ação não encerra nem altera o atendimento.
- Quando o Cliente ainda não estiver cadastrado, o fluxo de Intake pode abrir o
  modal de cadastro mantido por Identidade.
- Depois do cadastro, o evento do Cliente deve permitir que a Comunicação faça o
  vínculo automático pelo contato.
- A Comunicação não deve aguardar a conclusão do Intake para continuar recebendo
  mensagens.

#### Regras de UI/UX

- **Novo Intake** deve ficar visível no cabeçalho do atendimento.
- O fluxo deve abrir em uma nova guia para preservar a central e a conversa.
- Telefone ou e-mail conhecido pode ser levado como contexto inicial, respeitando
  as regras do formulário de destino.
- Retornar à central deve mostrar o vínculo atualizado quando o cadastro tiver
  sido concluído.

### Encerramento do atendimento

- [ ] **COM-019 — Encerrar explicitamente um atendimento concluído**

**Descrição:** O atendente responsável deve concluir o atendimento quando não
houver mais interação operacional pendente.

#### Regras de negócio

- Somente o atendente responsável pode encerrar.
- Atendimento já encerrado não pode ser encerrado novamente.
- O encerramento deve registrar colaborador e horário.
- Encerrar não encerra Intakes, consultas ou casos.
- Encerrar não apaga conversas, mensagens, arquivos ou estados de entrega.
- Uma mensagem posterior do Cliente inicia um novo atendimento.
- Não existe reabertura manual no MVP.

#### Regras de UI/UX

- **Encerrar atendimento** deve ficar visível no cabeçalho e não escondido em menu
  de reticências.
- A ação deve abrir um modal de confirmação no padrão visual do produto.
- O modal deve informar que novas mensagens do Cliente iniciarão outro
  atendimento.
- As ações devem ser **Cancelar** e **Encerrar atendimento**.
- Depois da confirmação, o composer deve desaparecer ou ficar indisponível e o
  atendimento deve ir para **Encerradas**.

### Situação aguardando Cliente

- [ ] **COM-020 — Separar atendimentos que dependem de resposta do contato**

**Descrição:** A central deve distinguir atendimentos sob responsabilidade do
atendente cuja continuidade depende do Cliente.

#### Regras de negócio

- Depois de uma resposta manual enviada com sucesso, o atendimento pode ficar
  como **Aguardando cliente**.
- Uma nova mensagem recebida deve retornar o atendimento para **Ativo**.
- Mensagem automática isolada não deve alterar a situação operacional do
  atendimento.
- O estado não encerra nem remove a atribuição.

#### Regras de UI/UX

- O atendimento deve sair de **Minha caixa** e aparecer em **Aguardando cliente**.
- A chegada de resposta deve devolvê-lo à **Minha caixa** em tempo real.
- O estado deve ser legível no cabeçalho da conversa.

### Atualização em tempo real

- [ ] **COM-021 — Atualizar mensagens, atribuições e notificações sem recarregar**

**Descrição:** Mudanças operacionais devem ser refletidas imediatamente para quem
estiver usando a central.

#### Regras de negócio

- Devem ser propagadas novas mensagens, estados de entrega, vínculos de Cliente,
  atribuições, encerramentos e notificações.
- O NestJS é a fonte autenticada dessas atualizações para a interface.
- No MVP, a interface deve receber as atualizações por SSE exposto pelo NestJS,
  sem assinar diretamente tabelas pelo Supabase Realtime.
- Os nomes dos canais internos devem ser compostos a partir do `_NAME` do evento
  exportado pelo Core e do identificador de escopo, por exemplo:
  `${MessageReceivedEvent._NAME}:${attendanceId}`.
- Não deve existir uma camada paralela chamada `eventChannel` para renomear
  eventos.
- Reconexões não podem criar mensagens ou notificações duplicadas.

#### Regras de UI/UX

- A interface deve indicar perda temporária de conexão quando ela afetar a
  atualização da central.
- Depois da reconexão, o estado deve ser sincronizado antes de remover o aviso.
- Atualizações não devem deslocar abruptamente a leitura de mensagens antigas.

### Confiabilidade do envio

- [ ] **COM-022 — Persistir antes de enviar e repetir com segurança**

**Descrição:** Falhas transitórias não devem perder mensagens nem gerar envios
duplicados.

#### Regras de negócio

- A mensagem e o evento de saída devem ser persistidos na mesma transação.
- Meta Cloud API e Resend devem ser chamados somente depois da confirmação da
  transação.
- O processamento assíncrono e as retentativas devem ser executados pelo Inngest.
- Cada envio deve possuir uma chave de idempotência.
- A mesma chave não pode produzir dois envios externos válidos.
- Falhas definitivas devem permanecer visíveis e rastreáveis.
- Um callback externo repetido deve ser processado de forma idempotente.

#### Regras de UI/UX

- A mensagem deve aparecer como pendente enquanto aguarda o provider.
- Uma falha transitória em retentativa não deve exigir nova digitação.
- Uma falha definitiva deve informar que a mensagem não foi entregue.

### Histórico e rastreabilidade

- [ ] **COM-023 — Preservar a história operacional do atendimento**

**Descrição:** Toda interação relevante deve poder ser reconstruída sem depender
dos painéis administrativos dos providers.

#### Regras de negócio

- Devem ser preservados início, vínculo, atribuição, mensagens, estados de
  entrega e encerramento.
- A edição ou exclusão de mensagens enviadas não faz parte do MVP.
- Horários de ocorrência externa e processamento interno devem permanecer
  distinguíveis.
- A autoria do atendente deve ser mantida mesmo se seu acesso for desabilitado.
- Dados não devem ser apagados pelo encerramento do atendimento.

#### Regras de UI/UX

- Atendimentos encerrados devem ser pesquisáveis.
- O histórico deve identificar claramente Cliente, contato, canal e atendente.
- Informações técnicas de idempotência e transporte não devem poluir a interface
  comum.

---

## 4. Regras Gerais

### 4.1 Propriedade e fronteira dos dados

- Identidade é a fonte oficial do Cliente, contatos e consentimentos.
- Comunicação é a fonte oficial do atendimento, conversa, mensagem, atribuição e
  notificação interna do módulo.
- Motor Documental é a fonte oficial dos lotes e de sua triagem.
- Integrações entre módulos devem ocorrer por eventos e referências, sem acesso
  direto aos dados internos de outro módulo.

### 4.2 Privacidade

- A central deve ser acessível somente a colaboradores autenticados e autorizados.
- Telefones, e-mails, mensagens e anexos devem respeitar o menor acesso necessário.
- Pré-visualizações em notificações não devem expor conteúdo além do necessário.
- Logs técnicos não devem registrar corpos completos ou arquivos sem necessidade.

### 4.3 Integridade e concorrência

- A unicidade do atendimento ativo e da atribuição ativa deve ser garantida no
  banco de dados.
- Webhooks e eventos devem ser idempotentes.
- A ordem de exibição deve respeitar a ocorrência da mensagem mesmo quando o
  processamento chegar atrasado.
- Operações concorrentes devem retornar resultado determinístico e compreensível.

### 4.4 Linguagem do produto

- Usar **Atendimento** para o período ativo e **Conversa** para o canal.
- Usar **Atendente** na interface e `collaboratorId` nos contratos com Identidade.
- Não usar **Fila** para as visões da central.
- Não usar **Abrir atendimento** para o início causado pela mensagem; usar
  **Atendimento iniciado** quando necessário no histórico.
- Mensagens automáticas devem ser chamadas explicitamente de **Mensagem
  automática**.

### 4.5 Acessibilidade e responsividade

- Estados não devem depender somente de cor.
- Controles devem possuir nome acessível e foco visível.
- O histórico deve permitir navegação por teclado.
- Textos e metadados devem respeitar contraste e ampliação.
- Em telas menores, lista, conversa e painel de contexto podem ocupar etapas
  separadas, preservando navegação de retorno.

### 4.6 Presença do atendente

- A plataforma não controla nem exibe presença on-line no MVP.
- Ausência de presença não impede a criação da notificação.
- A notificação deve ser persistente para aparecer no próximo acesso.
- Todos os atendentes autorizados continuam podendo consultar **Não atribuídas**,
  mesmo que a notificação tenha sido direcionada a outra pessoa.

---

## 5. Fluxos de Usuário

### Fluxo — Cliente envia documentos por WhatsApp

1. O Cliente envia um ou mais documentos para o número da HMS.
2. A Meta Cloud API entrega o webhook ao NestJS.
3. A Comunicação valida a duplicidade e normaliza o telefone.
4. A Comunicação registra a ocorrência e os arquivos recebidos.
5. Um evento com arquivos, remetente, canal e horário é publicado.
6. O Motor Documental cria e conduz o lote correspondente.
7. Nenhuma conversa ou atendimento humano de WhatsApp é criado na central.

### Fluxo — Cliente inicia contato por e-mail

1. O contato envia um e-mail para a HMS.
2. A Comunicação preserva remetente, assunto, thread, corpo e anexos.
3. Sem atendimento ativo, inicia um atendimento não atribuído.
4. A central apresenta a conversa de e-mail e sua notificação.
5. Respostas posteriores da mesma thread permanecem agrupadas.

### Fluxo — Atendente assume e responde

1. O atendente abre uma notificação ou a visão **Não atribuídas**.
2. Confere o contato e o histórico disponível.
3. Seleciona **Assumir atendimento**.
4. A plataforma confirma que nenhuma atribuição ativa existe.
5. O cabeçalho passa a mostrar **Atribuído a você**.
6. O composer é habilitado.
7. O atendente envia uma resposta manual.
8. A mensagem aparece como pendente e depois recebe o estado do provider.

### Fluxo — Dois atendentes tentam assumir

1. Dois atendentes abrem o mesmo atendimento não atribuído.
2. Ambos selecionam **Assumir atendimento**.
3. A primeira confirmação válida cria a atribuição.
4. A segunda é recusada por conflito.
5. A interface do segundo atendente mostra o responsável atual em modo leitura.

### Fluxo — Remetente ainda não é Cliente

1. A mensagem inicia um atendimento identificado apenas pelo contato.
2. A central exibe o banner de remetente não vinculado.
3. O atendente assume e seleciona **Novo Intake**.
4. O Intake abre em outra guia.
5. O atendente localiza ou cadastra o Cliente no modal existente.
6. Identidade publica o Cliente com telefone e e-mail aplicáveis.
7. A Comunicação encontra o atendimento pelo contato e realiza o vínculo.
8. A central passa a apresentar o Cliente automaticamente.

### Fluxo — Consulta é marcada

1. O Agendamento confirma a reserva.
2. O evento informa Cliente, data, hora, profissional, modalidade e canal.
3. A Comunicação valida contato e consentimento.
4. Registra a mensagem automática e o evento de saída na mesma transação.
5. O Inngest solicita o envio ao provider depois do commit.
6. A central mostra a mensagem com rótulo de automação e estado de entrega.

### Fluxo — Consulta é remarcada

1. O Agendamento confirma o novo horário.
2. A Comunicação recebe o evento uma única vez de forma efetiva.
3. Envia o texto fixo com os novos dados, sem saudação.
4. A mensagem fica identificada como automática no histórico.

### Fluxo — Atendente encerra o atendimento

1. O atendente responsável seleciona **Encerrar atendimento**.
2. O modal explica o efeito e solicita confirmação.
3. O atendente confirma.
4. A Comunicação registra autoria e horário do encerramento.
5. O atendimento passa para **Encerradas** e fica somente leitura.
6. Uma mensagem futura do Cliente inicia um novo atendimento.

---

## 6. Critérios de Aceite do MVP

### 6.1 Canais e histórico

- [ ] Mensagens de e-mail aparecem na central sem recarga manual.
- [ ] Documentos recebidos pelo WhatsApp chegam ao Motor Documental sem criar
  atendimento humano.
- [ ] E-mails da mesma thread permanecem agrupados.
- [ ] Mensagens manuais, automáticas e recebidas são visualmente inequívocas.
- [ ] Webhooks repetidos não criam mensagens duplicadas.

### 6.2 Atendimento e atribuição

- [ ] Somente mensagem recebida inicia um atendimento.
- [ ] Um Cliente não possui dois atendimentos ativos.
- [ ] O atendimento humano da central é restrito ao e-mail.
- [ ] A notificação não atribui nem reserva o atendimento.
- [ ] Dois atendentes não conseguem manter atribuição ativa simultânea.
- [ ] Não existe presença on-line nem redistribuição automática.

### 6.3 Central de Comunicação

- [ ] A central possui Minha caixa, Não atribuídas, Aguardando cliente e
  Encerradas.
- [ ] Não existe seção de filas especializadas.
- [ ] Não existem caixas de aprovação, falha ou remetente sem identificação.
- [ ] O painel lateral pode ser recolhido.
- [ ] Novo Intake e Encerrar atendimento ficam visíveis no cabeçalho.
- [ ] O encerramento exige modal de confirmação.

### 6.4 Cliente e Intake

- [ ] Atendimento sem Cliente exibe orientação apropriada.
- [ ] Criar ou atualizar o Cliente vincula automaticamente o contato compatível.
- [ ] Novo Intake abre em outra guia e não interrompe a central.
- [ ] Vários Intakes ativos não criam vários atendimentos ativos.

### 6.5 Mensagens e documentos

- [ ] Respostas manuais exigem atribuição ao próprio atendente.
- [ ] Envios sem consentimento ativo são bloqueados por canal.
- [ ] Marcações e reagendamentos enviam apenas o texto fixo correspondente.
- [ ] As mensagens automáticas não possuem saudação inicial.
- [ ] Arquivos recebidos são encaminhados ao Motor Documental.
- [ ] A conversa não exibe lote nem ação de triagem documental.

### 6.6 Confiabilidade

- [ ] Mensagem e evento de saída são persistidos atomicamente.
- [ ] Providers são chamados somente depois do commit.
- [ ] Retentativas do Inngest não duplicam o envio.
- [ ] Estados de entrega refletem somente informações fornecidas pelo canal.
- [ ] Falhas definitivas permanecem visíveis na própria mensagem.

---

## 7. Indicadores de Produto e Operação

- quantidade de atendimentos iniciados por canal;
- tempo entre a primeira mensagem e a assunção do atendimento;
- tempo entre assunção e primeira resposta manual;
- quantidade de atendimentos não atribuídos por período;
- quantidade de atendimentos ativos por atendente;
- distribuição das notificações entre atendentes elegíveis;
- percentual de notificações cujo destinatário assumiu o atendimento;
- quantidade de atendimentos com Cliente vinculado automaticamente;
- quantidade de mensagens recebidas com arquivos;
- taxa de envio, entrega, leitura e falha por canal;
- quantidade de retentativas por provider;
- quantidade de duplicidades evitadas por idempotência;
- tempo médio até encerramento do atendimento.

Os indicadores não alteram as regras operacionais e podem ser produzidos por
modelos de leitura inscritos nos eventos do módulo.

---

## 8. Relação com Outras Áreas do Produto

### Identidade

Fornece Cliente, telefone, e-mail, colaboradores ativos e consentimentos. A
Comunicação mantém referências e uma projeção mínima desses dados para localizar
atendimentos, sem assumir a propriedade cadastral.

### Intake

Pode ser aberto em nova guia a partir da central. Um Cliente pode possuir vários
Intakes, mas essa quantidade não altera a unicidade do atendimento ativo.

### Agendamento

Publica marcações e reagendamentos confirmados. A Comunicação transforma esses
eventos nas mensagens automáticas fixas do MVP.

### Consulta

Consome a referência do agendamento e não é responsável pelo envio das
confirmações. O conteúdo jurídico da consulta não deve ser copiado para a
conversa.

### Motor Documental

Consome as ocorrências de mensagens com arquivos e assume a criação e a triagem
dos lotes. A Comunicação preserva a mensagem original, mas não acompanha o estado
do lote em sua interface.

### Caso

Pode usar eventos futuros da Comunicação para informar contatos relacionados a um
caso, mas a vinculação direta de mensagens a casos não faz parte do MVP.

### Auditoria

Pode preservar eventos selecionados de consentimento, envio e acesso quando
possuírem relevância probatória, sem substituir o histórico operacional da
Comunicação.

---

## 9. Fora do Escopo

- canais diferentes de WhatsApp e e-mail;
- atendimento humano integrado ao WhatsApp ou espelhamento do WhatsApp Web na HMS;
- resposta manual de atendentes pelo WhatsApp;
- ligação telefônica, SMS, Telegram, chat do portal ou redes sociais;
- presença on-line, ausente ou ocupado do atendente;
- atribuição automática do atendimento;
- transferência, redistribuição ou escalonamento automático;
- filas por assunto, equipe, consulta, caso ou documento;
- SLA por fila ou prioridade automática;
- notas internas dentro da conversa;
- menções e colaboração interna em mensagens;
- aprovação humana antes do envio;
- respostas sugeridas ou geradas por IA;
- chatbot e atendimento automatizado conversacional;
- mensagens automáticas configuráveis pelo administrador;
- campanhas e disparos em massa;
- criação manual de um novo atendimento pelo colaborador;
- reabertura manual de atendimento encerrado;
- edição ou exclusão de mensagens;
- transferência de atendimento;
- múltiplos números de telefone por Cliente;
- exibição de lotes e ações de triagem documental na conversa;
- vínculo direto de mensagem a Intake, Consulta ou Caso;
- fallback automático de WhatsApp para e-mail ou vice-versa;
- notificação automática de um segundo atendente por falta de resposta do primeiro;
- aplicativo móvel nativo ou notificações push fora do navegador.

---

## 10. Perguntas Pendentes

- Por quanto tempo atendimentos encerrados devem permanecer disponíveis na busca
  comum antes de serem acessados somente pelo histórico?
- Deve existir no futuro um motivo estruturado de encerramento do atendimento?
- Qual política futura permitirá transferir um atendimento quando o responsável
  ficar indisponível?
- Quais tipos adicionais de mensagem automática entrarão depois das confirmações
  de marcação e reagendamento?
- O e-mail recebido deve preservar e exibir cópias e cópias ocultas em quais
  situações e perfis?
