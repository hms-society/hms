# PRD — Módulo de Identidade

---

## 1. Visão Geral

O módulo de **Identidade** organiza o acesso das pessoas que trabalham na HMS, o
cadastro dos colaboradores e o cadastro dos clientes atendidos pelo escritório.
Também controla os perfis gerais de acesso e o histórico de consentimentos dos
clientes.

A conta de acesso, o cadastro profissional do colaborador e o cadastro do
cliente são tratados separadamente. Uma conta existe para permitir a entrada na
plataforma. O cadastro do colaborador representa seu vínculo e sua função na HMS.
O cadastro do cliente reúne os dados necessários ao atendimento. No MVP, clientes
não recebem acesso à plataforma.

### Objetivo

Garantir que somente pessoas autorizadas utilizem a HMS, que cada colaborador
tenha permissões compatíveis com sua função, que clientes sejam cadastrados sem
duplicidade e que seus consentimentos possam ser consultados e revogados com
clareza.

### Problema resolvido

Sem uma gestão central de identidade, a HMS corre o risco de manter acessos
indevidos, atribuir permissões incorretas, duplicar clientes, perder informações
de contato e não conseguir determinar quais consentimentos estão vigentes.

### Valor entregue

- acesso interno controlado por e-mail;
- cadastro centralizado de colaboradores;
- separação clara entre acesso, vínculo profissional e cadastro do cliente;
- cinco perfis gerais adequados ao trabalho da HMS;
- associação de profissionais jurídicos a área e temas;
- prevenção de clientes duplicados por CPF ou CNPJ;
- histórico claro de concessão e revogação de consentimentos;
- base confiável para atendimento, agendamento e consulta.

### Contexto do MVP

A HMS é uma plataforma interna utilizada por administradores, atendentes,
advogados, paralegais e supervisores. No fluxo principal, o atendente recebe o
contato do cliente, verifica se ele já está cadastrado, registra os dados
necessários, confirma os consentimentos aplicáveis e segue para a marcação da
consulta.

O administrador é responsável por cadastrar os colaboradores e definir seus
perfis. Advogados, paralegais e supervisores também precisam ser vinculados a uma
área jurídica e a um ou mais temas jurídicos.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- controlar quem pode acessar a HMS;
- manter o e-mail usado para acesso;
- acompanhar se o acesso está pendente, ativo ou desabilitado;
- cadastrar colaboradores e seus nomes profissionais;
- atribuir um perfil geral a cada colaborador;
- associar profissionais jurídicos a área e temas;
- cadastrar clientes pessoa física e pessoa jurídica;
- impedir duplicidade de clientes por CPF ou CNPJ;
- atualizar dados cadastrais dos clientes;
- registrar concessões e revogações de consentimento;
- apresentar o estado atual e o histórico dos consentimentos;
- preservar o histórico das ações relevantes.

### 2.2 Responsabilidades que pertencem a outros módulos

- criar e manter áreas e temas jurídicos;
- configurar agenda e disponibilidade;
- marcar, cancelar ou remarcar consultas;
- registrar o conteúdo e o resultado de uma consulta;
- definir a equipe e os papéis dentro de um caso;
- produzir ou armazenar documentos;
- controlar o acesso externo de clientes e terceiros;
- enviar mensagens por WhatsApp ou e-mail;
- aplicar regras específicas de cada etapa do atendimento.

### 2.3 Conceitos de negócio

#### Conta de acesso

Permite que uma pessoa entre na plataforma usando seu e-mail. A conta não possui
nome profissional nem representa, sozinha, uma função na HMS.

#### Colaborador

Representa uma pessoa que trabalha na HMS. Possui nome profissional, um perfil
geral e, quando atua juridicamente, área e temas de especialidade.

#### Cliente

Representa uma pessoa física ou jurídica atendida pela HMS. Pode ser cadastrado
sem possuir conta de acesso.

#### Consentimento

Representa a manifestação do cliente sobre uma autorização específica. Cada
consentimento possui uma data de concessão e pode possuir uma data de revogação.

---

## 3. Requisitos

### Conta de acesso interno

- [ ] **Cadastrar e manter uma conta de acesso por e-mail**

**Descrição:** A HMS deve permitir que pessoas autorizadas tenham uma conta para
acessar a plataforma.

#### Regras de negócio

- Toda conta deve possuir um e-mail válido.
- O mesmo e-mail não pode ser usado em duas contas.
- O e-mail deve ser comparado sem considerar letras maiúsculas, minúsculas ou
  espaços inseridos antes ou depois do endereço.
- A conta de acesso não deve possuir nome.
- O nome profissional deve ser mantido no cadastro do colaborador.
- Toda conta deve estar em um dos estados:
  - **Convidado:** o primeiro acesso ainda não foi concluído;
  - **Ativo:** o acesso está liberado;
  - **Desabilitado:** o acesso está interrompido.
- Possuir uma conta não concede automaticamente uma função ou permissão
  operacional.
- Clientes não recebem conta de acesso no MVP.
- A conta deve permanecer registrada quando seu acesso for desabilitado, para
  preservar o histórico.

#### Regras de UI/UX

- O e-mail deve ser apresentado como a principal identificação da conta.
- A interface deve usar os rótulos **Convidado**, **Ativo** e **Desabilitado**.
- O formulário de acesso não deve solicitar nome.
- O nome deve ser solicitado somente no cadastro do colaborador.
- A interface deve deixar claro quando uma conta ainda não concluiu o primeiro
  acesso.
- Falhas de cadastro não devem ser apresentadas como sucesso.

---

### Convite e primeiro acesso

- [ ] **Convidar uma pessoa para acessar a HMS**

**Descrição:** Um administrador deve conseguir enviar um convite para o e-mail
profissional de uma pessoa que passará a utilizar a plataforma.

#### Regras de negócio

- Somente administradores ativos podem enviar convites.
- O e-mail informado não pode pertencer a uma conta já existente.
- Ao enviar o convite, a conta deve permanecer como **Convidado**.
- O acesso deve ser ativado somente depois que a pessoa concluir as etapas do
  primeiro acesso.
- Convites expirados não devem liberar acesso.
- O administrador deve poder reenviar um convite pendente.
- Reenviar o convite não deve criar outra conta.
- Um convite cancelado ou inválido não deve permitir o primeiro acesso.
- A conclusão do primeiro acesso não deve alterar o perfil do colaborador.
- Uma conta sem colaborador associado não deve receber permissões operacionais.

#### Regras de UI/UX

- O formulário deve explicar que um convite será enviado ao e-mail informado.
- O administrador deve visualizar se o convite está pendente.
- A ação de reenvio deve apresentar confirmação de sucesso ou falha.
- Se o e-mail já estiver cadastrado, a interface deve orientar a localizar a
  conta existente.
- O primeiro acesso deve indicar claramente as etapas restantes.

---

### Entrada e recuperação de acesso

- [ ] **Permitir entrada segura e recuperação do acesso**

**Descrição:** Colaboradores ativos devem conseguir entrar na HMS e recuperar o
acesso quando necessário.

#### Regras de negócio

- Somente contas ativas podem acessar as áreas internas da HMS.
- Contas convidadas podem acessar apenas o fluxo necessário para concluir o
  primeiro acesso.
- Contas desabilitadas não podem acessar áreas internas.
- A recuperação de acesso deve usar o e-mail cadastrado.
- Recuperar o acesso não pode alterar o perfil ou as especialidades do
  colaborador.
- Encerrar a sessão deve retirar o acesso à plataforma naquele dispositivo.
- Tentativas de entrada não devem revelar informações desnecessárias sobre outras
  contas.
- A HMS deve impedir o acesso quando houver inconsistência entre a conta e o
  cadastro do colaborador.

#### Regras de UI/UX

- A tela de entrada deve identificar claramente que a plataforma é de uso interno
  da HMS.
- Mensagens de erro devem ser claras, mas não devem expor informações sobre
  outras contas.
- A recuperação deve informar que as instruções serão enviadas por e-mail.
- Uma pessoa com acesso desabilitado deve receber orientação para procurar a
  administração da HMS.
- Depois da entrada, a pessoa deve retornar à atividade que pretendia realizar,
  quando tiver permissão para ela.

---

### Desabilitação de acesso

- [ ] **Interromper o acesso sem apagar o histórico**

**Descrição:** Um administrador deve conseguir desabilitar uma conta que não deve
mais utilizar a HMS.

#### Regras de negócio

- Somente administradores ativos podem desabilitar contas.
- Uma conta já desabilitada não deve sofrer uma nova desabilitação.
- A perda de acesso deve valer imediatamente após a confirmação.
- O cadastro do colaborador deve ser preservado.
- A autoria de atendimentos, consultas, alterações e demais ações anteriores deve
  ser preservada.
- O colaborador desabilitado não deve ser oferecido para novas atribuições.
- Um administrador não pode desabilitar a própria conta se isso deixar a HMS sem
  outro administrador ativo.
- A desabilitação não deve apagar dados de clientes ou trabalhos anteriormente
  relacionados ao colaborador.
- A reativação não faz parte do fluxo comum do MVP enquanto sua política não for
  definida.

#### Regras de UI/UX

- A ação deve ser chamada **Desabilitar acesso**, e não **Excluir**.
- Antes da confirmação, a interface deve explicar que o histórico será mantido.
- A ação deve exigir confirmação explícita.
- O estado desabilitado deve continuar visível na gestão administrativa.
- A interface deve informar que o acesso será interrompido imediatamente.

---

### Cadastro de colaborador

- [ ] **Cadastrar um colaborador da HMS**

**Descrição:** Um administrador deve conseguir cadastrar uma pessoa que trabalha
na HMS e relacioná-la à sua conta de acesso.

#### Regras de negócio

- Somente administradores ativos podem cadastrar colaboradores.
- Todo colaborador deve possuir uma conta de acesso.
- Uma conta não pode estar associada a mais de um colaborador.
- O nome profissional é obrigatório.
- Cada colaborador deve possuir exatamente um perfil geral.
- Os perfis permitidos no MVP são:
  - Administrador;
  - Atendente;
  - Advogado;
  - Paralegal;
  - Supervisor.
- O e-mail de acesso deve ser apresentado a partir da conta associada e não deve
  ser repetido como um dado profissional independente.
- O cadastro só pode ser concluído quando perfil e especialidades forem
  compatíveis.
- Um cliente não deve ser criado automaticamente ao cadastrar um colaborador.

#### Regras de UI/UX

- O formulário deve separar **Dados de acesso** e **Dados do colaborador**.
- Deve ser possível convidar a pessoa e cadastrar o colaborador no mesmo fluxo.
- O resultado deve mostrar claramente se o convite ainda está pendente.
- O campo de nome deve informar que se trata do nome exibido profissionalmente.
- O seletor de perfil deve apresentar os cinco perfis em português.
- Erros em área ou temas devem ser apresentados antes da conclusão.

---

### Perfis e permissões gerais

- [ ] **Definir a função geral de cada colaborador**

**Descrição:** Cada colaborador deve possuir um perfil que represente sua função
principal na HMS e oriente suas permissões gerais.

#### Regras de negócio

- Um colaborador possui somente um perfil geral por vez.
- O perfil **Administrador** permite gerenciar acessos, colaboradores, áreas e
  temas jurídicos.
- O perfil **Atendente** permite atuar no cadastro de clientes e nos fluxos de
  atendimento e agendamento.
- Os perfis **Advogado**, **Paralegal** e **Supervisor** representam atuação
  jurídica e exigem área e temas.
- O perfil geral não substitui responsabilidades específicas dentro de uma
  consulta ou de um caso.
- Cada parte da plataforma pode aplicar regras adicionais conforme a atividade
  realizada.
- A mudança de perfil deve afetar as próximas decisões de acesso, mas não deve
  alterar o histórico anterior.
- Na ausência de um perfil válido, o acesso à atividade deve ser negado.
- Mudanças que aumentem ou reduzam permissões devem ser registradas.

#### Regras de UI/UX

- A interface deve explicar resumidamente o alcance de cada perfil.
- Mudanças de perfil devem exigir confirmação.
- O administrador deve ser avisado quando a mudança retirar acesso a atividades
  atualmente exercidas pelo colaborador.
- A interface não deve apresentar responsabilidades de um caso como se fossem
  perfis gerais.
- Ações sem permissão não devem ser oferecidas como disponíveis.

---

### Área e temas do profissional jurídico

- [ ] **Associar profissionais jurídicos às suas especialidades**

**Descrição:** Advogados, paralegais e supervisores devem ser associados às áreas
e aos temas em que podem atuar.

#### Regras de negócio

- Advogados, paralegais e supervisores devem possuir uma área jurídica.
- Esses profissionais devem possuir um ou mais temas jurídicos.
- Todos os temas selecionados devem pertencer à área escolhida.
- O mesmo tema não pode ser selecionado mais de uma vez.
- Somente áreas e temas disponíveis podem ser usados em novos cadastros.
- Administradores e atendentes não possuem área ou temas no cadastro do MVP.
- Ao mudar a área, os temas anteriores devem ser revistos.
- Não deve ser possível salvar um profissional jurídico sem tema.
- Quando uma área ou tema deixar de ser utilizado pela HMS, associações antigas
  devem continuar visíveis no histórico.
- Mudar um colaborador de perfil administrativo para perfil jurídico exige a
  seleção da área e dos temas na mesma operação.

#### Regras de UI/UX

- O campo **Área jurídica** deve aparecer antes de **Temas jurídicos**.
- O campo de temas deve permitir múltipla seleção.
- Devem ser exibidos apenas temas pertencentes à área selecionada.
- Ao trocar a área, a interface deve avisar que os temas atuais serão removidos.
- Área ou tema que não esteja mais disponível deve ser identificado claramente.
- O botão de conclusão deve permanecer indisponível enquanto faltar um tema.

---

### Cadastro de cliente pessoa física

- [ ] **Cadastrar pessoa física com CPF único**

**Descrição:** Um colaborador autorizado deve conseguir cadastrar uma pessoa
física atendida pela HMS.

#### Regras de negócio

- O cadastro exige acesso ativo e permissão para atuar no atendimento.
- O nome completo é obrigatório.
- O CPF é obrigatório.
- O CPF deve ser válido.
- Pontuação e máscara não devem criar diferença entre dois CPFs iguais.
- Não pode existir mais de um cliente com o mesmo CPF.
- E-mail e telefone podem ser informados.
- O endereço pode ser informado.
- Quando preenchido, o endereço deve conter logradouro, número, bairro, cidade,
  estado e CEP; complemento é opcional.
- O cadastro do cliente não cria uma conta de acesso.
- Criar o cliente não registra consentimentos automaticamente.
- O cadastro deve ser concluído por inteiro ou não ser realizado.

#### Regras de UI/UX

- O fluxo deve começar pela consulta do CPF.
- O CPF pode ser exibido com máscara durante a digitação.
- Quando o cliente já existir, a interface deve oferecer a abertura do cadastro
  encontrado.
- O sistema não deve permitir continuar com um segundo cadastro para o mesmo CPF.
- Campos obrigatórios e opcionais devem ser identificados.
- Erros não devem apagar os demais dados já informados.
- Após o cadastro, devem ser oferecidos os próximos passos: consentimentos e
  marcação da consulta.

---

### Cadastro de cliente pessoa jurídica

- [ ] **Cadastrar pessoa jurídica com CNPJ único**

**Descrição:** Um colaborador autorizado deve conseguir cadastrar uma pessoa
jurídica atendida pela HMS.

#### Regras de negócio

- O cadastro exige acesso ativo e permissão para atuar no atendimento.
- A razão social é obrigatória.
- O nome fantasia é opcional.
- O CNPJ é obrigatório.
- O CNPJ deve ser válido.
- Pontuação e máscara não devem criar diferença entre dois CNPJs iguais.
- Não pode existir mais de um cliente com o mesmo CNPJ.
- E-mail, telefone e endereço seguem as mesmas regras aplicáveis ao cadastro de
  pessoa física.
- O cadastro da empresa não cria uma conta para seu representante.
- Representantes, sócios e procuradores não fazem parte deste escopo.
- Criar a pessoa jurídica não registra consentimentos automaticamente.

#### Regras de UI/UX

- A escolha entre **Pessoa física** e **Pessoa jurídica** deve ocorrer antes dos
  campos específicos.
- O formulário deve usar os nomes **Razão social**, **Nome fantasia** e **CNPJ**.
- A consulta do CNPJ deve ocorrer antes do preenchimento de todos os dados.
- Quando o CNPJ já existir, a interface deve direcionar ao cadastro encontrado.
- Trocar o tipo de cliente antes de salvar deve exigir confirmação quando houver
  dados que serão descartados.

---

### Prevenção de duplicidade e localização de cliente

- [ ] **Localizar o cliente correto antes de criar outro cadastro**

**Descrição:** A HMS deve evitar clientes duplicados e ajudar o atendente a
encontrar o cadastro correto no início do atendimento.

#### Regras de negócio

- CPF identifica uma pessoa física.
- CNPJ identifica uma pessoa jurídica.
- Máscara, pontuação e espaços não diferenciam documentos iguais.
- Duas tentativas simultâneas não podem criar dois clientes com o mesmo CPF ou
  CNPJ.
- Nome, razão social, nome fantasia, e-mail e telefone podem apoiar a busca.
- Resultados encontrados por nome devem permitir distinguir pessoas homônimas.
- A busca por dados pessoais exige acesso autorizado.
- Cadastros potencialmente duplicados não devem ser unidos automaticamente.
- Quando houver duplicidade histórica, ela deve ser tratada como inconsistência,
  e não como situação normal do atendimento.

#### Regras de UI/UX

- A busca deve aceitar CPF ou CNPJ com ou sem máscara.
- O atendente deve visualizar apenas os dados necessários para reconhecer o
  cliente.
- A interface deve diferenciar carregamento, nenhum resultado e falha na busca.
- Ao identificar cadastro existente, a ação principal deve ser **Abrir cliente**.
- A opção de criar novo cadastro não deve permanecer disponível para o mesmo
  documento.

---

### Atualização do cadastro do cliente

- [ ] **Manter os dados cadastrais do cliente atualizados**

**Descrição:** Colaboradores autorizados devem conseguir atualizar informações
nominais, contatos e endereço do cliente.

#### Regras de negócio

- O cadastro precisa existir para ser alterado.
- Em pessoa física, podem ser alterados nome, e-mail, telefone e endereço.
- Em pessoa jurídica, podem ser alterados razão social, nome fantasia, e-mail,
  telefone e endereço.
- Pessoa física não pode ser convertida em pessoa jurídica.
- Pessoa jurídica não pode ser convertida em pessoa física.
- CPF ou CNPJ não pode ser alterado pela edição cadastral comum.
- Informações próprias de pessoa física não devem aparecer em pessoa jurídica e
  vice-versa.
- Salvar sem nenhuma alteração não deve criar uma atualização fictícia.
- A alteração cadastral não concede nem revoga consentimentos.
- A exclusão do cliente não faz parte do fluxo comum do MVP.

#### Regras de UI/UX

- CPF ou CNPJ deve ser exibido como informação não editável.
- A interface deve avisar quando não houver alterações para salvar.
- O usuário deve permanecer no contexto do atendimento depois da atualização.
- Consentimentos devem aparecer em seção própria.
- Erros devem indicar quais informações precisam ser corrigidas.

---

### Concessão de consentimento

- [ ] **Registrar uma autorização concedida pelo cliente**

**Descrição:** Um colaborador autorizado deve conseguir registrar que o cliente
concedeu um consentimento específico.

#### Regras de negócio

- O cliente precisa estar cadastrado.
- Os tipos de consentimento do MVP são:
  - tratamento de dados;
  - comunicação por WhatsApp;
  - comunicação por e-mail;
  - compartilhamento com terceiros.
- Cada concessão se aplica a apenas um tipo.
- O consentimento deve resultar de uma manifestação explícita do cliente.
- Cadastrar o cliente não significa que ele consentiu.
- Informar telefone não significa consentimento para WhatsApp.
- Informar e-mail não significa consentimento para comunicação por e-mail.
- Não pode existir mais de um consentimento vigente do mesmo tipo para o mesmo
  cliente.
- Uma tentativa de registrar novamente um consentimento vigente deve ser
  impedida.
- Depois de uma revogação, o cliente pode conceder novamente o mesmo tipo.
- Uma nova concessão não deve apagar o histórico anterior.
- Conceder um tipo não concede os demais.

#### Regras de UI/UX

- Cada tipo deve ser apresentado separadamente.
- A interface deve explicar o efeito antes da confirmação.
- Opções de consentimento não devem vir previamente marcadas.
- Os estados devem ser apresentados como **Vigente**, **Revogado** ou **Não
  registrado**.
- O estado não deve depender somente de cor.
- A data da concessão deve permanecer visível.
- Deve ficar claro que o consentimento poderá ser revogado.
- Os textos apresentados ao cliente devem ser validados pela área jurídica da
  HMS.

---

### Revogação de consentimento

- [ ] **Registrar a retirada de uma autorização**

**Descrição:** Um colaborador autorizado deve conseguir registrar quando o
cliente revoga um consentimento anteriormente concedido.

#### Regras de negócio

- Somente consentimentos vigentes podem ser revogados.
- A tentativa de revogar um consentimento inexistente deve ser impedida.
- A tentativa de revogar novamente um consentimento já revogado deve ser
  impedida.
- A data da concessão deve ser preservada.
- A data da revogação deve ser registrada.
- Revogar um tipo não revoga os demais.
- Depois da revogação, a autorização não pode continuar sendo tratada como
  vigente.
- A revogação não exclui o cadastro do cliente.
- A revogação não apaga atendimentos, consultas, documentos ou registros
  anteriores.
- O cliente pode conceder novamente o mesmo tipo em outro momento.
- Concessões e revogações anteriores devem permanecer consultáveis.

#### Regras de UI/UX

- A ação deve ser chamada **Revogar consentimento**.
- A confirmação deve explicar qual autorização deixará de valer.
- O histórico deve apresentar o tipo, a data da concessão e a data da revogação.
- Depois da revogação, uma nova concessão deve exigir uma ação separada.
- Não deve existir uma ação comum para apagar o histórico.

---

### Aplicação dos consentimentos

- [ ] **Usar o estado vigente nas atividades da HMS**

**Descrição:** As áreas da HMS devem considerar o estado atual do consentimento
antes de realizar atividades que dependam daquela autorização.

#### Regras de negócio

- O estado deve ser verificado por cliente e por tipo de consentimento.
- Na ausência de consentimento vigente, a atividade não deve presumir
  autorização.
- Comunicação por WhatsApp depende do consentimento correspondente.
- Comunicação por e-mail depende do consentimento correspondente.
- Compartilhamento com terceiros depende do consentimento correspondente quando
  essa for a autorização aplicável.
- Uma revogação deve passar a valer para as próximas atividades.
- O histórico anterior não altera o estado atual.
- A existência de um dado de contato não substitui a autorização.
- Uma atividade impedida por falta de consentimento deve informar o motivo ao
  colaborador.

#### Regras de UI/UX

- A ficha do cliente deve mostrar um estado para cada tipo.
- A ausência de concessão deve aparecer como **Não registrado**, e não como
  **Revogado**.
- O histórico pode ficar em uma visualização secundária, sem competir com o
  estado atual.
- Quando uma ação for impedida, a interface deve indicar qual consentimento está
  ausente ou revogado.

---

### Listagens e gestão

- [ ] **Localizar contas, colaboradores e clientes**

**Descrição:** Pessoas autorizadas devem conseguir encontrar os cadastros
necessários para realizar e administrar o trabalho.

#### Regras de negócio

- Contas, colaboradores e clientes devem possuir listagens distintas.
- Administradores podem localizar contas por e-mail e estado.
- Administradores podem localizar colaboradores por nome, perfil, área e tema.
- Colaboradores autorizados podem localizar clientes por CPF, CNPJ, nome, razão
  social, e-mail ou telefone.
- Registros desabilitados devem continuar localizáveis na gestão administrativa.
- Dados pessoais exibidos devem ser limitados ao necessário para a tarefa.
- Somente pessoas autorizadas podem acessar informações completas de clientes.
- Os resultados devem manter ordem previsível.

#### Regras de UI/UX

- A gestão deve separar claramente **Contas** e **Colaboradores**.
- A ficha do colaborador deve mostrar seu e-mail de acesso.
- Filtros ativos devem ficar visíveis e poder ser removidos.
- CPF, CNPJ e contatos devem ser parcialmente ocultados quando a exibição
  completa não for necessária.
- A interface deve diferenciar uma lista vazia de uma busca sem resultados.
- O estado do acesso deve ser visível na listagem administrativa.

---

### Rastreabilidade e proteção

- [ ] **Preservar histórico e impedir ações indevidas**

**Descrição:** Mudanças de acesso, perfil, cadastro e consentimento devem ser
realizadas somente por pessoas autorizadas e permanecer compreensíveis ao longo
do tempo.

#### Regras de negócio

- Toda alteração exige uma pessoa autenticada e autorizada.
- Mudanças de acesso devem permitir identificar quando ocorreram.
- Mudanças de perfil e especialidade devem permitir identificar o estado anterior
  e o novo estado.
- Criação e atualização de clientes devem preservar a continuidade do cadastro.
- Concessões e revogações não podem ser apagadas por ações comuns.
- A repetição acidental de uma ação não deve criar cadastros ou consentimentos
  duplicados.
- Informações pessoais devem ser exibidas apenas a quem precisa delas para o
  trabalho.
- Falhas não devem expor dados de outras pessoas.
- A desabilitação de acesso não pode apagar a autoria de ações anteriores.

#### Regras de UI/UX

- Mensagens devem explicar o problema e indicar como corrigi-lo.
- Informações internas ou sensíveis não devem aparecer em mensagens de erro.
- A interface só deve confirmar uma ação depois de sua conclusão.
- Ações com impacto em acesso ou consentimento devem exigir confirmação.
- Quando outra pessoa tiver alterado o mesmo cadastro, a interface deve mostrar
  as informações atuais antes de uma nova tentativa.

---

## 4. Regras Gerais

### 4.1 Privacidade

- CPF, CNPJ, telefone, e-mail e endereço devem ser acessados somente quando
  necessários para o trabalho.
- Informações pessoais não devem aparecer em telas de pessoas sem permissão.
- Busca e listagens devem apresentar somente o necessário para identificação.
- O histórico não deve ser usado para ampliar o acesso a dados pessoais.
- Relatórios de uso devem privilegiar informações agrupadas.

### 4.2 Qualidade dos dados

- E-mails devem ser comparados de forma consistente.
- CPF e CNPJ devem ser validados antes da conclusão do cadastro.
- Um cliente não pode ser duplicado por diferença de máscara.
- Área e temas devem ser coerentes entre si.
- Datas de concessão e revogação devem respeitar sua ordem.
- Campos obrigatórios não podem ser substituídos por textos vazios ou espaços.

### 4.3 Linguagem e acessibilidade

- A interface deve usar linguagem profissional, sóbria e acolhedora.
- Estados não podem depender apenas de cor.
- Campos devem possuir rótulos claros e mensagens de erro relacionadas.
- Ações críticas devem explicar seu efeito antes da confirmação.
- Termos internos não devem aparecer para os usuários.
- A navegação deve funcionar por teclado e manter o foco visível.

---

## 5. Fluxos de Usuário

### Fluxo — Administrador cadastra e convida um colaborador

1. O administrador abre a gestão de colaboradores.
2. Seleciona **Novo colaborador**.
3. Informa e-mail de acesso, nome profissional e perfil.
4. Se o perfil for advogado, paralegal ou supervisor, seleciona área e temas.
5. O sistema valida o e-mail, o perfil e as especialidades.
6. O convite é enviado.
7. O colaborador aparece com acesso **Convidado**.
8. A interface confirma o cadastro e informa que o primeiro acesso está
   pendente.

### Fluxo — Colaborador conclui o primeiro acesso

1. O colaborador recebe o convite.
2. Abre o convite válido.
3. Conclui as etapas solicitadas.
4. A conta passa de **Convidado** para **Ativo**.
5. O colaborador entra na HMS.
6. A plataforma apresenta somente as atividades permitidas para seu perfil.

### Fluxo — Administrador desabilita um acesso

1. O administrador abre a conta ativa.
2. Seleciona **Desabilitar acesso**.
3. A interface explica que o histórico será preservado.
4. O administrador confirma.
5. A conta passa a **Desabilitado**.
6. A pessoa perde acesso às áreas internas.
7. Seu cadastro profissional e sua autoria anterior permanecem disponíveis.

### Fluxo — Atendente cadastra pessoa física

1. O atendente inicia um novo atendimento.
2. Informa o CPF.
3. A HMS valida o documento e procura um cadastro existente.
4. Se encontrar, oferece abrir o cliente.
5. Se não encontrar, solicita nome e demais dados cadastrais.
6. O atendente conclui o cadastro.
7. A interface oferece registrar consentimentos e marcar a consulta.

### Fluxo — Atendente cadastra pessoa jurídica

1. O atendente escolhe **Pessoa jurídica**.
2. Informa o CNPJ.
3. A HMS valida o documento e procura um cadastro existente.
4. Se não encontrar, solicita razão social e os dados complementares.
5. O atendente conclui o cadastro.
6. A interface mantém o cliente no contexto do atendimento.

### Fluxo — Cadastro duplicado é impedido

1. Duas pessoas tentam cadastrar o mesmo CPF ou CNPJ.
2. A primeira conclusão válida cria o cadastro.
3. A segunda tentativa identifica que o cliente já existe.
4. Nenhum segundo cadastro é criado.
5. A interface oferece abrir o cliente existente.

### Fluxo — Atendente registra consentimento

1. O atendente abre a seção de consentimentos do cliente.
2. A interface apresenta os quatro tipos e seus estados.
3. O atendente explica ao cliente o efeito do consentimento.
4. Após a manifestação explícita, confirma o registro.
5. O tipo passa a aparecer como **Vigente**.
6. A data da concessão fica disponível.
7. Os demais tipos permanecem inalterados.

### Fluxo — Cliente revoga um consentimento

1. O cliente solicita a revogação.
2. O colaborador abre o consentimento vigente.
3. Seleciona **Revogar consentimento**.
4. A interface explica o efeito.
5. O colaborador confirma.
6. O tipo passa a aparecer como **Revogado**.
7. A data da revogação é incluída no histórico.
8. Os demais consentimentos permanecem inalterados.

### Fluxo — Cliente concede novamente

1. O cliente possui um consentimento anteriormente revogado.
2. Em outro momento, manifesta novamente sua autorização.
3. O colaborador seleciona **Registrar novo consentimento**.
4. O tipo passa a aparecer como **Vigente**.
5. O ciclo anterior permanece no histórico.

### Fluxo — Administrador altera perfil ou especialidades

1. O administrador abre o colaborador.
2. Altera perfil, área ou temas.
3. A HMS verifica se a combinação é válida.
4. A interface explica o impacto da mudança.
5. O administrador confirma.
6. As novas permissões passam a valer.
7. O histórico anterior é preservado.

---

## 6. Critérios de Aceite do MVP

O módulo estará apto para o MVP quando:

- administradores conseguirem convidar e cadastrar colaboradores;
- colaboradores convidados conseguirem concluir o primeiro acesso;
- somente contas ativas conseguirem acessar áreas internas;
- contas desabilitadas perderem o acesso sem perder o histórico;
- cada colaborador possuir apenas um dos cinco perfis;
- advogados, paralegais e supervisores exigirem área e pelo menos um tema;
- administradores e atendentes não receberem área e temas no cadastro;
- atendentes autorizados conseguirem cadastrar pessoas físicas e jurídicas;
- CPF e CNPJ inválidos ou duplicados forem impedidos;
- o cadastro do cliente não criar acesso à plataforma;
- concessões de consentimento dependerem de ação explícita;
- consentimentos puderem ser revogados e concedidos novamente;
- o histórico de consentimentos permanecer preservado;
- não existirem dois consentimentos vigentes do mesmo tipo para o mesmo cliente;
- dados pessoais forem exibidos somente a pessoas autorizadas;
- ações críticas apresentarem confirmação e resultado claros.

---

## 7. Indicadores de Produto e Operação

- quantidade de clientes duplicados evitados;
- quantidade de tentativas de cadastro com CPF ou CNPJ inválido;
- tempo médio entre convite e primeiro acesso;
- quantidade de acessos convidados, ativos e desabilitados;
- quantidade de cadastros de profissional jurídico impedidos por falta de área ou
  tema;
- percentual de clientes com telefone;
- percentual de clientes com e-mail;
- percentual de clientes com cada tipo de consentimento vigente;
- quantidade de concessões repetidas impedidas;
- quantidade de revogações sem consentimento vigente impedidas;
- quantidade de tentativas de acesso de contas desabilitadas.

Os indicadores devem ser apresentados de forma agrupada sempre que não houver
necessidade de identificar uma pessoa.

---

## 8. Relação com Outras Áreas do Produto

### Catálogo Jurídico

- mantém as áreas e os temas usados no cadastro dos profissionais jurídicos;
- define quais áreas e temas estão disponíveis;
- permite gestão por administradores.

### Agenda

- utiliza os clientes e colaboradores já cadastrados;
- define disponibilidade, bloqueios e horários;
- não altera os dados de identidade.

### Consulta

- utiliza o cliente e o advogado definidos para o atendimento;
- mantém o conteúdo e o resultado da consulta;
- não altera perfis ou consentimentos.

### Comunicação

- considera o consentimento vigente antes de usar WhatsApp ou e-mail;
- não presume autorização apenas porque o contato foi informado;
- respeita revogações nas próximas comunicações.

### Casos

- define responsabilidades específicas dentro de cada caso;
- não transforma essas responsabilidades em perfis gerais.

### Portal

- será responsável por eventual acesso externo de clientes ou terceiros;
- não faz parte do acesso interno definido neste PRD.

---

## 9. Fora do Escopo

- acesso do cliente à plataforma no MVP;
- portal do cliente ou de terceiros;
- associação de uma pessoa a vários perfis gerais simultâneos;
- papéis específicos dentro de consultas ou casos;
- criação de áreas e temas dentro deste módulo;
- agenda, disponibilidade e marcação de consulta;
- conteúdo ou resultado da consulta;
- produção, aprovação ou armazenamento de documentos;
- representantes, sócios e procuradores de pessoa jurídica;
- assinatura eletrônica do consentimento;
- anexação de prova documental do consentimento;
- atendimento completo de solicitações de anonimização ou portabilidade;
- união automática de clientes duplicados;
- exclusão definitiva de contas, colaboradores, clientes ou consentimentos;
- correção de CPF ou CNPJ pela edição comum;
- reativação de acesso desabilitado enquanto a política não estiver definida;
- cadastro de estagiário, parceiro externo ou perfis diferentes dos cinco
  previstos;
- múltiplas áreas jurídicas para o mesmo colaborador no MVP.

---

## 10. Perguntas Pendentes

1. Um acesso desabilitado poderá ser reativado por um administrador?
2. Quando CPF ou CNPJ tiver sido informado incorretamente, haverá um fluxo
   administrativo de correção?
3. O cadastro do cliente poderá ser concluído sem telefone e sem e-mail?
4. Como será cadastrado o primeiro administrador de um novo ambiente?
5. No MVP, o administrador poderá editar nome, perfil, área e temas de qualquer
   colaborador depois do cadastro?

Até essas decisões serem respondidas, este PRD considera que:

- acessos desabilitados não são reativados pela gestão comum;
- CPF e CNPJ não são alterados na edição cadastral;
- telefone e e-mail são opcionais;
- o primeiro administrador é cadastrado por um processo operacional controlado;
- administradores podem corrigir nome, perfil, área e temas dos colaboradores.
