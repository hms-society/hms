# PRD — Módulo de Agendamento

---

## 1. Visão Geral

O módulo de **Agendamento** organiza quando os advogados podem atender e permite
que clientes sejam vinculados a horários disponíveis.

Cada advogado possui uma agenda própria, formada por:

- duração padrão da consulta;
- fuso horário;
- disponibilidade semanal;
- bloqueios por intervalo de datas;
- consultas já marcadas.

A partir dessas informações, a HMS apresenta horários realmente disponíveis para
marcação. O atendente escolhe o cliente, o advogado, a data e o horário. Depois da
confirmação, a consulta jurídica correspondente pode ser preparada.

O módulo também permite cancelar ou remarcar horários. Ele não registra o
conteúdo jurídico, a orientação prestada ou o não comparecimento do cliente.
Essas informações pertencem à Consulta.

### Objetivo

Permitir que a HMS marque consultas sem conflito, respeitando a rotina de cada
advogado e oferecendo ao atendente uma visão confiável dos horários disponíveis.

### Problema resolvido

Sem uma agenda central, o escritório corre o risco de marcar duas consultas no
mesmo horário, oferecer horários fora da jornada do advogado, ignorar férias e
compromissos ou perder a relação entre cliente, advogado e consulta.

Mudanças de disponibilidade também podem causar confusão quando alteram
silenciosamente horários já marcados. O módulo deve diferenciar claramente a
regra usada para novos agendamentos dos compromissos que já foram confirmados.

### Valor entregue

- agenda individual para cada advogado;
- duração padrão de consulta;
- disponibilidade recorrente por dia da semana;
- vários intervalos de atendimento no mesmo dia;
- bloqueios por intervalo de datas completas;
- cálculo confiável dos horários disponíveis;
- prevenção de conflitos;
- marcação vinculada a cliente cadastrado;
- cancelamento e remarcação;
- continuidade entre agendamento e consulta;
- histórico dos horários confirmados e alterados.

### Contexto do MVP

O fluxo principal começa quando um atendente autenticado cadastra ou localiza o
cliente. Em seguida, escolhe um advogado e consulta seus horários disponíveis. O
cliente deve sair do primeiro contato com os dados essenciais cadastrados e uma
consulta marcada.

O advogado configura sua disponibilidade semanal e registra bloqueios para
férias, audiências ou outros períodos em que não poderá atender. Os bloqueios do
MVP ocupam dias inteiros e são definidos apenas por uma data inicial e uma data
final.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- criar uma agenda para cada advogado;
- definir o fuso horário da agenda;
- definir a duração padrão das consultas;
- registrar disponibilidade semanal;
- permitir vários intervalos no mesmo dia;
- impedir intervalos inválidos ou sobrepostos;
- registrar bloqueios por intervalo de datas;
- considerar a data final do bloqueio como parte do período bloqueado;
- remover bloqueios futuros quando permitido;
- calcular horários disponíveis;
- considerar consultas já marcadas;
- impedir dupla marcação;
- marcar uma consulta para um cliente;
- cancelar uma marcação;
- remarcar uma marcação;
- preservar a relação entre a marcação e a consulta;
- apresentar a agenda diária e semanal;
- preservar o histórico das alterações relevantes.

### 2.2 Responsabilidades que pertencem a outros módulos

- cadastrar clientes;
- cadastrar advogados;
- definir os perfis e especialidades dos colaboradores;
- criar e manter áreas e temas jurídicos;
- registrar o conteúdo da consulta;
- marcar não comparecimento;
- registrar a orientação prestada ao cliente;
- enviar confirmações e lembretes;
- cobrar pela consulta;
- administrar prazos, audiências e tarefas dos casos.

### 2.3 Conceitos de negócio

#### Agenda

Representa a organização de horários de um advogado. Reúne fuso horário, duração
padrão, disponibilidade semanal e bloqueios.

#### Disponibilidade semanal

Representa os períodos recorrentes em que o advogado aceita novas consultas em
cada dia da semana.

#### Bloqueio

Representa um intervalo inclusivo de datas inteiras em que o advogado não aceita
novas consultas.

#### Horário disponível

É um período que cabe na disponibilidade semanal, não está bloqueado, não está no
passado e não entra em conflito com uma consulta já marcada.

#### Agendamento

É a reserva de um horário específico para um cliente na agenda de um advogado.

---

## 3. Requisitos

### Criação da agenda do advogado

- [ ] **Disponibilizar uma agenda individual**

**Descrição:** Todo advogado que atender consultas deve possuir uma agenda própria
antes de receber marcações.

#### Regras de negócio

- Cada advogado pode possuir somente uma agenda ativa no MVP.
- A agenda só pode ser criada para colaborador com perfil de advogado.
- O advogado precisa possuir acesso ativo.
- A criação deve definir fuso horário e duração padrão.
- A agenda pode ser criada inicialmente sem disponibilidade semanal.
- Agenda sem disponibilidade não oferece horários.
- Criar a agenda não marca consultas automaticamente.
- Desabilitar o acesso do advogado impede novas marcações.
- A agenda e os agendamentos anteriores devem permanecer consultáveis quando o
  advogado deixar de atender.
- Uma tentativa repetida não deve criar uma segunda agenda.

#### Regras de UI/UX

- A gestão do advogado deve indicar se sua agenda já foi configurada.
- Quando não houver configuração, a ação principal deve ser **Configurar
  agenda**.
- A interface deve explicar que horários só aparecerão depois de informar a
  disponibilidade.
- O nome do advogado deve permanecer visível durante a configuração.
- A criação e a edição devem usar a mesma organização de campos.

---

### Responsabilidade pela configuração

- [ ] **Permitir que o advogado organize sua própria disponibilidade**

**Descrição:** O advogado deve conseguir manter sua duração padrão,
disponibilidade e bloqueios.

#### Regras de negócio

- Advogado ativo pode configurar a própria agenda.
- Um advogado não pode alterar a agenda de outro advogado.
- Administradores podem consultar as agendas.
- Alterações administrativas em nome do advogado dependem de permissão
  específica.
- Atendentes podem consultar horários disponíveis, mas não alteram a
  disponibilidade semanal no fluxo comum.
- Atendentes podem marcar, cancelar e remarcar conforme suas permissões.
- Toda alteração de configuração deve permitir identificar quem a realizou e
  quando.
- A ausência de permissão deve impedir a ação.

#### Regras de UI/UX

- O advogado deve encontrar sua agenda em **Minha agenda**.
- A tela deve separar **Disponibilidade semanal**, **Bloqueios** e **Consultas
  marcadas**.
- Atendentes devem visualizar a disponibilidade no contexto da marcação, sem
  receber controles de configuração.
- A interface deve explicar quando uma ação depende do administrador.

---

### Fuso horário

- [ ] **Interpretar horários no local correto**

**Descrição:** A agenda deve possuir um fuso horário para que disponibilidade e
marcações sejam apresentadas de forma coerente.

#### Regras de negócio

- Toda agenda deve possuir um fuso horário.
- A disponibilidade semanal deve ser interpretada no fuso da agenda.
- Os horários apresentados ao advogado devem respeitar o fuso de sua agenda.
- Alterar o fuso não deve deslocar silenciosamente consultas já marcadas.
- Uma alteração deve valer para o cálculo de novos horários.
- Consultas já marcadas devem manter seu instante confirmado.
- A mudança de fuso deve exigir confirmação quando houver agendamentos futuros.
- O fuso padrão da HMS pode preencher inicialmente o campo.

#### Regras de UI/UX

- O fuso deve aparecer na configuração da agenda.
- A tela de marcação deve indicar o fuso quando houver possibilidade de dúvida.
- A alteração deve explicar o impacto sobre novos horários.
- Quando existirem consultas futuras, a confirmação deve recomendar revisão.
- A interface deve evitar abreviações ambíguas.

---

### Duração padrão da consulta

- [ ] **Definir quanto tempo uma consulta ocupa por padrão**

**Descrição:** Cada agenda deve possuir uma duração usada para montar os horários
oferecidos.

#### Regras de negócio

- A duração padrão é obrigatória.
- A duração deve ser maior que zero.
- A duração precisa caber integralmente no intervalo disponível.
- Alterar a duração vale para novos horários.
- A alteração não modifica consultas já marcadas.
- Horários que deixarem de comportar a nova duração não devem ser oferecidos.
- A duração não pode produzir um término depois do fim da disponibilidade.
- A duração específica de uma marcação só pode ser diferente do padrão quando a
  HMS autorizar essa exceção.

#### Regras de UI/UX

- O campo deve se chamar **Duração padrão da consulta**.
- A unidade deve ser apresentada em minutos.
- Exemplos comuns podem ser oferecidos como opções.
- A interface deve explicar que a mudança não altera consultas existentes.
- Valores inválidos devem receber orientação de correção.

---

### Disponibilidade semanal

- [ ] **Definir em quais dias e horários o advogado atende**

**Descrição:** O advogado deve informar os intervalos recorrentes em que aceita
consultas.

#### Regras de negócio

- A semana deve considerar segunda-feira a domingo.
- Cada dia pode estar disponível ou indisponível.
- Dia disponível deve possuir pelo menos um intervalo.
- Cada intervalo deve possuir horário inicial e final.
- O horário final deve ser posterior ao inicial.
- A disponibilidade se repete semanalmente até ser alterada.
- A agenda pode possuir dias sem atendimento.
- Alterar a disponibilidade vale para novos horários.
- Consultas já marcadas não devem ser canceladas automaticamente.
- Disponibilidade não garante horário quando houver bloqueio ou outra consulta.

#### Regras de UI/UX

- Cada dia deve possuir um controle claro de disponibilidade.
- Dias indisponíveis não devem exigir horários.
- Dias disponíveis devem apresentar seus intervalos.
- A ação **Adicionar intervalo** deve ficar junto ao dia correspondente.
- A tela deve apresentar um resumo semanal antes de salvar.
- Horários devem usar formato local consistente.

---

### Vários intervalos no mesmo dia

- [ ] **Permitir pausas entre períodos de atendimento**

**Descrição:** O advogado deve conseguir informar mais de um intervalo no mesmo
dia, como manhã e tarde.

#### Regras de negócio

- Um dia pode possuir vários intervalos.
- Intervalos do mesmo dia não podem se sobrepor.
- Um intervalo não pode conter outro.
- Intervalos consecutivos podem ser mantidos separados ou unidos conforme a
  escolha do advogado.
- Remover um intervalo não remove os demais.
- Remover o último intervalo torna o dia indisponível.
- A duração padrão deve caber no intervalo para que ele produza horários.
- A ordem dos intervalos deve seguir o horário inicial.

#### Regras de UI/UX

- Cada intervalo deve mostrar início, fim e ação de remoção.
- A lista deve permanecer em ordem cronológica.
- Sobreposições devem ser identificadas no próprio dia.
- A interface deve explicar quando um intervalo é curto demais para a duração
  padrão.
- Adicionar e remover devem produzir feedback imediato.

---

### Validação da disponibilidade

- [ ] **Impedir uma configuração semanal inconsistente**

**Descrição:** A HMS deve verificar a disponibilidade antes de oferecê-la para
marcações.

#### Regras de negócio

- Horário inicial e final são obrigatórios em cada intervalo.
- O fim deve ser posterior ao início.
- Intervalos não podem se sobrepor.
- Intervalos devem pertencer ao mesmo dia em que foram cadastrados.
- Um dia disponível não pode ficar sem intervalo.
- Uma configuração inválida não deve substituir a configuração vigente.
- Salvar a mesma configuração sem mudanças não deve criar alteração fictícia.
- A validação deve considerar a duração padrão atual.

#### Regras de UI/UX

- O erro deve aparecer junto ao intervalo correspondente.
- A interface deve preservar os demais horários preenchidos.
- O resumo deve indicar quais dias precisam de correção.
- **Salvar disponibilidade** deve permanecer indisponível quando houver erro.
- A mensagem deve explicar o problema, como **Os horários não podem se
  sobrepor**.

---

### Bloqueio por intervalo de datas

- [ ] **Impedir novas consultas durante uma ausência**

**Descrição:** O advogado deve bloquear dias inteiros usando somente uma data
inicial e uma data final.

#### Regras de negócio

- Todo bloqueio deve possuir data inicial.
- Todo bloqueio deve possuir data final.
- A data final deve ser igual ou posterior à inicial.
- A data inicial faz parte do bloqueio.
- A data final também faz parte do bloqueio.
- Um bloqueio de um único dia usa a mesma data no início e no fim.
- O bloqueio ocupa o dia inteiro.
- Não existem horários inicial e final dentro do dia no MVP.
- O motivo é opcional.
- Todo horário dentro das datas bloqueadas deve deixar de ser oferecido.
- O bloqueio vale mesmo que a disponibilidade semanal indique atendimento.
- Bloqueios não devem cancelar consultas existentes automaticamente.

#### Regras de UI/UX

- O formulário deve apresentar somente **Data inicial**, **Data final** e
  **Motivo**.
- Não deve existir alternativa entre dia único e intervalo.
- Não devem existir campos de horário.
- A interface deve explicar que a data final está incluída.
- Para um único dia, o usuário pode selecionar a mesma data nos dois campos.
- A ação principal deve ser **Adicionar bloqueio**.

---

### Gestão dos bloqueios

- [ ] **Consultar e remover períodos bloqueados**

**Descrição:** O advogado deve visualizar seus bloqueios e retirar um período
quando voltar a estar disponível.

#### Regras de negócio

- Bloqueios futuros devem permanecer visíveis.
- Cada bloqueio deve apresentar data inicial, data final e motivo, quando
  informado.
- Períodos sobrepostos não devem ser cadastrados como bloqueios independentes no
  fluxo comum.
- Um bloqueio futuro pode ser removido.
- Remover um bloqueio permite que novos horários voltem a ser calculados.
- A remoção não cria consultas automaticamente.
- Bloqueios passados devem permanecer disponíveis no histórico quando necessário.
- Remover um bloqueio não altera consultas já marcadas.
- A remoção deve registrar quem a realizou e quando.

#### Regras de UI/UX

- A lista deve priorizar bloqueios futuros.
- Um bloqueio de um dia deve mostrar uma única data de forma clara.
- Intervalos devem mostrar início e fim.
- O motivo não informado deve aparecer como **Sem motivo informado** apenas
  quando necessário.
- A remoção deve exigir confirmação.
- A confirmação deve explicar que horários poderão voltar a ficar disponíveis.

---

### Proteção de consultas diante de novos bloqueios

- [ ] **Evitar que um bloqueio esconda compromissos já marcados**

**Descrição:** Ao bloquear um período com consultas existentes, a HMS deve
apresentar o conflito antes da conclusão.

#### Regras de negócio

- A HMS deve verificar consultas futuras dentro do intervalo.
- Um bloqueio não pode cancelar essas consultas silenciosamente.
- O advogado deve ser informado sobre cada conflito.
- O bloqueio só pode ser concluído depois que os conflitos forem resolvidos ou
  uma política de exceção for aplicada.
- Remarcar uma consulta deve voltar a verificar disponibilidade.
- Cancelar uma consulta deve seguir o fluxo próprio de cancelamento.
- Consultas fora do bloqueio não devem ser afetadas.
- Bloqueios sem conflito podem ser adicionados imediatamente.

#### Regras de UI/UX

- A confirmação deve mostrar quantas consultas serão afetadas.
- Deve ser possível abrir os compromissos conflitantes.
- A interface deve oferecer caminhos para remarcar ou cancelar.
- O bloqueio não deve parecer concluído enquanto houver pendências.
- Nenhuma consulta deve desaparecer da agenda como consequência visual do
  bloqueio.

---

### Cálculo dos horários disponíveis

- [ ] **Apresentar somente horários realmente livres**

**Descrição:** A HMS deve combinar as regras da agenda para determinar quais
horários podem ser marcados.

#### Regras de negócio

- O horário deve estar dentro da disponibilidade semanal.
- A duração precisa caber integralmente no intervalo.
- A data não pode estar bloqueada.
- O período não pode se sobrepor a consulta marcada.
- Consulta cancelada não ocupa mais o horário.
- Horários passados não devem ser oferecidos.
- O fuso horário da agenda deve ser respeitado.
- Horários adjacentes podem ser oferecidos quando não há sobreposição.
- A disponibilidade deve ser verificada novamente na confirmação.
- Alterações de agenda devem refletir nos próximos resultados.
- A ausência de horários deve ser uma resposta válida, e não uma falha.

#### Regras de UI/UX

- Horários devem ser agrupados por data.
- O dia sem horário deve ser distinguido de uma falha de carregamento.
- O fuso deve ser apresentado quando relevante.
- A duração considerada deve permanecer visível.
- O usuário deve conseguir avançar para outra data sem reiniciar todo o fluxo.
- Horários indisponíveis não devem parecer selecionáveis.

---

### Consulta de disponibilidade

- [ ] **Permitir que o atendente encontre um horário adequado**

**Descrição:** O atendente deve consultar a agenda do advogado dentro de um
intervalo de datas.

#### Regras de negócio

- A consulta exige cliente cadastrado ou contexto autorizado de atendimento.
- O advogado deve possuir agenda configurada.
- O advogado precisa estar ativo para novas marcações.
- O intervalo de busca deve possuir data inicial e final.
- A data final não pode ser anterior à inicial.
- A busca pode considerar a duração padrão.
- Quando permitido, uma duração diferente deve recalcular os horários.
- O resultado deve mostrar somente horários disponíveis.
- Buscar disponibilidade não reserva o horário.
- Nenhum cliente deve ser marcado apenas por selecionar uma opção.

#### Regras de UI/UX

- O fluxo deve mostrar o advogado selecionado.
- A data e a duração devem poder ser revistas.
- Selecionar um horário deve levar a uma etapa de confirmação.
- A interface deve apresentar estado vazio com orientação para ampliar o período
  ou escolher outro advogado.
- O atendente deve conseguir voltar sem perder o cliente selecionado.

---

### Marcação da consulta

- [ ] **Reservar um horário para um cliente**

**Descrição:** O atendente deve confirmar a marcação depois de escolher cliente,
advogado, data e horário.

#### Regras de negócio

- O cliente deve estar cadastrado.
- O advogado deve possuir agenda e acesso ativo.
- O horário deve continuar disponível no momento da confirmação.
- O início deve ser anterior ao término.
- A duração deve corresponder à duração escolhida.
- A marcação não pode estar no passado.
- O período não pode estar bloqueado.
- O período não pode se sobrepor a outra consulta.
- A confirmação deve criar apenas uma marcação.
- A marcação deve iniciar como **Agendada**.
- O agendamento deve preservar cliente, advogado, início e término.
- Depois da marcação, a consulta jurídica correspondente pode ser preparada.

#### Regras de UI/UX

- A confirmação deve apresentar:
  - cliente;
  - advogado;
  - data;
  - horário inicial e final;
  - duração;
  - fuso, quando relevante.
- A ação principal deve ser **Confirmar agendamento**.
- A interface não deve confirmar antes da ação explícita.
- O sucesso deve apresentar próximos passos.
- Se o horário tiver sido ocupado, a interface deve explicar o conflito e
  oferecer novos horários.

---

### Prevenção de conflito

- [ ] **Impedir dupla marcação**

**Descrição:** Duas pessoas não podem reservar períodos sobrepostos na mesma
agenda.

#### Regras de negócio

- A disponibilidade deve ser verificada novamente na confirmação.
- Duas confirmações simultâneas não podem ocupar o mesmo horário.
- Sobreposição parcial também deve ser impedida.
- Um agendamento que termina exatamente quando outro começa não é conflito.
- Um agendamento que começa exatamente quando outro termina não é conflito.
- Agendamentos cancelados não geram conflito.
- Em caso de disputa, somente uma confirmação pode ser concluída.
- A pessoa que perder o horário deve receber opções atualizadas.

#### Regras de UI/UX

- A mensagem deve informar que o horário não está mais disponível.
- O cliente e os demais dados escolhidos devem ser preservados.
- A interface deve atualizar os horários.
- A ação principal deve orientar a selecionar outra opção.
- A falha não deve criar uma marcação parcial ou duplicada.

---

### Visualização da agenda

- [ ] **Acompanhar consultas marcadas e períodos indisponíveis**

**Descrição:** Advogados e colaboradores autorizados devem visualizar a agenda de
forma diária ou semanal.

#### Regras de negócio

- A agenda deve apresentar consultas agendadas.
- Consultas canceladas devem permanecer acessíveis no histórico.
- Bloqueios devem ser reconhecíveis.
- Horários livres podem ser apresentados quando ajudarem a operação.
- Cada compromisso deve mostrar cliente, início, término e situação.
- O acesso aos dados completos do cliente depende de permissão.
- A visualização deve respeitar o fuso da agenda.
- Alterações devem aparecer sem exigir recriação da agenda.

#### Regras de UI/UX

- A tela deve permitir alternar entre visão diária e semanal quando necessário.
- Consulta e bloqueio devem possuir aparências distintas.
- A distinção não pode depender somente de cor.
- O horário deve permanecer legível em agendas densas.
- Abrir uma consulta marcada deve mostrar suas ações disponíveis.
- Estados vazios devem indicar como configurar ou marcar horários.

---

### Detalhes do agendamento

- [ ] **Apresentar as informações e ações de uma marcação**

**Descrição:** O colaborador deve compreender quem será atendido, por quem e em
qual horário.

#### Regras de negócio

- O detalhe deve apresentar cliente.
- Deve apresentar advogado.
- Deve apresentar data, início, término e duração.
- Deve apresentar a situação atual.
- Deve indicar se a consulta jurídica já foi iniciada.
- Deve permitir cancelamento quando elegível.
- Deve permitir remarcação quando elegível.
- Deve permitir abrir a consulta quando disponível.
- Dados históricos devem permanecer legíveis depois de cancelamento ou
  remarcação.

#### Regras de UI/UX

- A informação principal deve ser cliente, data e horário.
- A situação deve aparecer por texto.
- **Remarcar** deve ser a ação principal quando o objetivo for mudar o horário.
- **Cancelar agendamento** deve ter tratamento destrutivo.
- **Abrir consulta** deve aparecer quando a consulta correspondente estiver
  disponível.
- A tela deve explicar quando uma ação não pode mais ser realizada.

---

### Cancelamento do agendamento

- [ ] **Liberar um horário que não será utilizado**

**Descrição:** Um colaborador autorizado deve cancelar uma consulta marcada sem
apagar seu histórico.

#### Regras de negócio

- Somente agendamento **Agendado** pode ser cancelado.
- Agendamento já cancelado não pode ser cancelado novamente.
- A ação deve registrar quando ocorreu.
- O horário deve voltar a poder ser oferecido quando continuar dentro da
  disponibilidade.
- Cancelar não cria automaticamente outro agendamento.
- Cancelar não apaga cliente, advogado ou horário original.
- Uma consulta já iniciada não pode ser cancelada pela Agenda.
- Consulta concluída ou marcada como não comparecimento não pode ter seu
  agendamento cancelado.
- O cancelamento deve ser comunicado às áreas interessadas.
- O motivo segue a política definida pela HMS.

#### Regras de UI/UX

- A ação deve se chamar **Cancelar agendamento**.
- A confirmação deve mostrar cliente, data e horário.
- A interface deve explicar que o horário poderá ser liberado.
- A ação deve exigir confirmação explícita.
- Depois do cancelamento, a situação deve permanecer visível.
- A interface deve oferecer caminho para marcar um novo horário.

---

### Remarcação do agendamento

- [ ] **Mover uma consulta para outro horário disponível**

**Descrição:** O atendente deve remarcar uma consulta sem perder sua relação com o
cliente e com a consulta jurídica preparada.

#### Regras de negócio

- Somente agendamento **Agendado** pode ser remarcado.
- Uma consulta já iniciada não pode ser remarcada pela Agenda.
- O novo horário deve estar disponível.
- O novo horário não pode estar no passado.
- A duração deve caber integralmente.
- O novo período não pode estar bloqueado.
- O novo período não pode entrar em conflito.
- A remarcação deve preservar cliente e advogado, salvo fluxo específico de troca
  de profissional.
- A consulta jurídica preparada deve continuar relacionada à mesma marcação.
- O horário anterior deve ser preservado no histórico.
- O horário anterior deve voltar a ficar disponível quando aplicável.
- Remarcar não deve criar uma segunda consulta jurídica.

#### Regras de UI/UX

- O horário atual deve permanecer visível durante a escolha.
- O novo horário deve ser apresentado antes da confirmação.
- A ação principal deve ser **Confirmar remarcação**.
- A confirmação deve comparar horário atual e novo horário.
- Em caso de conflito, os demais dados devem ser preservados.
- Depois do sucesso, a tela deve destacar o novo horário.

---

### Continuidade com a consulta

- [ ] **Manter o vínculo entre horário e atendimento jurídico**

**Descrição:** A marcação deve oferecer o contexto necessário para que a Consulta
prepare e conduza o atendimento.

#### Regras de negócio

- Uma consulta jurídica pode ser preparada depois da marcação.
- Cliente e advogado devem ser os mesmos do agendamento.
- Remarcar antes do início deve atualizar data e horário apresentados na
  consulta.
- Cancelar antes do início deve impedir o começo da consulta.
- Iniciar a consulta deve impedir cancelamento ou remarcação pela Agenda.
- Não comparecimento é registrado na Consulta, não na Agenda.
- Concluir a consulta não altera o horário original.
- O conteúdo jurídico não deve ser armazenado na agenda.
- Uma nova marcação após cancelamento deve originar uma nova consulta quando
  aplicável.

#### Regras de UI/UX

- O detalhe deve oferecer **Abrir consulta** quando permitido.
- Uma consulta iniciada deve apresentar essa informação na agenda.
- Ações incompatíveis devem deixar de ser oferecidas.
- Cancelamento deve explicar o impacto sobre uma consulta ainda pendente.
- Remarcação deve refletir imediatamente no resumo da consulta.

---

### Histórico e rastreabilidade

- [ ] **Preservar alterações de agenda e agendamento**

**Descrição:** A HMS deve permitir compreender quando uma configuração ou
marcação foi criada, alterada, cancelada ou remarcada.

#### Regras de negócio

- Criação e alteração da agenda devem ser rastreáveis.
- Inclusão e remoção de bloqueio devem ser rastreáveis.
- Marcação deve preservar quando foi confirmada.
- Cancelamento deve preservar data e responsável.
- Remarcação deve preservar horário anterior, novo horário, data e responsável.
- Desabilitar o advogado não apaga seu histórico.
- Excluir definitivamente uma agenda ou agendamento não faz parte do fluxo comum.
- Dados pessoais devem aparecer somente a colaboradores autorizados.
- A repetição acidental de uma ação não deve duplicar registros.

#### Regras de UI/UX

- O histórico deve ser acessível a partir da agenda ou do agendamento.
- A tela principal deve priorizar o estado atual.
- Alterações anteriores devem aparecer em ordem compreensível.
- Responsáveis devem ser apresentados pelo nome profissional.
- Informações internas ou sensíveis não devem aparecer em mensagens de erro.

---

## 4. Regras Gerais

### 4.1 Integridade da agenda

- Uma agenda pertence a um advogado.
- A duração padrão deve ser válida.
- Intervalos semanais não podem se sobrepor.
- Bloqueios usam datas inteiras e incluem a data final.
- Horários disponíveis precisam caber integralmente na disponibilidade.
- Consultas marcadas não podem se sobrepor.
- Alterações de configuração não cancelam compromissos silenciosamente.
- Horários devem respeitar o fuso da agenda.

### 4.2 Privacidade

- Somente colaboradores autorizados podem visualizar dados completos do cliente.
- Listagens amplas devem apresentar apenas o necessário.
- Informações pessoais não devem aparecer em mensagens de erro.
- O advogado visualiza os clientes marcados em sua agenda.
- Atendentes acessam as informações necessárias para realizar a marcação.
- Histórico não amplia permissões sobre dados pessoais.

### 4.3 Linguagem e acessibilidade

- A interface deve usar linguagem profissional, sóbria e acolhedora.
- Estados não podem depender somente de cor.
- Data, horário e fuso devem ser apresentados sem ambiguidade.
- Campos devem possuir rótulos claros.
- Erros devem indicar como corrigir a configuração.
- Ações de cancelamento e bloqueio devem explicar suas consequências.
- Calendários e seletores de horário devem funcionar por teclado.
- O foco deve permanecer visível.

### 4.4 Confiabilidade operacional

- Selecionar um horário não significa reservá-lo.
- A disponibilidade precisa ser confirmada novamente no final.
- Uma marcação deve ser concluída por inteiro ou não ser criada.
- Cancelamento deve liberar o horário de forma consistente.
- Remarcação deve ocupar o novo horário e liberar o anterior como uma única
  operação.
- A ausência de horários é uma situação normal e precisa de orientação.
- Ações repetidas não devem criar duplicidade.

---

## 5. Fluxos de Usuário

### Fluxo — Advogado configura a agenda pela primeira vez

1. O advogado abre **Minha agenda**.
2. A HMS informa que a agenda ainda não possui disponibilidade.
3. O advogado seleciona **Configurar agenda**.
4. Confirma o fuso horário.
5. Define a duração padrão.
6. Ativa os dias em que atende.
7. Informa um ou mais intervalos por dia.
8. Revisa o resumo semanal.
9. Seleciona **Salvar disponibilidade**.
10. A agenda passa a oferecer horários futuros.

### Fluxo — Advogado adiciona uma pausa no dia

1. O advogado abre a disponibilidade semanal.
2. Localiza o dia desejado.
3. Divide o atendimento em dois intervalos, como manhã e tarde.
4. A HMS verifica que não há sobreposição.
5. O advogado salva.
6. Novos horários deixam de ser oferecidos durante a pausa.
7. Consultas já marcadas permanecem visíveis.

### Fluxo — Advogado bloqueia férias

1. O advogado abre **Bloqueios**.
2. Seleciona **Adicionar bloqueio**.
3. Informa data inicial e data final.
4. Informa o motivo **Férias**, se desejar.
5. A HMS verifica as datas.
6. Verifica se existem consultas marcadas no período.
7. Sem conflitos, o advogado confirma.
8. Todos os dias do intervalo, incluindo o último, deixam de oferecer horários.

### Fluxo — Bloqueio encontra consultas marcadas

1. O advogado informa o intervalo do bloqueio.
2. A HMS encontra consultas dentro das datas.
3. A interface apresenta os compromissos afetados.
4. O advogado abre cada compromisso.
5. Remarca ou cancela conforme necessário.
6. Depois de resolver os conflitos, volta ao bloqueio.
7. Confirma o período.

### Fluxo — Atendente procura um horário

1. O atendente localiza ou cadastra o cliente.
2. Inicia a marcação.
3. Seleciona o advogado.
4. Escolhe o intervalo de datas.
5. A HMS apresenta horários disponíveis.
6. O atendente escolhe um horário.
7. A tela apresenta o resumo antes da confirmação.

### Fluxo — Atendente confirma o agendamento

1. O atendente revisa cliente, advogado, data, início, término e duração.
2. Seleciona **Confirmar agendamento**.
3. A HMS verifica novamente o horário.
4. Se estiver disponível, conclui a marcação.
5. O horário passa a aparecer como ocupado.
6. A consulta jurídica correspondente pode ser preparada.
7. A interface apresenta próximos passos.

### Fluxo — Duas pessoas tentam reservar o mesmo horário

1. Duas pessoas visualizam o mesmo horário disponível.
2. A primeira confirma.
3. O horário passa a estar ocupado.
4. A segunda tenta confirmar.
5. A HMS impede a dupla marcação.
6. A interface preserva cliente e advogado.
7. Os horários são atualizados.
8. A segunda pessoa escolhe outra opção.

### Fluxo — Atendente cancela o agendamento

1. O atendente abre o agendamento.
2. Seleciona **Cancelar agendamento**.
3. A interface apresenta cliente, data e horário.
4. Explica que o horário poderá ser liberado.
5. O atendente confirma.
6. O agendamento passa para **Cancelado**.
7. O horário volta a ser oferecido quando ainda for válido.
8. A interface oferece marcar outro horário.

### Fluxo — Atendente remarca o agendamento

1. O atendente abre o agendamento.
2. Seleciona **Remarcar**.
3. O horário atual permanece visível.
4. A HMS apresenta novos horários disponíveis.
5. O atendente escolhe um horário.
6. A confirmação compara horário atual e novo.
7. O atendente seleciona **Confirmar remarcação**.
8. A HMS ocupa o novo horário e libera o anterior.
9. A consulta preparada permanece vinculada.

### Fluxo — Advogado remove um bloqueio futuro

1. O advogado abre a lista de bloqueios.
2. Seleciona um período futuro.
3. Escolhe **Remover bloqueio**.
4. A interface explica que horários podem voltar a ficar disponíveis.
5. O advogado confirma.
6. O bloqueio é retirado.
7. A HMS recalcula os horários do período.

### Fluxo — Advogado inicia a consulta

1. O advogado abre uma consulta marcada.
2. Seleciona **Abrir consulta**.
3. Inicia o atendimento.
4. A agenda passa a indicar que a consulta foi iniciada.
5. Cancelamento e remarcação deixam de estar disponíveis.
6. O conteúdo do atendimento passa a ser tratado pela Consulta.

---

## 6. Critérios de Aceite do MVP

O módulo estará apto para o MVP quando:

- cada advogado puder possuir uma agenda;
- agenda exigir fuso e duração padrão;
- advogado puder configurar a própria disponibilidade;
- cada dia aceitar nenhum, um ou vários intervalos;
- intervalos inválidos ou sobrepostos forem impedidos;
- alterar disponibilidade não cancelar consultas existentes;
- bloqueio usar somente data inicial, data final e motivo opcional;
- a data final fizer parte do bloqueio;
- um único dia puder ser bloqueado repetindo a mesma data;
- bloqueios ocuparem dias inteiros;
- não existirem bloqueios por horário no MVP;
- conflitos com consultas existentes forem apresentados antes do bloqueio;
- horários disponíveis respeitarem disponibilidade, duração, bloqueios e
  consultas marcadas;
- horários passados não forem oferecidos;
- cliente cadastrado puder receber uma marcação;
- o horário for verificado novamente na confirmação;
- duas pessoas não conseguirem reservar o mesmo período;
- atendente conseguir cancelar uma marcação elegível;
- cancelamento preservar o histórico e liberar o horário;
- atendente conseguir remarcar para outro horário disponível;
- remarcação preservar cliente e consulta preparada;
- consulta iniciada impedir cancelamento ou remarcação pela Agenda;
- agenda apresentar consultas e bloqueios de forma distinta;
- alterações relevantes permanecerem rastreáveis.

---

## 7. Indicadores de Produto e Operação

- quantidade de advogados com agenda configurada;
- percentual de agendas com disponibilidade futura;
- duração padrão mais utilizada;
- quantidade média de intervalos semanais por advogado;
- quantidade e duração média dos bloqueios;
- quantidade de bloqueios com conflitos;
- quantidade de horários disponíveis por semana;
- tempo médio entre cadastro do cliente e marcação;
- percentual de buscas sem horário disponível;
- quantidade de tentativas de conflito impedidas;
- quantidade de agendamentos confirmados;
- quantidade e percentual de cancelamentos;
- quantidade e percentual de remarcações;
- antecedência média da marcação;
- antecedência média do cancelamento;
- tempo médio entre agendamento e início da consulta;
- percentual de agendamentos que originaram consultas realizadas;
- quantidade de horários liberados após cancelamento ou remoção de bloqueio.

Os indicadores devem ser apresentados de forma agrupada sempre que não houver
necessidade de identificar cliente ou advogado.

---

## 8. Relação com Outras Áreas do Produto

### Identidade

- fornece clientes e advogados;
- informa se o advogado está ativo;
- mantém o perfil e as especialidades;
- controla quem pode configurar ou operar a agenda.

### Consulta

- recebe cliente, advogado, data e horário da marcação;
- registra início, conclusão e não comparecimento;
- impede alterações de agenda depois do início;
- não calcula disponibilidade.

### Catálogo Jurídico

- permite que o atendimento use área e temas para escolher profissionais quando
  esse filtro for aplicado;
- não mantém horários.

### Comunicação

- envia confirmações, cancelamentos, remarcações e lembretes;
- respeita os consentimentos do cliente;
- não altera o horário diretamente.

### Formalização e Casos

- podem consultar o histórico da consulta quando necessário;
- não usam a agenda de consulta para prazos ou audiências do caso.

---

## 9. Fora do Escopo

- conteúdo jurídico da consulta;
- questão jurídica, fatos, pedidos, riscos e orientação;
- registro de não comparecimento;
- cadastro de clientes;
- cadastro e perfil dos advogados;
- criação e manutenção de áreas e temas;
- envio de mensagens e lembretes;
- cobrança ou pagamento da consulta;
- assinatura ou contrato;
- agenda de prazos e audiências de casos;
- reuniões com vários clientes;
- consulta com vários advogados responsáveis;
- agendamentos recorrentes;
- lista de espera;
- encaixe automático;
- bloqueio parcial por horário;
- tipos diferentes de bloqueio no MVP;
- tempo de deslocamento entre compromissos;
- intervalo automático antes ou depois da consulta;
- reserva temporária do horário durante a navegação;
- marcação pública pelo cliente;
- sincronização com calendários externos;
- escolha automática do melhor advogado;
- cancelamento automático de consultas ao mudar disponibilidade;
- exclusão definitiva da agenda ou dos agendamentos.

---

## 10. Perguntas Pendentes

1. Administradores poderão editar a agenda de qualquer advogado ou apenas
   consultar?
2. Atendentes poderão alterar a duração de uma consulta específica ou sempre
   usarão a duração padrão?
3. Quais durações serão permitidas no MVP?
4. Qual antecedência mínima será exigida para marcação, cancelamento e
   remarcação?
5. Até quantos meses no futuro a agenda poderá oferecer horários?
6. O motivo do cancelamento será obrigatório?
7. Quem pode cancelar: atendente, advogado, administrador ou todos?
8. Um bloqueio com consultas existentes será proibido até a resolução ou poderá
   ser salvo como pendente?
9. Ao reduzir a disponibilidade semanal, o que acontecerá com consultas já
   marcadas fora dos novos intervalos?
10. A troca do advogado durante uma remarcação fará parte do mesmo agendamento ou
    exigirá cancelamento e nova marcação?
11. Mudança de fuso horário poderá ser feita pelo advogado?
12. A HMS deve considerar feriados automaticamente ou eles serão registrados
    como bloqueios?

Até essas decisões serem respondidas, este PRD considera que:

- o advogado configura a própria agenda;
- administradores apenas consultam e prestam suporte mediante permissão;
- atendentes usam a duração padrão;
- cancelamento e remarcação são permitidos somente antes do início;
- o motivo do cancelamento é opcional;
- bloqueios conflitantes não são concluídos até resolver as consultas;
- consultas já marcadas permanecem válidas quando a disponibilidade muda;
- trocar o advogado exige cancelamento e nova marcação;
- mudança de fuso exige permissão administrativa;
- feriados são tratados por bloqueios.
