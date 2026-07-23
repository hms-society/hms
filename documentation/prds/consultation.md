# PRD — Módulo de Consulta

---

## 1. Visão Geral

O módulo de **Consulta** organiza a realização da consulta jurídica marcada para
um cliente. Ele reúne o contexto do atendimento, a classificação jurídica
inicial, os fatos relevantes, os possíveis pedidos, os riscos identificados, a
orientação prestada e as observações do advogado.

A consulta nasce a partir de um agendamento existente. O horário, os
cancelamentos e as remarcações continuam sendo responsabilidade da Agenda. A
Consulta assume o trabalho jurídico realizado no encontro: preparar, iniciar,
registrar, revisar e concluir o atendimento.

Durante a consulta, a HMS pode sugerir uma questão jurídica principal, fatos,
possíveis pedidos e riscos. Essas sugestões nunca se tornam parte da ficha sem
decisão humana. O advogado pode aceitar, editar ou rejeitar cada sugestão.

A consulta também apresenta o **Pacote de documentos da consulta**, usado para
selecionar, gerar, revisar e aprovar os documentos que devem resultar daquele
atendimento. A produção dos documentos é compartilhada com outras etapas da HMS,
mas sua configuração e seu acompanhamento ficam disponíveis dentro da consulta.

### Objetivo

Oferecer ao advogado uma ficha clara e confiável para conduzir a consulta,
registrar o raciocínio jurídico essencial, revisar sugestões, orientar o cliente
e preparar os documentos necessários para a próxima etapa.

### Problema resolvido

Sem um fluxo próprio de consulta, informações importantes ficam dispersas em
anotações, mensagens e documentos. Isso dificulta compreender o que o cliente
relatou, qual é a questão jurídica principal, quais medidas podem ser tomadas,
quais riscos foram identificados e qual orientação foi prestada.

Também existe o risco de sugestões serem tratadas como conclusões sem revisão,
de documentos serem gerados com classificação inadequada e de uma consulta ser
encerrada sem informações mínimas para continuidade do atendimento.

### Valor entregue

- continuidade entre agendamento e atendimento jurídico;
- visão completa do cliente durante a consulta;
- registro organizado de fatos e cronologia;
- definição clara da questão jurídica principal;
- registro de possíveis pedidos e riscos;
- revisão humana obrigatória das sugestões;
- registro da orientação prestada ao cliente;
- preparação e confirmação do pacote de documentos;
- histórico confiável da consulta e das decisões tomadas;
- base clara para formalização ou encerramento do atendimento.

### Contexto do MVP

O cliente entra em contato com a HMS, tem seus dados cadastrados e recebe um
horário com um advogado. No momento do encontro, o advogado abre a consulta
correspondente, confirma o contexto, conduz a conversa, organiza as informações
jurídicas e registra a orientação prestada.

Ao final, o advogado deve conseguir compreender rapidamente:

- quem é o cliente;
- quando e como ocorreu a consulta;
- qual área e tema orientaram a análise;
- qual é a questão jurídica principal;
- quais fatos são relevantes e quando ocorreram;
- quais pedidos jurídicos podem ser considerados;
- quais riscos foram identificados;
- qual orientação foi prestada;
- quais observações adicionais precisam ser preservadas;
- quais documentos foram preparados e aprovados.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- criar uma consulta a partir de um agendamento válido;
- relacionar a consulta ao cliente e ao advogado definidos;
- apresentar a qualificação completa do cliente;
- registrar modalidade e canal do atendimento;
- classificar a consulta por área e tema jurídico;
- acompanhar se a consulta está pendente, em andamento, concluída ou marcada
  como não comparecimento;
- registrar a questão jurídica principal;
- registrar fatos relevantes e sua cronologia;
- registrar possíveis pedidos jurídicos;
- registrar riscos identificados;
- receber sugestões para esses conteúdos;
- exigir decisão humana sobre cada sugestão;
- registrar a orientação prestada ao cliente;
- registrar observações complementares;
- disponibilizar a configuração do pacote de documentos;
- acompanhar os documentos do pacote até sua aprovação;
- permitir a confirmação do pacote quando todos os documentos estiverem
  aprovados;
- preservar o histórico da consulta.

### 2.2 Responsabilidades que pertencem a outros módulos

- cadastrar e atualizar o cliente;
- manter o cadastro e as especialidades do advogado;
- configurar a agenda do advogado;
- calcular horários disponíveis;
- marcar, cancelar ou remarcar o horário;
- manter áreas e temas jurídicos disponíveis;
- manter os modelos usados na produção de documentos;
- produzir e preservar as versões dos documentos;
- abrir e acompanhar um caso;
- formalizar a contratação do cliente;
- enviar mensagens ao cliente;
- controlar cobranças e pagamentos.

### 2.3 Organização da experiência

A consulta deve ser organizada em duas áreas principais:

1. **Ficha de atendimento:** reúne qualificação do cliente, questão jurídica,
   fatos, possíveis pedidos, riscos, orientação e observações.
2. **Pacote de documentos da consulta:** reúne a configuração, geração, revisão,
   aprovação e confirmação dos documentos.

A seção **Documentos a solicitar** não faz parte da ficha de atendimento do MVP.
A consulta também não possui um campo separado de **Síntese**, pois a questão
jurídica principal, os fatos, os pedidos, os riscos, a orientação e as
observações já organizam o conteúdo necessário.

---

## 3. Requisitos

### Criação da consulta a partir do agendamento

- [ ] **Criar uma consulta vinculada a um horário marcado**

**Descrição:** A HMS deve preparar uma consulta para o cliente e o advogado
definidos em um agendamento válido.

#### Regras de negócio

- Toda consulta do MVP deve estar relacionada a um agendamento.
- O agendamento deve existir e não pode estar cancelado.
- Um mesmo agendamento não pode originar duas consultas.
- O cliente da consulta deve ser o cliente do agendamento.
- O advogado da consulta deve ser o profissional responsável pelo horário.
- O cliente precisa continuar cadastrado.
- O advogado precisa possuir acesso ativo e perfil de advogado.
- O advogado deve estar associado a uma área e a um ou mais temas jurídicos.
- A consulta deve iniciar como **Pendente**.
- Criar a consulta não significa que o atendimento começou.
- Remarcar o horário deve manter a mesma consulta quando o atendimento ainda não
  tiver começado.
- Cancelar o agendamento antes do início deve impedir a realização da consulta.
- A criação deve ser única mesmo quando a solicitação for repetida
  acidentalmente.

#### Regras de UI/UX

- A agenda deve oferecer uma ação clara para abrir a consulta correspondente.
- Antes do início, a tela deve mostrar cliente, advogado, data e horário.
- Se o agendamento estiver cancelado, a interface deve explicar por que a
  consulta não pode ser iniciada.
- Quando a consulta já existir, a ação deve abrir a consulta existente.
- A interface não deve apresentar duas consultas para o mesmo horário.

---

### Contexto do atendimento

- [ ] **Apresentar as informações essenciais antes e durante a consulta**

**Descrição:** O advogado deve compreender rapidamente o contexto do atendimento
sem precisar alternar entre várias áreas da plataforma.

#### Regras de negócio

- A consulta deve apresentar o cliente atendido.
- A consulta deve apresentar o advogado responsável.
- A data e o horário marcados devem permanecer visíveis.
- A modalidade deve ser apresentada.
- Quando a consulta for virtual, o canal deve ser apresentado.
- A área e o tema jurídico devem ser apresentados.
- O estado atual da consulta deve ser apresentado.
- Mudanças no cadastro do cliente devem aparecer na qualificação, sem alterar o
  conteúdo jurídico já registrado.
- Informações históricas da consulta não devem ser substituídas por mudanças
  futuras de agenda.
- O contexto deve permanecer disponível durante todo o preenchimento da ficha.

#### Regras de UI/UX

- Cliente, horário e estado devem aparecer no cabeçalho ou em posição de fácil
  consulta.
- Informações secundárias devem permanecer acessíveis sem dominar a tela.
- A próxima ação principal deve estar evidente.
- A interface deve evitar repetir os mesmos dados em vários painéis.
- O estado não deve depender apenas de cor.

---

### Qualificação completa do cliente

- [ ] **Exibir a qualificação completa na ficha de atendimento**

**Descrição:** O advogado deve acessar os dados cadastrais necessários para
identificar o cliente e compreender seu contexto básico.

#### Regras de negócio

- Para pessoa física, a qualificação deve apresentar nome, CPF, contatos e
  endereço disponíveis.
- Para pessoa jurídica, deve apresentar razão social, nome fantasia, CNPJ,
  contatos e endereço disponíveis.
- Dados ausentes devem ser identificados como não informados.
- A consulta não deve criar um segundo cadastro do cliente.
- Correções cadastrais devem respeitar as permissões de gestão do cliente.
- Atualizar a qualificação não deve alterar fatos, pedidos, riscos ou orientação.
- O acesso aos dados completos deve ser limitado a colaboradores autorizados.
- A qualificação não substitui o registro jurídico da consulta.

#### Regras de UI/UX

- A qualificação completa deve ser mantida na ficha.
- Os dados devem ser organizados para leitura rápida.
- CPF, CNPJ e contatos devem ser protegidos quando a exibição completa não for
  necessária.
- Informações ausentes não devem deixar espaços ambíguos.
- A ação de corrigir cadastro deve ser distinta das ações jurídicas da consulta.
- A seção pode ser recolhida, desde que continue facilmente acessível.

---

### Classificação por área e tema jurídico

- [ ] **Classificar a consulta por uma área e um tema**

**Descrição:** A consulta deve possuir uma classificação jurídica que oriente a
análise e as sugestões apresentadas ao advogado.

#### Regras de negócio

- Toda consulta deve possuir uma área jurídica.
- Toda consulta deve possuir um tema jurídico.
- O tema deve pertencer à área selecionada.
- Apenas áreas e temas disponíveis podem ser escolhidos em uma nova consulta.
- A classificação pode ser definida antes do início ou ajustada durante o
  atendimento.
- Alterar a área exige nova escolha de tema.
- A alteração não deve apagar fatos, pedidos, riscos, orientação ou observações.
- A classificação deve estar definida antes da conclusão.
- A classificação da consulta é independente dos critérios usados para procurar
  documentos no pacote.
- Mudar os critérios do pacote não altera a classificação da consulta.

#### Regras de UI/UX

- O campo **Área jurídica** deve aparecer antes de **Tema jurídico**.
- O campo de tema deve mostrar somente temas da área selecionada.
- Ao mudar a área, a interface deve avisar que o tema atual será removido.
- A área e o tema atuais devem permanecer visíveis na ficha.
- A interface deve explicar que alterações feitas dentro do pacote valem somente
  para a busca de documentos.

---

### Modalidade e canal

- [ ] **Registrar como a consulta será realizada**

**Descrição:** A consulta deve diferenciar atendimento presencial de atendimento
virtual e, quando virtual, informar o canal utilizado.

#### Regras de negócio

- As modalidades permitidas são **Presencial** e **Virtual**.
- Consulta presencial não possui canal virtual.
- Consulta virtual deve possuir um canal.
- Os canais previstos no MVP são:
  - vídeo pelo WhatsApp;
  - Google Meet;
  - Microsoft Teams;
  - outro.
- Quando o canal for **Outro**, a interface deve permitir que o contexto
  necessário seja informado.
- A modalidade pode ser ajustada antes do início.
- Alterações depois do início devem exigir confirmação.
- A modalidade não altera o conteúdo obrigatório para concluir a consulta.

#### Regras de UI/UX

- O campo de canal deve aparecer somente para modalidade virtual.
- Trocar de virtual para presencial deve remover o canal após confirmação.
- Os nomes dos canais devem ser apresentados de forma reconhecível.
- O contexto de acesso à chamada deve ficar disponível sem expor informações
  desnecessárias.

---

### Estados da consulta

- [ ] **Acompanhar o andamento do atendimento**

**Descrição:** A consulta deve possuir um estado claro que represente sua situação
operacional.

#### Regras de negócio

- Os estados do MVP são:
  - **Pendente:** preparada, mas ainda não iniciada;
  - **Em andamento:** atendimento iniciado;
  - **Concluída:** atendimento realizado e finalizado;
  - **Não compareceu:** cliente não participou do atendimento.
- Uma consulta pendente pode ser iniciada.
- Uma consulta pendente pode ser marcada como não comparecimento.
- Uma consulta em andamento pode ser concluída.
- Uma consulta em andamento não pode ser marcada como não comparecimento.
- Uma consulta concluída não pode voltar automaticamente para em andamento.
- Uma consulta marcada como não comparecimento não pode ser concluída sem um
  fluxo de correção previamente definido.
- Cada mudança deve registrar quando ocorreu.
- Estados incompatíveis não podem coexistir.

#### Regras de UI/UX

- O estado atual deve estar visível no cabeçalho.
- A ação principal deve acompanhar o estado:
  - **Iniciar consulta** quando pendente;
  - **Concluir consulta** quando em andamento.
- **Marcar não comparecimento** deve ser uma ação secundária e exigir
  confirmação.
- Consultas concluídas ou com não comparecimento devem apresentar a informação
  como histórico, e não como tarefa pendente.

---

### Início da consulta

- [ ] **Registrar o início do atendimento**

**Descrição:** O advogado responsável deve iniciar formalmente a consulta antes
de registrar sua conclusão.

#### Regras de negócio

- Somente consulta pendente pode ser iniciada.
- O agendamento não pode estar cancelado.
- O advogado responsável deve possuir acesso ativo.
- O início deve registrar data e horário.
- A consulta deve passar para **Em andamento**.
- Iniciar novamente uma consulta em andamento deve ser impedido.
- O início não exige que toda a ficha esteja preenchida.
- Área, tema e modalidade devem estar definidos no início ou ser confirmados
  durante o atendimento.
- O início não concede automaticamente aprovação às sugestões existentes.

#### Regras de UI/UX

- O botão **Iniciar consulta** deve ser a ação principal quando disponível.
- A interface deve mostrar imediatamente que a consulta está em andamento.
- O horário de início deve ficar acessível no resumo.
- Falhas devem manter a consulta como pendente.
- A tela deve direcionar o foco para a ficha de atendimento após o início.

---

### Não comparecimento

- [ ] **Registrar quando o cliente não participa da consulta**

**Descrição:** O advogado ou colaborador autorizado deve conseguir indicar que o
cliente não compareceu ao horário marcado.

#### Regras de negócio

- Somente consulta pendente pode ser marcada como não comparecimento.
- O agendamento deve ter chegado ao momento em que a ausência possa ser
  confirmada.
- A ação deve registrar data e horário.
- A consulta deve passar para **Não compareceu**.
- Uma consulta com início registrado não pode ser marcada como não
  comparecimento.
- O não comparecimento não cancela nem remarca automaticamente um novo horário.
- Uma nova tentativa deve ser marcada pela Agenda.
- Informações preenchidas durante a preparação não devem ser apagadas.
- O pacote de documentos não deve ser confirmado como consequência do não
  comparecimento.

#### Regras de UI/UX

- A confirmação deve explicar que uma nova consulta dependerá de novo
  agendamento.
- A ação não deve ser confundida com cancelamento.
- Depois da confirmação, a tela deve mostrar a data do registro.
- A interface deve oferecer um caminho para voltar ao cliente ou à agenda.

---

### Questão jurídica principal

- [ ] **Definir a pergunta central analisada na consulta**

**Descrição:** O advogado deve registrar, em uma frase clara, a principal questão
jurídica trazida pelo cliente.

#### Regras de negócio

- A consulta pode receber uma sugestão para a questão jurídica principal.
- Pode existir somente uma sugestão pendente por vez para esse campo.
- A sugestão não pode ser tratada como conteúdo definitivo antes da aceitação.
- O advogado pode editar o texto sugerido antes de aceitar.
- O advogado pode rejeitar a sugestão e preencher o campo manualmente.
- O conteúdo aceito passa a ser tratado como texto comum.
- A rejeição deve evitar que a mesma sugestão volte a ser apresentada.
- A questão jurídica principal é obrigatória para concluir a consulta.
- O campo deve representar a questão central, não uma síntese completa do
  atendimento.
- Alterar o campo depois de preenchido deve preservar a responsabilidade do
  advogado pela versão final.

#### Regras de UI/UX

- A sugestão pendente deve usar somente o marcador **Sugerido**.
- As ações **Aceitar** e **Rejeitar** devem ser explícitas.
- O advogado deve poder editar antes de aceitar.
- Depois da aceitação, o marcador e as ações devem desaparecer.
- Depois da rejeição, o campo deve ficar livre para preenchimento manual.
- O campo deve informar que é obrigatório para concluir.
- Não deve existir um marcador **Aceito**.

---

### Fatos relevantes e cronologia

- [ ] **Registrar os acontecimentos relevantes para a análise**

**Descrição:** O advogado deve organizar os fatos relatados pelo cliente e, quando
aplicável, indicar quando ocorreram.

#### Regras de negócio

- Cada fato deve possuir uma descrição.
- A data do fato é opcional.
- Quando a data for conhecida, ela deve poder ser registrada.
- Fatos podem ser adicionados manualmente.
- Fatos podem ser sugeridos.
- Sugestões dependem de aceitação ou rejeição.
- Aceitar uma sugestão transforma o fato em um item comum.
- Rejeitar remove o fato da lista operacional.
- Um fato rejeitado não deve voltar a ser sugerido de forma idêntica.
- Fatos podem ser editados ou removidos pelo advogado enquanto a consulta estiver
  em andamento.
- A ordem deve favorecer a compreensão cronológica quando houver datas.
- Um fato sem data deve continuar visível sem receber uma data presumida.
- O fato não deve receber automaticamente os estados **Comprovado** ou **A
  comprovar**.
- Evidências sobre fatos dependem de um fluxo próprio, fora deste MVP.

#### Regras de UI/UX

- A seção deve se chamar **Fatos relevantes e cronologia**.
- Itens manuais devem aparecer sem marcador.
- Sugestões pendentes devem usar somente **Sugerido**.
- Aceitar e rejeitar devem ser ações visíveis e acessíveis.
- Ao rejeitar, deve ser oferecida temporariamente a ação **Desfazer**.
- Itens rejeitados não devem formar uma lista visível na tela principal.
- A data deve ser apresentada quando informada.
- Não devem ser usados os marcadores **Aceito**, **Comprovado** ou **A
  comprovar**.

---

### Possíveis pedidos jurídicos

- [ ] **Registrar medidas ou pretensões que podem ser consideradas**

**Descrição:** O advogado deve registrar os possíveis pedidos jurídicos
identificados durante a consulta, sem tratá-los automaticamente como decisão
final.

#### Regras de negócio

- Cada possível pedido deve possuir uma descrição.
- Pedidos podem ser adicionados manualmente.
- Pedidos podem ser sugeridos.
- Sugestões dependem de aceitação ou rejeição.
- Aceitar transforma a sugestão em um item comum.
- Rejeitar remove o item da lista operacional.
- Um pedido rejeitado não deve voltar a ser sugerido de forma idêntica.
- O advogado pode editar ou remover pedidos enquanto a consulta estiver em
  andamento.
- A existência de um possível pedido não representa garantia de ajuizamento,
  contratação ou êxito.
- A lista pode permanecer vazia quando nenhum pedido tiver sido identificado.

#### Regras de UI/UX

- A seção deve se chamar **Possíveis pedidos jurídicos**.
- Deve existir uma ação clara para **Adicionar pedido**.
- A criação manual pode ocorrer em uma janela dedicada.
- Sugestões devem usar somente o marcador **Sugerido**.
- Aceitar e rejeitar devem ser ações separadas do marcador.
- Depois da aceitação, o item deve aparecer sem marcador.
- Depois da rejeição, deve ser oferecida temporariamente a ação **Desfazer**.
- Pedidos rejeitados não devem ficar em um grupo visível.

---

### Riscos identificados

- [ ] **Registrar riscos relevantes explicados durante a consulta**

**Descrição:** O advogado deve registrar riscos jurídicos, probatórios,
processuais ou operacionais identificados no atendimento.

#### Regras de negócio

- Cada risco deve possuir uma descrição clara.
- Riscos podem ser adicionados manualmente.
- Riscos podem ser sugeridos.
- Sugestões dependem de decisão do advogado.
- Aceitar transforma a sugestão em item comum.
- Rejeitar remove o risco da lista operacional.
- Um risco rejeitado não deve voltar a ser sugerido de forma idêntica.
- O advogado pode editar ou remover riscos enquanto a consulta estiver em
  andamento.
- A lista pode permanecer vazia quando nenhum risco tiver sido identificado.
- Registrar um risco não substitui a orientação prestada ao cliente.

#### Regras de UI/UX

- A seção deve se chamar **Riscos identificados**.
- Itens manuais devem aparecer sem marcador.
- Sugestões devem usar somente **Sugerido**.
- Devem existir ações explícitas para aceitar e rejeitar.
- Depois da rejeição, deve ser oferecida temporariamente a ação **Desfazer**.
- Riscos rejeitados não devem ser apresentados em uma seção separada.
- Não deve existir o marcador **Aceito**.

---

### Revisão das sugestões

- [ ] **Exigir decisão humana antes de incorporar conteúdo sugerido**

**Descrição:** Todo conteúdo sugerido para a ficha deve permanecer pendente até
que o advogado decida aceitá-lo ou rejeitá-lo.

#### Regras de negócio

- Sugestões podem ser feitas para:
  - questão jurídica principal;
  - fatos relevantes;
  - possíveis pedidos jurídicos;
  - riscos identificados.
- Nenhuma sugestão deve ser aceita automaticamente.
- Somente o advogado responsável ou outro profissional autorizado pode revisar.
- A decisão deve ser registrada.
- O conteúdo pode ser editado antes da aceitação.
- Aceitar incorpora a versão revisada pelo advogado.
- Rejeitar retira o conteúdo da ficha operacional.
- A mesma sugestão rejeitada não deve ser reapresentada.
- A rejeição pode ser desfeita durante o período temporário oferecido pela tela.
- Depois que o período de desfazer terminar, a sugestão continua fora da ficha.
- Conteúdo criado manualmente não recebe marcador de sugestão.
- Sugestões pendentes devem ser resolvidas antes da conclusão da consulta.

#### Regras de UI/UX

- **Sugerido** é o único marcador permitido para esses conteúdos.
- **Aceitar**, **Rejeitar**, **Editar** e **Desfazer** devem ser controles
  separados.
- Todos os controles devem possuir nome acessível e foco visível.
- A aceitação deve remover imediatamente o marcador.
- A rejeição deve remover o item da lista e apresentar **Desfazer**
  temporariamente.
- Itens rejeitados não devem poluir a ficha.
- A tela não deve usar **Aceito**, **Comprovado** ou **A comprovar** como
  marcadores.

---

### Orientação prestada ao cliente

- [ ] **Registrar a orientação jurídica comunicada ao cliente**

**Descrição:** O advogado deve registrar de forma objetiva a orientação que foi
efetivamente prestada durante a consulta.

#### Regras de negócio

- A orientação deve representar o que foi comunicado ao cliente.
- O campo é obrigatório para concluir uma consulta realizada.
- A orientação pode incluir próximos passos, cautelas e condições explicadas.
- A orientação não deve ser preenchida automaticamente sem revisão do advogado.
- Sugestões podem apoiar a redação, mas a versão final é responsabilidade do
  advogado.
- O campo não deve ser usado para fatos, pedidos ou observações internas.
- Alterações são permitidas enquanto a consulta estiver em andamento.
- Uma consulta marcada como não comparecimento não exige orientação.

#### Regras de UI/UX

- O campo deve se chamar **Orientação prestada ao cliente**.
- O texto auxiliar deve reforçar que se trata do que foi efetivamente comunicado.
- A obrigatoriedade para conclusão deve ser visível.
- O campo deve oferecer espaço adequado para texto detalhado.
- Erros de preenchimento não devem apagar o conteúdo.

---

### Observações

- [ ] **Registrar informações complementares do atendimento**

**Descrição:** O advogado deve possuir um espaço opcional para informações úteis
que não pertencem aos demais campos.

#### Regras de negócio

- Observações são opcionais.
- O campo pode reunir contexto interno relevante para continuidade.
- Observações não substituem a questão jurídica principal.
- Observações não substituem a orientação prestada.
- Fatos, pedidos e riscos devem permanecer em suas próprias seções.
- Informações desnecessárias ou excessivamente sensíveis devem ser evitadas.
- Alterações são permitidas enquanto a consulta estiver em andamento.
- A ausência de observações não impede a conclusão.

#### Regras de UI/UX

- O campo deve se chamar **Observações**.
- A interface deve indicar que o preenchimento é opcional.
- O campo deve aparecer depois das informações jurídicas principais.
- Não deve existir um campo separado chamado **Síntese**.
- O texto auxiliar deve orientar o uso apenas para informações complementares.

---

### Configuração do pacote de documentos

- [ ] **Escolher os documentos aplicáveis à consulta**

**Descrição:** O advogado deve configurar o pacote usando área e tema como
critérios para receber sugestões de documentos.

#### Regras de negócio

- A área e o tema da consulta devem preencher inicialmente os critérios do
  pacote.
- O advogado pode alterar esses critérios dentro do pacote.
- Alterar os critérios do pacote não altera a classificação da consulta.
- O tema usado no pacote deve pertencer à área selecionada.
- A combinação de área e tema deve apresentar os documentos aplicáveis.
- O advogado deve poder selecionar quais documentos deseja incluir.
- A geração depende de confirmação explícita.
- Apenas visualizar sugestões não inicia a geração.
- O pacote pode ser reconfigurado depois da primeira geração.
- Reconfigurar permite buscar documentos de outra área ou tema.
- Documentos já incluídos não podem ser removidos silenciosamente pela
  reconfiguração.
- O pacote deve manter pelo menos um documento para poder ser confirmado.

#### Regras de UI/UX

- A área deve aparecer antes do tema e antes da lista de documentos.
- Os valores iniciais não devem receber o rótulo **Herdado da consulta**.
- Os campos devem permanecer editáveis.
- A ação principal da configuração deve ser **Gerar documentos**.
- Depois da primeira geração, deve existir a ação secundária **Reconfigurar
  pacote**.
- A aba não deve apresentar um número isolado de documentos.
- A interface deve distinguir documentos sugeridos, selecionados, em produção e
  aprovados por meio de seu contexto, sem um contador ambíguo.

---

### Produção e revisão dos documentos

- [ ] **Acompanhar cada documento até sua aprovação**

**Descrição:** O advogado deve compreender o estado de cada documento do pacote e
decidir se aprova, solicita nova geração ou passa para redação manual.

#### Regras de negócio

- Cada documento incluído deve apresentar seu estado atual.
- Os estados relevantes para o advogado são:
  - gerando;
  - aguardando informações;
  - em revisão;
  - em preenchimento manual;
  - falha na geração;
  - aprovado.
- Um documento gerado deve ser revisado por uma pessoa antes de ser aprovado.
- Aprovar deve registrar quem aprovou e quando.
- Rejeitar um texto gerado deve deixar claro que o documento seguirá para edição
  manual.
- A redação manual pode voltar para uma nova geração assistida.
- Voltar à geração não deve apagar silenciosamente o trabalho anterior.
- Uma falha na geração deve permitir nova tentativa ou início de redação manual.
- Um documento aguardando informações deve indicar o que falta.
- Documento aprovado não deve ser alterado dentro de um pacote confirmado.
- A decisão sobre um documento não aprova automaticamente os demais.

#### Regras de UI/UX

- O estado deve ser apresentado por texto, não apenas por cor.
- Ao rejeitar um texto gerado, a confirmação deve dizer:
  **O documento passará para edição manual**.
- Enquanto estiver em edição manual, deve existir uma ação para **Gerar novamente
  com IA**.
- A nova geração deve exigir confirmação e explicar que o histórico será
  preservado.
- Documento em revisão deve apresentar ações claras de aprovação e rejeição.
- Falhas devem oferecer próximos passos acionáveis.
- Documento aprovado deve apresentar visualmente sua aprovação sem depender
  apenas de um ícone.

---

### Confirmação do pacote

- [ ] **Confirmar o pacote quando todos os documentos estiverem aprovados**

**Descrição:** O advogado deve confirmar que o conjunto de documentos da consulta
está completo e aprovado.

#### Regras de negócio

- Um pacote vazio não pode ser confirmado.
- Todos os documentos incluídos devem estar aprovados.
- A confirmação não pode ocorrer enquanto houver documento:
  - gerando;
  - aguardando informações;
  - em revisão;
  - em preenchimento manual;
  - com falha.
- A confirmação deve registrar quem confirmou e quando.
- Um pacote confirmado não pode ser confirmado novamente.
- Documentos aprovados dentro do pacote confirmado devem permanecer preservados.
- Reconfigurar antes da confirmação pode adicionar documentos.
- Adicionar um documento faz o pacote voltar a depender da aprovação de todos.
- A confirmação deve liberar a próxima etapa do atendimento definida pela HMS.
- A regra deve valer mesmo quando a ação não for iniciada pela tela principal.

#### Regras de UI/UX

- A ação principal deve ser **Confirmar pacote**.
- A ação deve permanecer indisponível enquanto houver documento não aprovado.
- O motivo deve ser apresentado como:
  **Aprove todos os documentos para confirmar o pacote.**
- Depois da confirmação, a tela deve mostrar quem confirmou e a data.
- A interface não deve oferecer novamente a ação de confirmação.
- A confirmação deve explicar qual etapa será liberada.

---

### Conclusão da consulta

- [ ] **Finalizar uma consulta realizada**

**Descrição:** O advogado deve concluir a consulta quando o atendimento tiver
terminado e a ficha possuir as informações mínimas.

#### Regras de negócio

- Somente consulta **Em andamento** pode ser concluída.
- A questão jurídica principal é obrigatória.
- A orientação prestada ao cliente é obrigatória.
- Área e tema devem estar definidos.
- A modalidade deve estar definida.
- Consulta virtual deve possuir canal.
- Não pode haver sugestão pendente na ficha.
- Fatos, pedidos, riscos e observações podem permanecer vazios.
- O horário da conclusão deve ser registrado.
- O horário da conclusão não pode ser anterior ao início.
- Depois da conclusão, a consulta deve permanecer disponível para leitura.
- A conclusão não abre automaticamente um caso.
- A conclusão não representa contratação do cliente.
- O pacote de documentos segue sua própria confirmação.
- Quando a HMS decidir que o pacote é obrigatório para avançar, a pendência deve
  ser apresentada claramente antes da próxima etapa.

#### Regras de UI/UX

- O botão **Concluir consulta** deve indicar as pendências que impedem a ação.
- Campos obrigatórios ausentes devem ser destacados.
- Sugestões pendentes devem direcionar o advogado às seções correspondentes.
- A confirmação deve explicar que a ficha deixará o modo de preenchimento comum.
- Depois da conclusão, a tela deve apresentar um resumo de leitura.
- A próxima ação deve indicar o destino do atendimento, sem presumir abertura de
  caso.

---

### Consulta e histórico

- [ ] **Permitir leitura posterior sem perder o contexto**

**Descrição:** Colaboradores autorizados devem conseguir localizar e compreender
consultas anteriores.

#### Regras de negócio

- Consultas devem poder ser localizadas por cliente.
- Devem poder ser filtradas por advogado, data, estado, área e tema.
- Consultas concluídas e não comparecimentos devem continuar disponíveis.
- O histórico deve preservar início, conclusão ou não comparecimento.
- O conteúdo final da ficha deve permanecer legível.
- Decisões sobre sugestões devem permanecer rastreáveis sem exibir rejeitados na
  ficha operacional.
- O estado do pacote deve permanecer visível.
- Dados do cliente devem ser acessados somente por pessoas autorizadas.
- A consulta não deve ser excluída pelo fluxo comum do MVP.

#### Regras de UI/UX

- A listagem deve mostrar cliente, advogado, data, estado, área e tema.
- Filtros ativos devem ficar visíveis.
- Consultas concluídas devem abrir em modo de leitura.
- Conteúdo rejeitado não deve aparecer como seção da ficha.
- O histórico complementar deve ficar acessível sem tornar a tela principal
  excessivamente densa.

---

## 4. Regras Gerais

### 4.1 Responsabilidade profissional

- Sugestões nunca substituem a análise do advogado.
- Conteúdo sugerido depende de aceitação ou rejeição.
- A versão final da ficha é responsabilidade do profissional que conduz a
  consulta.
- Possíveis pedidos não representam garantia de adoção ou êxito.
- Riscos devem ser descritos de forma compreensível.
- A orientação registrada deve corresponder ao que foi comunicado ao cliente.
- Documentos gerados precisam de revisão humana antes da aprovação.

### 4.2 Privacidade

- Somente colaboradores autorizados podem acessar o conteúdo da consulta.
- Dados do cliente devem ser apresentados apenas na medida necessária.
- Informações sensíveis não devem aparecer em mensagens de erro ou listagens
  amplas.
- A ficha deve evitar repetição desnecessária de dados pessoais.
- O conteúdo da consulta não deve ser disponibilizado externamente sem uma
  decisão própria de liberação.

### 4.3 Integridade do atendimento

- Uma consulta não pode existir duas vezes para o mesmo agendamento.
- Início, conclusão e não comparecimento devem respeitar sua ordem.
- Área e tema devem ser compatíveis.
- Consulta virtual exige canal.
- Conclusão exige questão jurídica principal e orientação.
- Sugestões pendentes impedem a conclusão.
- Confirmação do pacote exige todos os documentos aprovados.
- Ações repetidas não devem duplicar consultas, fatos, pedidos, riscos ou
  documentos.

### 4.4 Linguagem e acessibilidade

- A interface deve ser profissional, sóbria e acolhedora.
- Estados não podem depender somente de cor.
- Campos devem possuir rótulos claros.
- Ações críticas devem explicar seus efeitos.
- Sugestões devem usar somente o marcador **Sugerido**.
- Controles de aceitar, rejeitar, editar e desfazer devem funcionar por teclado.
- O foco deve permanecer visível.
- A tela deve mostrar primeiro o necessário para a tarefa atual.

---

## 5. Fluxos de Usuário

### Fluxo — Advogado prepara a consulta

1. O advogado abre o horário marcado.
2. A HMS apresenta cliente, data, horário, modalidade e estado.
3. O advogado consulta a qualificação completa.
4. Confirma ou ajusta área e tema.
5. Revisa informações já disponíveis.
6. A consulta permanece **Pendente** até o início.

### Fluxo — Advogado inicia e conduz a consulta

1. O advogado seleciona **Iniciar consulta**.
2. A consulta passa para **Em andamento**.
3. O advogado conversa com o cliente.
4. Registra ou revisa a questão jurídica principal.
5. Adiciona fatos e datas relevantes.
6. Registra possíveis pedidos.
7. Registra riscos.
8. Escreve a orientação prestada.
9. Inclui observações quando necessário.

### Fluxo — Advogado revisa uma sugestão

1. A ficha apresenta um item com o marcador **Sugerido**.
2. O advogado lê o conteúdo.
3. Pode editar o texto.
4. Ao aceitar, o item vira conteúdo comum e perde o marcador.
5. Ao rejeitar, o item sai da lista.
6. A tela oferece **Desfazer** temporariamente.
7. Se não desfizer, a sugestão permanece fora da ficha e não volta a ser
   apresentada de forma idêntica.

### Fluxo — Advogado registra fato manual

1. O advogado abre **Fatos relevantes e cronologia**.
2. Seleciona **Adicionar fato**.
3. Informa a descrição.
4. Informa a data, quando conhecida.
5. Confirma.
6. O fato aparece como item comum, sem marcador.

### Fluxo — Advogado registra possível pedido

1. O advogado abre **Possíveis pedidos jurídicos**.
2. Seleciona **Adicionar pedido**.
3. Uma janela de criação é aberta.
4. O advogado informa a descrição.
5. Confirma.
6. O pedido aparece sem marcador.

### Fluxo — Cliente não comparece

1. O horário chega e o cliente não participa.
2. O advogado seleciona **Marcar não comparecimento**.
3. A interface explica que uma nova tentativa exige outro agendamento.
4. O advogado confirma.
5. A consulta passa para **Não compareceu**.
6. A tela oferece retorno à agenda ou ao cadastro do cliente.

### Fluxo — Advogado configura o pacote

1. O advogado abre **Pacote de documentos da consulta**.
2. A área e o tema aparecem preenchidos com os valores da consulta.
3. O advogado mantém ou altera os critérios.
4. A HMS apresenta os documentos aplicáveis.
5. O advogado seleciona os documentos.
6. Seleciona **Gerar documentos**.
7. A produção de cada documento passa a ser acompanhada no painel.
8. A classificação da consulta permanece inalterada.

### Fluxo — Advogado rejeita um texto gerado

1. Um documento fica disponível para revisão.
2. O advogado lê o conteúdo.
3. Seleciona **Rejeitar**.
4. A interface informa que o documento passará para edição manual.
5. O advogado confirma.
6. O documento entra em preenchimento manual.
7. O histórico do conteúdo anterior é preservado.

### Fluxo — Documento manual volta para geração assistida

1. O documento está em preenchimento manual.
2. O advogado seleciona **Gerar novamente com IA**.
3. A interface explica que o histórico será preservado.
4. O advogado confirma.
5. O documento volta para geração.
6. O novo conteúdo precisará de revisão e aprovação.

### Fluxo — Advogado reconfigura o pacote

1. Já existem documentos no pacote.
2. O advogado seleciona **Reconfigurar pacote**.
3. Altera área ou tema usados na busca.
4. Recebe novas sugestões.
5. Seleciona documentos adicionais.
6. Confirma a geração.
7. Documentos anteriores permanecem no pacote.
8. Todos os documentos precisam estar aprovados para a confirmação final.

### Fluxo — Advogado confirma o pacote

1. O advogado revisa o estado de todos os documentos.
2. Enquanto existir documento não aprovado, **Confirmar pacote** permanece
   indisponível.
3. O advogado aprova o último documento pendente.
4. A ação é habilitada.
5. O advogado seleciona **Confirmar pacote**.
6. A interface explica a consequência.
7. O advogado confirma.
8. O pacote passa a ser apresentado como confirmado.
9. A próxima etapa do atendimento é liberada.

### Fluxo — Advogado conclui a consulta

1. O advogado seleciona **Concluir consulta**.
2. A HMS verifica área, tema, modalidade e canal aplicável.
3. Verifica a questão jurídica principal.
4. Verifica a orientação prestada.
5. Verifica se existem sugestões pendentes.
6. Se houver pendências, direciona o advogado aos campos.
7. Sem pendências, apresenta a confirmação.
8. O advogado confirma.
9. A consulta passa para **Concluída**.
10. A ficha fica disponível para leitura e continuidade do atendimento.

---

## 6. Critérios de Aceite do MVP

O módulo estará apto para o MVP quando:

- uma consulta for preparada a partir de um agendamento válido;
- o mesmo agendamento não gerar duas consultas;
- cliente, advogado, data e horário forem apresentados corretamente;
- a qualificação completa do cliente estiver disponível;
- área e tema forem obrigatórios e compatíveis;
- consulta presencial não exigir canal;
- consulta virtual exigir canal;
- o advogado conseguir iniciar uma consulta pendente;
- uma consulta iniciada puder ser concluída;
- uma consulta pendente puder ser marcada como não comparecimento;
- questão jurídica principal e orientação forem obrigatórias na conclusão;
- fatos aceitarem descrição e data opcional;
- possíveis pedidos e riscos puderem ser adicionados manualmente;
- sugestões exigirem aceitação ou rejeição;
- aceitar remover o marcador **Sugerido**;
- rejeitar remover o item e oferecer **Desfazer** temporariamente;
- itens aceitos não exibirem o marcador **Aceito**;
- itens rejeitados não formarem uma lista visível;
- os marcadores **Comprovado** e **A comprovar** não forem usados;
- o campo **Síntese** não existir;
- a seção **Documentos a solicitar** não existir;
- **Orientação prestada ao cliente** e **Observações** permanecerem na ficha;
- o pacote iniciar com área e tema iguais aos da consulta;
- alterar os critérios do pacote não alterar a consulta;
- o advogado conseguir reconfigurar o pacote;
- documentos anteriores não serem removidos silenciosamente;
- rejeitar um texto gerado informar a mudança para edição manual;
- um documento manual puder voltar para geração assistida;
- somente documentos aprovados permitirem confirmar o pacote;
- um pacote vazio não puder ser confirmado;
- consultas concluídas permanecerem disponíveis para leitura.

---

## 7. Indicadores de Produto e Operação

- quantidade de consultas pendentes, em andamento, concluídas e com não
  comparecimento;
- percentual de consultas iniciadas em relação aos agendamentos;
- tempo médio entre horário marcado e início;
- duração média das consultas concluídas;
- percentual de consultas impedidas de concluir por campo obrigatório ausente;
- quantidade média de fatos por consulta;
- quantidade média de possíveis pedidos e riscos;
- percentual de sugestões aceitas, editadas e rejeitadas;
- quantidade de vezes em que uma rejeição foi desfeita;
- percentual de consultas com pacote de documentos;
- tempo médio entre geração e aprovação de documento;
- percentual de documentos que passaram para edição manual;
- percentual de documentos manuais que voltaram para geração assistida;
- tempo médio para confirmação do pacote;
- quantidade de pacotes impedidos de confirmar por documento pendente.

Os indicadores devem ser apresentados de forma agrupada sempre que não houver
necessidade de identificar cliente ou advogado.

---

## 8. Relação com Outras Áreas do Produto

### Identidade

- fornece o cliente e o advogado;
- mantém a qualificação do cliente;
- mantém o perfil e as especialidades do colaborador;
- controla quem pode acessar a consulta.

### Agenda

- define cliente, advogado, data e horário;
- cuida de marcação, cancelamento e remarcação;
- não registra o conteúdo jurídico do atendimento.

### Catálogo Jurídico

- mantém as áreas e os temas disponíveis;
- garante que o tema pertença à área;
- orienta a classificação da consulta e a busca de documentos.

### Produção de Documentos

- mantém modelos e configurações de pacotes;
- produz versões manuais e assistidas;
- acompanha revisão e aprovação;
- confirma o pacote somente quando todos os documentos estiverem aprovados.

### Formalização

- recebe o resultado da consulta quando o cliente prossegue;
- realiza as etapas necessárias antes da abertura de um caso;
- não altera a ficha da consulta.

### Casos

- é aberto somente quando as condições de contratação forem atendidas;
- não é criado automaticamente pela conclusão da consulta;
- pode consultar informações liberadas da consulta.

### Comunicação

- cuida das mensagens relacionadas à consulta;
- respeita os consentimentos do cliente;
- não altera o conteúdo jurídico da ficha.

---

## 9. Fora do Escopo

- cálculo de disponibilidade;
- configuração da agenda;
- marcação, cancelamento ou remarcação de horários;
- cadastro principal do cliente;
- gestão dos perfis dos colaboradores;
- criação e manutenção de áreas e temas;
- campo separado de síntese;
- seção de documentos a solicitar;
- comprovação ou vinculação de evidências aos fatos;
- marcadores **Aceito**, **Comprovado** ou **A comprovar**;
- lista operacional de sugestões rejeitadas;
- aceitação automática de sugestões;
- conclusão automática da consulta;
- abertura automática de caso;
- contratação ou formalização automática;
- cobrança da consulta;
- gravação de áudio ou vídeo;
- transcrição integral da conversa;
- assinatura do cliente sobre a orientação;
- múltiplos advogados responsáveis no MVP;
- múltiplos temas principais na mesma consulta;
- reabertura de consulta concluída;
- correção de não comparecimento sem um fluxo específico;
- exclusão definitiva de consulta;
- compartilhamento externo da ficha;
- criação e manutenção dos modelos de documentos dentro da consulta.

---

## 10. Perguntas Pendentes

1. Somente o advogado responsável pode editar e concluir a consulta, ou um
   supervisor também poderá assumir essas ações?
2. Uma consulta poderá ser iniciada antes do horário marcado? Se sim, qual
   antecedência será permitida?
3. Depois de concluída, haverá um fluxo formal de correção ou complementação da
   ficha?
4. Um não comparecimento poderá ser corrigido caso tenha sido registrado por
   engano?
5. A confirmação do pacote de documentos será obrigatória para concluir a
   consulta ou somente para avançar à formalização?
6. Quando nenhum documento for necessário, deverá existir uma decisão explícita
   de **Consulta sem pacote de documentos**?
7. Quem pode aprovar documentos do pacote: somente advogado, advogado responsável
   ou também supervisor?
8. A área e o tema podem ser alterados depois da conclusão?
9. O campo **Outro** para canal virtual exige descrição obrigatória?
10. Qual deve ser a próxima ação apresentada depois da conclusão: encerrar
    atendimento, iniciar formalização ou escolher entre destinos?

Até essas decisões serem respondidas, este PRD considera que:

- o advogado responsável edita e conclui a consulta;
- a consulta é iniciada no contexto do horário marcado;
- consultas concluídas ficam disponíveis apenas para leitura;
- não comparecimento não é corrigido pela tela comum;
- a conclusão da consulta e a confirmação do pacote são decisões separadas;
- quando nenhum documento for necessário, a consulta pode ser concluída sem
  pacote;
- somente advogado autorizado aprova documentos;
- área e tema não são alterados depois da conclusão;
- o canal **Outro** exige uma descrição;
- a conclusão apresenta opções de continuidade sem escolher automaticamente o
  destino.
