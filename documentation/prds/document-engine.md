# PRD — Módulo de Motor Documental

---

## 1. Visão Geral

O módulo de **Motor Documental** organiza a entrada de arquivos enviados à HMS e
garante que eles sejam associados ao cliente correto antes de seguirem para os
demais fluxos do escritório.

No MVP, os arquivos chegam por WhatsApp ou e-mail. Cada recebimento com arquivos
gera um lote documental. Quando o cliente ainda não está confirmado, o lote entra
na **Caixa de Triagem de Lotes Órfãos**, onde um atendente pode revisar os arquivos,
avaliar uma correspondência sugerida, buscar outro cliente, confirmar o vínculo ou
rejeitar o lote.

O remetente e o cliente são tratados como informações diferentes. A pessoa que
envia os arquivos pode ser um familiar, representante ou outro contato. Por isso,
o telefone ou e-mail de origem ajuda na identificação, mas nunca cria um vínculo
automaticamente.

A correspondência sugerida no MVP não depende de inteligência artificial
generativa. Ela é formada por comparações objetivas entre os dados do remetente,
os dados encontrados nos arquivos e os cadastros de clientes. Toda sugestão exige
confirmação humana.

### Objetivo

Evitar que arquivos recebidos fiquem perdidos, sejam atribuídos ao cliente errado
ou avancem para um atendimento sem identificação, oferecendo uma triagem simples,
segura e rastreável.

### Problema resolvido

Documentos chegam ao escritório por canais diferentes, muitas vezes sem uma
identificação clara no nome do arquivo ou na mensagem. O remetente pode não ser o
cliente, pode enviar documentos de outra pessoa ou pode utilizar um contato ainda
não cadastrado.

Sem uma caixa de triagem, o atendente precisa procurar manualmente em conversas,
pastas e cadastros. Isso aumenta o risco de associação incorreta, duplicidade,
perda de documentos e exposição de dados pessoais a um atendimento indevido.

### Valor entregue

- recebimento centralizado de arquivos enviados por WhatsApp e e-mail;
- formação automática de lotes documentais;
- fila única para lotes sem cliente confirmado;
- distinção clara entre remetente e cliente;
- sugestão de no máximo um cliente quando houver evidência segura;
- explicação objetiva das evidências da correspondência;
- busca manual quando a sugestão estiver ausente ou incorreta;
- confirmação humana obrigatória antes do vínculo;
- rejeição reversível sem exclusão definitiva dos arquivos;
- histórico das decisões tomadas na triagem;
- base confiável para classificação e uso posterior dos documentos.

### Contexto do MVP

O cliente ou outra pessoa envia um ou mais arquivos para a HMS por WhatsApp ou
e-mail. A plataforma registra o recebimento e cria um lote. Se ainda não existir
um cliente confirmado para aquele lote, ele aparece como pendente na caixa de
triagem.

O atendente abre o lote e visualiza:

- o canal de recebimento;
- o telefone ou e-mail do remetente;
- a data e o horário de chegada;
- os arquivos recebidos;
- uma correspondência sugerida, quando houver segurança suficiente;
- as evidências objetivas que sustentam a sugestão.

O atendente pode confirmar o cliente sugerido, buscar outro cliente ou registrar
que não foi possível identificar. Também pode rejeitar um lote que seja indevido,
inválido, duplicado ou sem relação com o atendimento da HMS.

A triagem do MVP termina com a identificação do cliente. O atendente não precisa
decidir a qual caso, consulta ou item de checklist cada arquivo pertence.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- receber arquivos enviados por WhatsApp e e-mail;
- criar um lote para cada recebimento válido;
- preservar o canal, o remetente e o momento do recebimento;
- manter os arquivos que compõem cada lote;
- encaminhar lotes sem cliente confirmado para a caixa de triagem;
- apresentar os lotes pendentes, vinculados e rejeitados;
- procurar correspondências entre o lote e clientes já cadastrados;
- apresentar no máximo uma correspondência sugerida;
- explicar as evidências usadas na sugestão;
- permitir busca manual por cliente;
- exigir confirmação humana para vincular o lote;
- permitir registrar que o cliente não pôde ser identificado;
- rejeitar lotes sem excluir definitivamente seus arquivos;
- permitir que um administrador restaure lotes rejeitados;
- preservar o histórico das ações de triagem;
- disponibilizar os arquivos vinculados para os fluxos autorizados do cliente.

### 2.2 Responsabilidades que pertencem a outros módulos

- cadastrar e atualizar clientes;
- impedir duplicidade de clientes por CPF ou CNPJ;
- controlar contas, perfis e permissões gerais dos colaboradores;
- enviar e receber mensagens completas da conversa com o cliente;
- criar e manter itens de checklist de um caso;
- definir quais documentos são exigidos em cada caso;
- registrar o conteúdo de consultas;
- produzir documentos a partir de modelos;
- gerar, revisar e aprovar documentos jurídicos;
- criar áreas e temas jurídicos;
- abrir e acompanhar casos;
- decidir a classificação jurídica de um documento;
- decidir se um arquivo comprova um fato ou atende a uma exigência específica.

### 2.3 Conceitos de negócio

#### Lote documental

É o conjunto de arquivos recebidos em uma mesma ocorrência por WhatsApp ou
e-mail. O lote preserva a origem e permite que seus arquivos sejam triados como
uma unidade.

#### Lote órfão

É um lote que ainda não possui cliente confirmado. Ele permanece na caixa de
triagem até ser vinculado ou rejeitado.

#### Remetente

É o telefone ou e-mail que enviou os arquivos. O remetente identifica a origem do
recebimento, mas não prova que os arquivos pertencem à mesma pessoa.

#### Cliente vinculado

É o cliente que um colaborador confirmou como titular dos arquivos do lote. O
vínculo somente existe depois de uma ação humana explícita.

#### Correspondência sugerida

É a indicação de um cliente já cadastrado que apresenta evidências objetivas de
relação com o lote. Uma sugestão permanece pendente até ser confirmada ou
descartada pelo atendente.

#### Evidência da correspondência

É uma explicação verificável sobre por que um cliente foi sugerido, como a
coincidência de CPF, CNPJ, telefone, e-mail ou nome. A evidência apoia a decisão,
mas não substitui a revisão humana.

#### Rejeição do lote

É a retirada do lote da fila operacional por um motivo registrado. A rejeição não
apaga definitivamente os arquivos e pode ser revertida por um administrador.

---

## 3. Requisitos

### Recebimento de arquivos

- [ ] **Receber arquivos pelos canais previstos no MVP**

**Descrição:** A HMS deve reconhecer arquivos recebidos por WhatsApp ou e-mail e
encaminhá-los para organização documental.

#### Regras de negócio

- Os canais aceitos no MVP são **WhatsApp** e **E-mail**.
- Mensagens sem arquivo não devem gerar lote documental.
- Um recebimento deve possuir pelo menos um arquivo válido para gerar um lote.
- Todos os arquivos aceitos na mesma ocorrência devem compor o mesmo lote.
- Um arquivo recebido deve pertencer a somente um lote de origem.
- O canal deve ser preservado durante toda a vida do lote.
- A data e o horário efetivos do recebimento devem ser preservados.
- O telefone ou e-mail de origem deve ser preservado quando estiver disponível.
- A ausência dos dados do remetente não deve impedir a criação do lote.
- Uma mesma ocorrência entregue novamente não deve criar lotes duplicados.
- Falhas parciais não devem apresentar como completo um lote que perdeu arquivos.
- Um arquivo recusado no recebimento deve possuir um motivo compreensível.

#### Regras de UI/UX

- A origem deve usar os rótulos **WhatsApp** e **E-mail**.
- A interface deve informar quando um arquivo não pôde ser recebido.
- O usuário não deve visualizar um lote vazio.
- O momento do recebimento deve ser apresentado no fuso horário usado pela HMS.
- A ausência do remetente deve ser apresentada como **Remetente não identificado**.
- Erros não devem fazer o usuário acreditar que os arquivos foram preservados
  quando o recebimento não foi concluído.

---

### Formação do lote

- [ ] **Agrupar os arquivos de uma ocorrência em um lote identificável**

**Descrição:** Cada recebimento válido deve gerar uma unidade de triagem com um
código próprio e uma composição preservada.

#### Regras de negócio

- Um e-mail com vários anexos deve gerar um único lote.
- Uma mensagem de WhatsApp com vários arquivos deve gerar um único lote.
- Mensagens diferentes devem gerar lotes diferentes no MVP.
- O módulo não deve juntar mensagens consecutivas por suposição de proximidade.
- O lote deve receber um código único e legível.
- O código não deve mudar quando o lote for vinculado, rejeitado ou restaurado.
- A quantidade de arquivos deve refletir apenas os arquivos aceitos.
- A composição do lote não deve mudar silenciosamente depois da criação.
- O MVP não permite separar um lote em vários lotes pela tela de triagem.
- O MVP não permite unir manualmente lotes diferentes.

#### Regras de UI/UX

- O código deve ser apresentado como **ID do lote**.
- A quantidade deve usar **1 arquivo** ou **N arquivos**.
- Abrir o lote deve permitir consultar todos os seus arquivos.
- A interface não deve oferecer a ação **Separar lote**.
- Se os arquivos aparentarem pertencer a pessoas diferentes, o atendente não deve
  ser induzido a confirmar um único cliente.

---

### Entrada na caixa de triagem

- [ ] **Encaminhar lotes sem cliente confirmado para triagem**

**Descrição:** Todo lote recém-recebido deve permanecer pendente enquanto não
houver uma decisão humana sobre seu cliente.

#### Regras de negócio

- Todo novo lote deve iniciar como **Pendente**.
- Um lote pendente não possui cliente vinculado.
- Uma correspondência sugerida não altera o estado do lote.
- O lote deve continuar pendente quando não houver sugestão segura.
- O lote deve continuar pendente quando o atendente registrar que não conseguiu
  identificar o cliente.
- O lote deve sair dos pendentes somente quando for vinculado ou rejeitado.
- O recebimento não deve vincular automaticamente o lote, mesmo quando o
  remetente coincide com um cliente.
- Lotes pendentes devem permanecer disponíveis para uma nova tentativa de
  identificação.

#### Regras de UI/UX

- A tela deve se chamar **Caixa de Triagem de Lotes Órfãos**.
- O texto introdutório deve explicar que os lotes ainda não possuem associação
  confirmada.
- A tela deve favorecer a resolução dos lotes pendentes.
- A ausência de sugestão não deve ser apresentada como erro.
- Um lote já vinculado não deve continuar aparecendo como tarefa pendente.

---

### Estados do lote

- [ ] **Representar claramente a situação de cada lote**

**Descrição:** O lote deve possuir um único estado operacional por vez.

#### Regras de negócio

- Os estados do MVP são:
  - **Pendente:** ainda não possui cliente confirmado;
  - **Vinculado:** possui cliente confirmado por um colaborador;
  - **Rejeitado:** foi retirado da operação por um motivo registrado.
- Um lote pendente pode ser vinculado.
- Um lote pendente pode ser rejeitado.
- Um lote vinculado não pode ser vinculado novamente pelo fluxo comum.
- Um lote rejeitado não pode ser vinculado enquanto não for restaurado.
- Restaurar um lote rejeitado deve fazê-lo voltar para **Pendente**.
- Estados incompatíveis não podem coexistir.
- Toda mudança de estado deve preservar quem realizou a ação e quando ela ocorreu.

#### Regras de UI/UX

- A caixa deve oferecer os filtros **Todos**, **Pendentes**, **Vinculados** e
  **Rejeitados**.
- O estado deve ser comunicado por texto e não apenas por cor.
- A quantidade apresentada em cada filtro deve refletir os resultados acessíveis
  ao usuário.
- A troca de filtro deve manter uma ordem previsível dos lotes.
- Lotes pendentes devem apresentar as ações necessárias para triagem.

---

### Tabela da caixa de triagem

- [ ] **Apresentar informações suficientes para priorizar e abrir um lote**

**Descrição:** O atendente deve compreender a origem e a situação do lote sem
precisar abrir todos os itens.

#### Regras de negócio

- A listagem deve apresentar:
  - ID do lote;
  - recebido de;
  - cliente;
  - data e hora;
  - quantidade de arquivos;
  - ações disponíveis.
- **Recebido de** deve combinar o canal com o telefone ou e-mail do remetente.
- **Cliente** deve apresentar a correspondência sugerida quando houver.
- O remetente nunca deve ser apresentado como cliente apenas pela coincidência do
  contato.
- O cliente sugerido deve permanecer claramente pendente de confirmação.
- Quando não houver correspondência segura, a coluna deve informar **Sem sugestão
  segura**.
- Os lotes devem ser ordenados inicialmente do recebimento mais recente para o
  mais antigo.
- A paginação não deve repetir nem omitir lotes ao navegar.
- Filtros e paginação devem preservar a seleção atual enquanto a lista estiver
  sendo consultada.

#### Regras de UI/UX

- O cliente sugerido deve mostrar nome e CPF ou CNPJ mascarado.
- O nome sugerido deve ser acompanhado pelo marcador **Sugerido**.
- O marcador **Sugerido** não significa vínculo confirmado.
- **Sem sugestão segura** deve usar aparência neutra e orientar a busca manual.
- **Remetente não identificado** deve ser usado somente quando o telefone ou
  e-mail de origem estiver ausente.
- A ação principal de um lote pendente deve ser **Vincular**.
- A ação **Rejeitar** deve permanecer visível sem disputar hierarquia com
  **Vincular**.
- A tabela deve possuir paginação consistente com as demais listagens da HMS.
- A interface deve diferenciar lista vazia de filtro sem resultados.

---

### Distinção entre remetente e cliente

- [ ] **Evitar que a origem seja confundida com a titularidade dos arquivos**

**Descrição:** O atendente deve conseguir usar os dados de origem como evidência
sem tratá-los como confirmação de identidade.

#### Regras de negócio

- O remetente pode ser diferente do cliente.
- Um telefone do remetente que coincida com o cadastro do cliente é apenas uma
  evidência.
- Um e-mail do remetente que coincida com o cadastro do cliente é apenas uma
  evidência.
- A coincidência do remetente não deve vincular o lote automaticamente.
- A ausência de coincidência não deve impedir que o cliente correto seja
  localizado manualmente.
- O cliente confirmado deve ser preservado separadamente do remetente.
- Alterações futuras no telefone ou e-mail do cliente não devem mudar quem enviou
  o lote no passado.

#### Regras de UI/UX

- A tabela deve usar **Recebido de**, e não **Cliente**, para os dados do
  remetente.
- O modal deve mostrar canal e contato de origem no cabeçalho do lote.
- A interface não deve preencher o campo de cliente com o remetente sem indicar
  que se trata de sugestão.
- O texto de evidência deve dizer **Telefone do remetente corresponde ao contato
  cadastrado** ou **E-mail do remetente corresponde ao contato cadastrado**.

---

### Localização de dados nos arquivos

- [ ] **Encontrar informações úteis para apoiar a identificação**

**Descrição:** A HMS deve procurar dados objetivos nos arquivos recebidos para
compará-los com clientes já cadastrados.

#### Regras de negócio

- A procura pode considerar CPF, CNPJ, telefone, e-mail e nome.
- CPF e CNPJ devem ser considerados somente quando possuírem formato válido.
- Máscaras, pontuação, espaços e diferenças entre letras maiúsculas e minúsculas
  não devem impedir uma comparação válida.
- O dado encontrado deve permanecer relacionado ao arquivo em que apareceu.
- A mesma informação repetida em vários arquivos deve aumentar a clareza da
  evidência, mas não deve criar vários candidatos iguais.
- Um nome isolado não é evidência suficiente para uma sugestão segura.
- Texto ilegível ou ausente não deve ser transformado em dado presumido.
- Dados conflitantes devem impedir uma sugestão segura.
- A leitura automática não deve alterar o conteúdo original dos arquivos.

#### Regras de UI/UX

- A interface não precisa expor todo o conteúdo encontrado nos arquivos.
- Somente evidências úteis para a decisão devem ser apresentadas.
- CPF e CNPJ devem aparecer mascarados.
- A quantidade de arquivos em que o dado foi encontrado pode ser apresentada.
- A ausência de dados legíveis deve resultar em busca manual, não em uma mensagem
  técnica.

---

### Geração da correspondência sugerida

- [ ] **Sugerir no máximo um cliente quando houver segurança suficiente**

**Descrição:** A HMS deve reduzir o esforço de busca sem criar associações
automáticas ou apresentar uma lista ambígua de candidatos.

#### Regras de negócio

- A sugestão deve considerar somente clientes já cadastrados.
- A sugestão deve usar comparações objetivas e reproduzíveis.
- Um CPF ou CNPJ válido encontrado nos arquivos e pertencente a um único cliente
  é uma evidência forte.
- A combinação entre contato exato do remetente e nome correspondente pode apoiar
  uma sugestão quando apontar para um único cliente.
- Telefone, e-mail ou nome isolados não devem ser suficientes quando houver risco
  de ambiguidade.
- Evidências conflitantes devem impedir a apresentação da sugestão.
- Se dois ou mais clientes permanecerem plausíveis, nenhum deles deve ser
  apresentado como sugestão principal.
- A interface deve apresentar no máximo uma sugestão por lote.
- A sugestão nunca deve vincular o lote automaticamente.
- Uma sugestão rejeitada não deve ser reapresentada como se ainda estivesse
  pendente.
- Uma nova sugestão somente pode surgir se novas evidências ou dados cadastrais
  mudarem a avaliação.
- A formação da sugestão do MVP não depende de inteligência artificial
  generativa.

#### Regras de UI/UX

- O estado deve se chamar **Correspondência sugerida**.
- A sugestão deve apresentar nome e CPF ou CNPJ mascarado.
- O marcador **Sugerido** deve indicar que ainda existe uma decisão pendente.
- A interface não deve mostrar uma classificação numérica de confiança ao
  atendente.
- Candidatos ambíguos não devem ser exibidos como várias sugestões concorrentes.
- Quando não houver segurança suficiente, o modal deve abrir diretamente a busca
  manual.

---

### Evidências da correspondência

- [ ] **Explicar por que o cliente foi sugerido**

**Descrição:** Toda correspondência sugerida deve apresentar justificativas
curtas, compreensíveis e verificáveis.

#### Regras de negócio

- Uma sugestão deve possuir pelo menos uma evidência relevante.
- As evidências possíveis no MVP são:
  - telefone do remetente correspondente ao contato cadastrado;
  - e-mail do remetente correspondente ao contato cadastrado;
  - CPF encontrado nos arquivos;
  - CNPJ encontrado nos arquivos;
  - nome do cliente encontrado nos arquivos.
- A evidência de CPF ou CNPJ deve informar em quantos arquivos houve ocorrência
  quando isso ajudar a revisão.
- A evidência de nome não deve esconder divergências de CPF ou CNPJ.
- As evidências devem refletir somente correspondências realmente encontradas.
- Uma evidência não pode afirmar que o documento foi juridicamente validado.
- As mensagens devem ser formadas sem geração livre de texto.

#### Regras de UI/UX

- A seção deve se chamar **Evidências da correspondência**.
- Cada evidência deve ocupar uma linha curta.
- Exemplos de mensagens permitidas:
  - **Telefone do remetente corresponde ao contato cadastrado**;
  - **E-mail do remetente corresponde ao contato cadastrado**;
  - **CPF final 456-78 encontrado em 2 arquivos**;
  - **Nome encontrado nos arquivos recebidos**.
- A interface não deve usar linguagem conclusiva como **Identidade comprovada**.
- As evidências devem apoiar, e não substituir, a ação de confirmação.

---

### Modal de vínculo com sugestão

- [ ] **Permitir que o atendente revise e confirme uma sugestão segura**

**Descrição:** Ao abrir um lote com sugestão, o atendente deve primeiro avaliar a
correspondência e suas evidências.

#### Regras de negócio

- O modal deve apresentar os arquivos do lote antes da decisão.
- A sugestão deve permanecer pendente enquanto não houver ação humana.
- O atendente pode confirmar o cliente sugerido.
- O atendente pode rejeitar a sugestão e buscar outro cliente.
- O atendente pode registrar que não foi possível identificar o cliente.
- Fechar o modal não deve confirmar nem rejeitar a sugestão.
- Confirmar deve vincular o lote inteiro ao cliente escolhido.
- A sugestão deve pertencer ao mesmo lote que está sendo revisado.
- Uma sugestão já decidida não pode ser confirmada novamente.

#### Regras de UI/UX

- O modal deve mostrar somente **Correspondência sugerida** no estado inicial.
- O campo de busca não deve disputar atenção com a sugestão.
- As ações devem ser:
  - **Confirmar cliente**;
  - **Buscar outro cliente**;
  - **Não foi possível identificar**.
- **Não foi possível identificar** deve ser um botão, e não um menu ou texto
  informativo.
- A ação **Rejeitar lote** deve ficar no rodapé do modal.
- Não deve existir menu adicional para ações destrutivas.
- Não deve existir a ação **Separar lote**.

---

### Busca manual de cliente

- [ ] **Localizar outro cliente quando a sugestão não existir ou estiver errada**

**Descrição:** O atendente deve conseguir pesquisar entre os clientes cadastrados
e selecionar o cliente correto.

#### Regras de negócio

- A busca deve considerar nome, CPF, CNPJ, telefone e e-mail.
- Somente clientes existentes podem ser selecionados.
- A pesquisa não deve criar um cliente automaticamente.
- Resultados semelhantes devem apresentar dados suficientes para distinção.
- CPF e CNPJ devem permanecer mascarados na lista.
- Selecionar um resultado não deve confirmar o vínculo imediatamente.
- O vínculo deve depender de uma segunda ação explícita.
- Cancelar ou fechar o modal não deve preservar uma seleção como confirmação.
- Quando houver sugestão pendente, o atendente deve poder voltar a ela.
- A busca manual deve funcionar mesmo quando nenhum dado foi encontrado nos
  arquivos.

#### Regras de UI/UX

- O estado deve se chamar **Identificar cliente**.
- Quando o modal começar pela busca manual, não deve existir uma seção vazia de
  sugestão.
- Um resultado selecionado deve ser indicado por realce e ícone de confirmação.
- O botão **Confirmar vínculo** deve permanecer desabilitado até a seleção de um
  cliente.
- Depois da seleção, **Confirmar vínculo** deve ser habilitado no rodapé.
- Quando houver uma sugestão anterior, deve existir **Voltar à sugestão**.
- Resultados vazios devem orientar o atendente a verificar a busca ou cadastrar o
  cliente no fluxo adequado.

---

### Cliente ainda não cadastrado

- [ ] **Tratar a ausência do cliente sem criar um cadastro incompleto**

**Descrição:** Quando o atendente não localizar o cliente, o lote deve permanecer
seguro e disponível para nova triagem.

#### Regras de negócio

- O modal de vínculo não deve criar um cliente de forma implícita.
- O cadastro de cliente deve ocorrer no fluxo próprio de identidade.
- O lote deve permanecer pendente enquanto o cliente não estiver cadastrado e
  confirmado.
- O atendente deve poder voltar ao lote depois do cadastro.
- A ausência de cliente cadastrado não é motivo automático para rejeição.
- Registrar que não foi possível identificar não deve apagar a sugestão rejeitada
  nem os arquivos.
- A tentativa deve permanecer no histórico operacional.

#### Regras de UI/UX

- **Não foi possível identificar** deve encerrar a tentativa atual e manter o lote
  pendente.
- A interface deve explicar que o lote poderá ser revisado novamente.
- Quando nenhum cliente for encontrado, a tela pode oferecer um caminho para o
  cadastro, sem misturar os dois formulários.
- O usuário não deve receber uma confirmação de vínculo quando somente encerrou a
  tentativa.

---

### Confirmação do vínculo

- [ ] **Associar o lote ao cliente escolhido por decisão humana**

**Descrição:** O atendente deve confirmar explicitamente que todos os arquivos do
lote pertencem ao cliente selecionado.

#### Regras de negócio

- Somente um lote pendente pode ser vinculado.
- Somente um cliente existente pode receber o vínculo.
- O lote pode possuir somente um cliente vinculado no MVP.
- Todos os arquivos do lote devem ser associados ao mesmo cliente.
- A confirmação deve registrar quem realizou a ação e quando.
- Confirmar uma sugestão deve registrar que ela foi aceita.
- Escolher outro cliente deve registrar que a sugestão anterior não foi aceita.
- A confirmação deve mudar o lote para **Vinculado**.
- Uma repetição acidental da mesma confirmação não deve duplicar arquivos nem
  vínculos.
- Um lote vinculado não deve voltar aos pendentes.
- O vínculo não deve associar automaticamente arquivos a consulta, caso ou item
  de checklist.

#### Regras de UI/UX

- A ação final da busca manual deve se chamar **Confirmar vínculo**.
- A ação final da sugestão pode se chamar **Confirmar cliente**.
- Antes da confirmação, a interface deve manter visíveis o cliente selecionado e
  o lote.
- Depois da confirmação, a interface deve informar o sucesso e atualizar a lista.
- Falhas devem manter o lote pendente e permitir nova tentativa.
- A interface não deve apresentar o marcador **Sugerido** depois do vínculo.

---

### Associação aos itens de checklist

- [ ] **Limitar a decisão do atendente à identificação do cliente**

**Descrição:** A triagem deve evitar exigir do atendente conhecimento jurídico ou
conhecimento detalhado de um caso específico.

#### Regras de negócio

- O vínculo realizado na caixa de triagem deve associar o lote somente ao cliente.
- O modal não deve exigir seleção de consulta, caso ou checklist.
- O atendente não deve decidir qual exigência jurídica um arquivo atende.
- Um arquivo pode ser relacionado posteriormente a um item de checklist por um
  fluxo próprio e por uma pessoa autorizada.
- A associação posterior não deve alterar o remetente nem o cliente do lote.
- O mesmo arquivo não deve ser tratado como atendimento de uma exigência sem
  validação apropriada.
- A confirmação do cliente não significa que o documento foi classificado,
  validado ou aprovado.

#### Regras de UI/UX

- O modal não deve apresentar campo de caso ou item de checklist no MVP.
- A confirmação deve usar linguagem de vínculo com o cliente.
- A interface não deve usar **Documento comprovado** ou **Checklist atendido** na
  triagem.
- Depois do vínculo, a próxima etapa pode ser indicada sem exigir que o atendente
  a conclua imediatamente.

---

### Rejeição do lote

- [ ] **Retirar da operação um lote que não deve ser vinculado**

**Descrição:** O atendente deve conseguir rejeitar um lote indevido sem excluir
definitivamente seus arquivos.

#### Regras de negócio

- Somente lotes pendentes podem ser rejeitados pelo fluxo comum.
- A rejeição deve exigir um motivo.
- Os motivos previstos são:
  - conteúdo não solicitado ou spam;
  - lote totalmente duplicado;
  - conteúdo sem relação com os atendimentos da HMS;
  - arquivos inválidos ou inutilizáveis;
  - outro motivo.
- **Outro motivo** deve exigir uma explicação.
- A explicação também pode complementar os demais motivos.
- Rejeitar deve mudar o lote para **Rejeitado**.
- A rejeição deve registrar quem realizou a ação e quando.
- Os arquivos devem ser arquivados, e não excluídos definitivamente.
- O remetente não deve ser notificado automaticamente no MVP.
- A rejeição não pode ser usada apenas porque o cliente ainda não foi localizado.
- Um lote rejeitado deve sair da fila de pendentes.

#### Regras de UI/UX

- A ação deve se chamar **Rejeitar lote**.
- A confirmação deve se chamar **Deseja rejeitar este lote?**.
- O modal deve identificar o lote afetado.
- O campo **Motivo da rejeição** deve ser obrigatório.
- O texto deve explicar que os arquivos serão arquivados.
- O texto deve explicar que o remetente não será notificado.
- O texto deve explicar que a ação poderá ser revertida por um administrador.
- As ações finais devem ser **Cancelar** e **Confirmar rejeição**.
- A ação destrutiva deve permanecer visualmente distinta da ação de cancelar.

---

### Restauração do lote rejeitado

- [ ] **Permitir correção administrativa de uma rejeição**

**Descrição:** Um administrador deve conseguir devolver um lote rejeitado à fila
quando a rejeição tiver sido incorreta.

#### Regras de negócio

- Somente administradores autorizados podem restaurar lotes.
- Somente lotes rejeitados podem ser restaurados.
- Restaurar deve mudar o lote para **Pendente**.
- O motivo e a data da rejeição devem permanecer no histórico.
- A restauração deve registrar quem realizou a ação e quando.
- Restaurar não deve vincular o lote automaticamente.
- Uma sugestão rejeitada anteriormente não deve reaparecer sem nova avaliação.
- Os arquivos devem voltar a ficar disponíveis para triagem.

#### Regras de UI/UX

- A ação deve se chamar **Restaurar lote**.
- A confirmação deve explicar que o lote voltará aos pendentes.
- O histórico da rejeição deve continuar acessível.
- Depois da restauração, a interface deve oferecer novamente **Vincular** e
  **Rejeitar**.

---

### Consulta de arquivos do lote

- [ ] **Permitir a revisão dos arquivos antes da decisão**

**Descrição:** O atendente deve conseguir reconhecer o conteúdo recebido sem sair
do contexto da triagem.

#### Regras de negócio

- Todos os arquivos do lote devem ser listados.
- Cada arquivo deve apresentar seu nome e tamanho.
- O tipo de arquivo deve ser identificável.
- Arquivos compatíveis devem poder ser visualizados por colaborador autorizado.
- O acesso ao arquivo não deve alterar o estado do lote.
- A visualização não representa validação do conteúdo.
- Um arquivo indisponível deve ser claramente sinalizado.
- A falha em um arquivo não deve esconder os demais.

#### Regras de UI/UX

- Os arquivos devem aparecer antes da área de associação do cliente.
- Nomes longos devem ser abreviados sem impedir a consulta do nome completo.
- O tipo não deve depender somente de cor.
- A interface deve diferenciar falha de visualização de arquivo inválido.
- O atendente deve conseguir voltar à decisão sem perder sua seleção.

---

### Disponibilização após o vínculo

- [ ] **Tornar os arquivos acessíveis no contexto do cliente confirmado**

**Descrição:** Depois do vínculo, os arquivos devem deixar de ser órfãos e ficar
disponíveis para os fluxos autorizados relacionados ao cliente.

#### Regras de negócio

- Todos os arquivos do lote devem manter o vínculo com o cliente confirmado.
- O lote deve permanecer consultável como origem dos arquivos.
- O canal, o remetente e a data de recebimento devem permanecer preservados.
- O vínculo não altera o nome nem o conteúdo original do arquivo.
- O vínculo não aprova a qualidade, autenticidade ou finalidade do documento.
- O vínculo não cria automaticamente um caso ou consulta.
- O vínculo não atende automaticamente um checklist.
- Outros fluxos devem respeitar as permissões de acesso ao cliente e aos arquivos.

#### Regras de UI/UX

- O lote vinculado deve apresentar o cliente confirmado sem o marcador
  **Sugerido**.
- A tela deve diferenciar claramente lote vinculado de sugestão pendente.
- O histórico deve permitir compreender de qual recebimento vieram os arquivos.
- A interface não deve apresentar a vinculação como aprovação documental.

---

### Permissões de triagem

- [ ] **Restringir decisões e dados a colaboradores autorizados**

**Descrição:** Somente pessoas autorizadas devem acessar a caixa e tomar decisões
sobre lotes documentais.

#### Regras de negócio

- O usuário deve estar autenticado para acessar a caixa de triagem.
- Atendentes autorizados podem consultar, vincular e rejeitar lotes pendentes.
- Administradores podem realizar as mesmas ações e restaurar lotes rejeitados.
- A visualização de dados pessoais deve respeitar o perfil do colaborador.
- Um colaborador sem permissão não deve consultar os arquivos pela caixa de
  triagem.
- A perda de acesso deve impedir novas decisões sem apagar o histórico anterior.
- A ação deve ser atribuída ao colaborador que efetivamente a confirmou.

#### Regras de UI/UX

- Ações sem permissão não devem ser apresentadas como disponíveis.
- Bloqueios devem explicar que o perfil não possui autorização.
- Dados pessoais devem ser mascarados quando a exibição integral não for
  necessária.
- A interface não deve revelar a existência de um cliente a pessoas sem
  autorização.

---

### Histórico e rastreabilidade

- [ ] **Preservar as decisões tomadas sobre cada lote**

**Descrição:** A HMS deve permitir reconstruir o caminho do recebimento até a
decisão de triagem.

#### Regras de negócio

- O histórico deve preservar:
  - recebimento do lote;
  - canal e remetente;
  - composição original;
  - correspondência sugerida;
  - evidências apresentadas;
  - aceitação ou rejeição da sugestão;
  - tentativas sem identificação;
  - vínculo confirmado;
  - rejeição do lote;
  - restauração do lote.
- Decisões devem registrar responsável e momento.
- O histórico não deve ser apagado por mudança de estado.
- Uma restauração não deve apagar a rejeição anterior.
- Uma nova tentativa de identificação não deve substituir silenciosamente a
  tentativa anterior.
- Informações históricas do remetente não devem mudar quando o cadastro do
  cliente for atualizado.

#### Regras de UI/UX

- O histórico detalhado pode permanecer em uma visualização secundária.
- A tela operacional deve mostrar apenas o necessário para a decisão atual.
- Datas e responsáveis devem usar uma apresentação consistente.
- A interface deve distinguir claramente o estado atual dos acontecimentos
  anteriores.

---

### Concorrência e repetição de ações

- [ ] **Evitar decisões duplicadas ou conflitantes**

**Descrição:** A HMS deve manter o lote consistente quando mais de um colaborador
tentar atuar sobre ele.

#### Regras de negócio

- O primeiro vínculo confirmado deve impedir outro vínculo concorrente pelo fluxo
  comum.
- Uma rejeição não deve substituir um vínculo já confirmado.
- Um vínculo não deve substituir uma rejeição ainda vigente.
- Repetir a mesma confirmação não deve duplicar o vínculo.
- Repetir uma rejeição não deve criar várias rejeições para o mesmo estado.
- Uma tela desatualizada deve ser impedida de concluir uma ação incompatível.
- A falha deve preservar o estado válido mais recente.

#### Regras de UI/UX

- Quando outro colaborador já tiver decidido, a tela deve atualizar o estado e
  informar o ocorrido.
- A interface não deve apresentar sucesso para uma ação que não foi aplicada.
- Depois de uma falha, os arquivos e o lote devem continuar consultáveis quando o
  usuário possuir acesso.

---

## 4. Regras Gerais

### 4.1 Confirmação humana

- Nenhuma correspondência sugerida pode vincular um lote automaticamente.
- O marcador **Sugerido** sempre representa uma decisão pendente.
- O atendente deve conseguir consultar as evidências antes de confirmar.
- A ausência de sugestão não deve impedir a busca manual.
- Uma decisão automática nunca deve ser apresentada como decisão do atendente.

### 4.2 Privacidade

- A caixa de triagem contém dados pessoais e deve ser acessível somente a pessoas
  autorizadas.
- CPF e CNPJ devem ser mascarados quando a exibição integral não for necessária.
- Evidências devem apresentar apenas os dados necessários para distinguir o
  cliente.
- Arquivos não devem ser expostos fora dos contextos autorizados.
- Lotes rejeitados devem continuar protegidos enquanto estiverem arquivados.

### 4.3 Integridade documental

- Receber, visualizar, sugerir cliente e vincular não devem modificar o conteúdo
  original dos arquivos.
- Nenhuma ação de triagem representa aprovação de autenticidade ou validade
  jurídica.
- O lote deve preservar sua composição de origem.
- A rejeição não deve causar exclusão definitiva no MVP.
- O vínculo deve ser aplicado de forma consistente a todos os arquivos do lote.

### 4.4 Linguagem e acessibilidade

- Estados e ações não devem depender apenas de cor ou ícone.
- Textos devem diferenciar remetente, cliente, sugestão e vínculo.
- A interface deve evitar termos técnicos de processamento documental.
- Controles devem possuir nomes acessíveis e foco visível.
- Mensagens de erro devem explicar o que aconteceu e qual ação está disponível.
- Ações destrutivas ou reversíveis devem explicar suas consequências.

### 4.5 Responsabilidade operacional

- O atendente é responsável por identificar o cliente, não por realizar análise
  jurídica dos arquivos.
- Dúvida sobre o cliente deve manter o lote pendente.
- Dúvida sobre a finalidade do documento deve ser tratada depois do vínculo, por
  fluxo apropriado.
- A rapidez da triagem não deve prevalecer sobre a segurança da associação.

---

## 5. Fluxos de Usuário

### Fluxo — Arquivos chegam por WhatsApp

1. Uma mensagem com arquivos é recebida pelo canal oficial da HMS.
2. A HMS registra telefone, data, horário e arquivos aceitos.
3. Um lote é criado como **Pendente**.
4. A HMS procura evidências de correspondência com clientes cadastrados.
5. O lote aparece na caixa de triagem.
6. Se houver correspondência segura, a coluna **Cliente** apresenta o candidato
   com o marcador **Sugerido**.

### Fluxo — Arquivos chegam por e-mail

1. Um e-mail com um ou mais anexos é recebido.
2. A HMS registra e-mail do remetente, data, horário e anexos aceitos.
3. Todos os anexos da mensagem formam um lote.
4. O lote entra como **Pendente**.
5. A HMS procura evidências de correspondência.
6. O lote fica disponível para triagem.

### Fluxo — Atendente confirma o cliente sugerido

1. O atendente abre um lote com o marcador **Sugerido**.
2. O modal apresenta os arquivos, a correspondência e suas evidências.
3. O atendente verifica os dados.
4. Seleciona **Confirmar cliente**.
5. A HMS registra a aceitação da sugestão.
6. O lote passa para **Vinculado**.
7. Os arquivos ficam associados ao cliente confirmado.
8. O marcador **Sugerido** deixa de ser apresentado.

### Fluxo — Atendente escolhe outro cliente

1. O atendente abre um lote com uma sugestão.
2. Identifica que a sugestão não corresponde ao titular dos arquivos.
3. Seleciona **Buscar outro cliente**.
4. A sugestão é substituída pelo campo **Identificar cliente**.
5. O atendente pesquisa e seleciona outro cliente.
6. O botão **Confirmar vínculo** é habilitado.
7. O atendente confirma.
8. A sugestão anterior é registrada como não aceita.
9. O lote é vinculado ao cliente selecionado.

### Fluxo — Não existe sugestão segura

1. O atendente abre um lote sem candidato seguro.
2. O modal inicia diretamente em **Identificar cliente**.
3. O atendente pesquisa por nome, documento ou contato.
4. Seleciona um cliente.
5. Confirma o vínculo.
6. O lote passa para **Vinculado**.

### Fluxo — Cliente ainda não pode ser identificado

1. O atendente abre o lote.
2. Revisa os arquivos e realiza a busca.
3. Não encontra segurança para escolher um cliente.
4. Seleciona **Não foi possível identificar**.
5. A tentativa é registrada.
6. O modal é fechado.
7. O lote continua **Pendente** para nova revisão.

### Fluxo — Cliente precisa ser cadastrado

1. O atendente pesquisa e não encontra o cliente.
2. A interface orienta que o cadastro seja realizado no fluxo de clientes.
3. O lote permanece pendente.
4. O cliente é cadastrado por uma pessoa autorizada.
5. O atendente retorna ao lote.
6. Localiza o cadastro e confirma o vínculo.

### Fluxo — Atendente rejeita um lote

1. O atendente abre um lote pendente.
2. Seleciona **Rejeitar lote** no rodapé.
3. A confirmação apresenta o ID do lote e as consequências.
4. O atendente informa o motivo.
5. Seleciona **Confirmar rejeição**.
6. O lote passa para **Rejeitado**.
7. Os arquivos são arquivados.
8. O remetente não é notificado.

### Fluxo — Administrador restaura um lote

1. O administrador filtra os lotes rejeitados.
2. Abre o lote e consulta o motivo da rejeição.
3. Seleciona **Restaurar lote**.
4. Confirma que deseja devolver o lote à triagem.
5. O lote volta para **Pendente**.
6. O histórico da rejeição permanece preservado.

### Fluxo — Dois atendentes atuam no mesmo lote

1. Dois atendentes abrem o mesmo lote pendente.
2. O primeiro confirma o vínculo.
3. O lote passa para **Vinculado**.
4. O segundo tenta rejeitar ou vincular o lote.
5. A HMS impede a ação incompatível.
6. A tela informa que o lote já foi atualizado e apresenta o estado atual.

---

## 6. Critérios de Aceite do MVP

O módulo estará apto para o MVP quando:

- recebimentos com arquivos por WhatsApp criarem lotes;
- recebimentos com arquivos por e-mail criarem lotes;
- mensagens sem arquivos não criarem lotes;
- cada lote possuir código, origem, momento e quantidade de arquivos;
- todo novo lote iniciar como pendente;
- a caixa apresentar filtros de todos, pendentes, vinculados e rejeitados;
- a tabela diferenciar **Recebido de** e **Cliente**;
- o remetente nunca for tratado automaticamente como cliente;
- a sugestão apresentar no máximo um cliente;
- sugestões ambíguas não forem exibidas;
- cada sugestão apresentar evidências objetivas;
- CPF e CNPJ forem mascarados na interface;
- nenhuma sugestão gerar vínculo automático;
- o atendente puder confirmar a sugestão;
- o atendente puder buscar e selecionar outro cliente;
- **Confirmar vínculo** permanecer desabilitado sem seleção;
- o atendente puder registrar que não foi possível identificar;
- essa ação mantiver o lote pendente;
- o vínculo associar todos os arquivos do lote ao cliente confirmado;
- o modal não exigir caso, consulta ou item de checklist;
- lotes pendentes puderem ser rejeitados com motivo;
- a rejeição não excluir definitivamente os arquivos;
- a rejeição não notificar automaticamente o remetente;
- administradores puderem restaurar lotes rejeitados;
- ações concorrentes não criarem decisões conflitantes;
- todas as decisões registrarem responsável e momento;
- somente colaboradores autenticados e autorizados acessarem a triagem.

---

## 7. Indicadores de Produto e Operação

- quantidade de lotes recebidos por canal;
- quantidade de arquivos recebidos por canal;
- quantidade de lotes pendentes, vinculados e rejeitados;
- tempo médio entre recebimento e vínculo;
- idade do lote pendente mais antigo;
- percentual de lotes com correspondência sugerida;
- percentual de sugestões confirmadas sem alteração;
- percentual de sugestões substituídas por outro cliente;
- percentual de lotes resolvidos por busca manual;
- quantidade de tentativas encerradas sem identificação;
- quantidade de lotes rejeitados por motivo;
- quantidade de lotes restaurados;
- quantidade de ações concorrentes impedidas;
- quantidade de recebimentos duplicados evitados;
- percentual de lotes com remetente não identificado;
- percentual de arquivos indisponíveis ou inválidos.

Os indicadores devem evitar exposição desnecessária de dados pessoais. Métricas
operacionais devem ser apresentadas de forma agrupada sempre que a identificação
individual não for necessária.

---

## 8. Relação com Outras Áreas do Produto

### Identidade

- mantém os cadastros de clientes usados na sugestão e na busca manual;
- impede duplicidade por CPF ou CNPJ;
- controla os colaboradores e suas permissões gerais;
- recebe o fluxo de cadastro quando o cliente ainda não existe.

### Comunicação

- mantém a conversa e o contexto das mensagens recebidas;
- entrega ao Motor Documental os arquivos e os dados de origem;
- continua responsável por respostas ou notificações ao remetente;
- não presume consentimento de comunicação a partir do recebimento de arquivos.

### Consulta

- pode consultar arquivos já vinculados ao cliente quando forem pertinentes;
- não recebe automaticamente todos os arquivos como parte da ficha;
- não altera o cliente confirmado na triagem.

### Casos

- mantém os itens de checklist e suas exigências;
- permite que uma pessoa autorizada relacione posteriormente um arquivo ao item
  adequado;
- não transfere ao atendente da triagem a decisão sobre suficiência documental.

### Produção Documental

- produz documentos a partir de modelos;
- preserva os documentos gerados ou escritos manualmente;
- pode utilizar arquivos do cliente como informação autorizada;
- não é responsável por identificar o cliente de um lote recebido.

### Catálogo Jurídico

- mantém áreas e temas jurídicos;
- não participa da identificação inicial do cliente;
- poderá apoiar classificações documentais futuras fora do MVP.

---

## 9. Fora do Escopo

- canais diferentes de WhatsApp e e-mail no MVP;
- upload manual pela caixa de triagem;
- portal externo para envio de documentos;
- sugestão de vários clientes ao mesmo tempo;
- vínculo automático sem confirmação humana;
- criação de cliente dentro do modal de vínculo;
- vínculo do lote a intake;
- escolha de consulta durante a triagem;
- escolha de caso durante a triagem;
- associação a item de checklist pelo atendente;
- separação manual de um lote;
- união manual de lotes;
- alteração dos arquivos originais;
- exclusão definitiva de lotes rejeitados;
- notificação automática ao remetente quando o lote for rejeitado;
- classificação jurídica definitiva dos arquivos;
- validação de autenticidade documental;
- decisão de que um arquivo comprova um fato;
- decisão de que um arquivo atende integralmente a um checklist;
- detecção avançada de fraude;
- aprovação automática de documentos;
- classificação de acesso como confidencial ou restrito;
- aceite provisório, dispensa ou adiamento de documentos;
- correção comum do cliente de um lote já vinculado;
- uso de inteligência artificial generativa para decidir o cliente.

---

## 10. Perguntas Pendentes

1. Qual perfil, além de administrador, poderá corrigir o cliente de um lote já
   vinculado incorretamente?
2. A correção de um vínculo exigirá justificativa e uma segunda aprovação?
3. Por quanto tempo lotes rejeitados e seus arquivos deverão ser preservados?
4. A HMS permitirá reenviar ao remetente uma solicitação de identificação em uma
   etapa futura?
5. Qual será o tamanho máximo de um arquivo e de um lote em cada canal?
6. Quais formatos de arquivo serão aceitos no lançamento do MVP?
7. Quando uma mensagem do WhatsApp contiver vários arquivos enviados
   separadamente, haverá no futuro uma ação para reuni-los?
8. Qual equipe realizará a classificação documental e a associação posterior ao
   checklist?
9. A restauração exigirá que o administrador informe um motivo?
10. Lotes pendentes há muitos dias deverão gerar alerta ou prioridade especial?

Até essas decisões serem respondidas, este PRD considera que:

- somente administradores poderão tratar correções excepcionais de vínculo;
- vínculos já confirmados não serão alterados pelo fluxo comum do MVP;
- lotes rejeitados serão preservados sem prazo de exclusão definido;
- o remetente não receberá mensagens automáticas da triagem;
- cada mensagem será tratada como uma ocorrência independente;
- a associação a checklist acontecerá em um fluxo posterior e especializado;
- lotes pendentes continuarão ordenados por data, sem prioridade automática.
