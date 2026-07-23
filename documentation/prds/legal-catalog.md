# PRD — Módulo de Catálogo Jurídico

---

## 1. Visão Geral

O módulo de **Catálogo Jurídico** organiza a classificação jurídica usada em toda
a HMS. Ele mantém as áreas jurídicas e os temas pertencentes a cada área,
permitindo que diferentes etapas utilizem os mesmos nomes e relações.

Uma **área jurídica** representa um campo amplo de atuação, como Direito
Previdenciário, Direito Trabalhista ou Direito Civil. Um **tema jurídico**
representa um assunto mais específico dentro de uma área, como Aposentadoria,
Verbas rescisórias ou Responsabilidade civil.

O catálogo é administrado de forma centralizada. Colaboradores, consultas,
templates de documentos, configurações de pacotes e outros cadastros apenas
selecionam áreas e temas disponíveis. Eles não criam novas classificações durante
seus próprios fluxos.

### Objetivo

Garantir que a HMS use uma classificação jurídica única, compreensível e
reutilizável, evitando nomes duplicados, temas associados à área errada e
divergências entre atendimento, produção documental e atuação dos profissionais.

### Problema resolvido

Sem um catálogo central, a mesma área pode aparecer com nomes diferentes,
consultas podem usar temas incompatíveis, templates podem ser sugeridos para
assuntos incorretos e colaboradores podem receber especialidades que não
correspondem à classificação adotada pelo escritório.

A exclusão ou alteração descuidada de uma classificação também pode tornar
cadastros antigos incompreensíveis. O módulo deve permitir evolução do catálogo
sem apagar o contexto histórico.

### Valor entregue

- nomes jurídicos padronizados;
- relação clara entre área e tema;
- prevenção de duplicidades;
- gestão central por administradores;
- disponibilidade controlada para novos cadastros;
- preservação das associações antigas;
- seleção coerente em colaboradores e consultas;
- classificação consistente de templates;
- critérios confiáveis para pacotes de documentos;
- base comum para busca, filtros e indicadores.

### Contexto do MVP

Administradores cadastram e mantêm o catálogo. Uma área pode possuir vários
temas, mas cada tema pertence a uma única área.

No MVP:

- advogados, paralegais e supervisores possuem uma área e um ou mais temas;
- uma consulta possui uma área e um tema;
- um template de documento possui uma área e um ou mais temas;
- uma configuração de pacote possui uma área e um ou mais temas;
- a Agenda pode usar área e temas para ajudar na escolha do advogado;
- somente opções disponíveis podem ser usadas em novas associações.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- cadastrar áreas jurídicas;
- editar o nome das áreas;
- disponibilizar e indisponibilizar áreas;
- cadastrar temas dentro de uma área;
- editar o nome dos temas;
- disponibilizar e indisponibilizar temas;
- garantir que cada tema pertença a uma área;
- impedir nomes duplicados;
- apresentar áreas e temas para seleção;
- permitir pesquisa e filtros;
- preservar áreas e temas usados anteriormente;
- informar quando uma opção não está mais disponível;
- registrar alterações administrativas;
- oferecer uma classificação comum às demais áreas da HMS.

### 2.2 Responsabilidades que pertencem a outros módulos

- cadastrar colaboradores;
- definir a especialidade de cada colaborador;
- classificar uma consulta;
- manter templates de documentos;
- configurar pacotes de documentos;
- escolher o advogado para uma consulta;
- definir regras de atendimento por assunto;
- definir a equipe de um caso;
- produzir documentos;
- calcular indicadores jurídicos específicos.

### 2.3 Conceitos de negócio

#### Área jurídica

É a categoria ampla que representa um campo do Direito. Pode possuir vários temas
e pode estar disponível ou indisponível para novas associações.

#### Tema jurídico

É um assunto específico pertencente a uma única área. Pode estar disponível ou
indisponível para novas associações.

#### Opção disponível

É uma área ou tema que pode ser escolhido em um novo cadastro ou adicionado a uma
associação existente.

#### Opção indisponível

É uma área ou tema preservado para histórico, mas que não pode ser escolhido em
novas associações.

---

## 3. Requisitos

### Cadastro de área jurídica

- [ ] **Cadastrar uma nova área**

**Descrição:** Um administrador deve conseguir adicionar um novo campo de atuação
ao catálogo.

#### Regras de negócio

- Somente administradores autorizados podem cadastrar áreas.
- O nome da área é obrigatório.
- O nome não pode conter apenas espaços.
- Espaços antes ou depois do nome devem ser desconsiderados.
- Não pode existir outra área com o mesmo nome.
- Diferenças entre letras maiúsculas e minúsculas não tornam dois nomes
  diferentes.
- Uma área nova deve iniciar disponível, salvo decisão explícita de mantê-la
  indisponível durante a preparação.
- Cadastrar uma área não cria temas automaticamente.
- Cadastrar uma área não altera colaboradores, consultas ou documentos
  existentes.
- Uma tentativa repetida não deve criar duplicidade.

#### Regras de UI/UX

- A ação principal da gestão deve ser **Nova área jurídica**.
- O formulário deve usar o campo **Nome da área**.
- A interface deve mostrar se a área ficará disponível.
- Erros de duplicidade devem orientar a abrir a área existente.
- Depois da criação, deve ser oferecida a ação **Adicionar tema**.
- A conclusão deve retornar à área recém-criada.

---

### Edição da área jurídica

- [ ] **Corrigir ou atualizar o nome de uma área**

**Descrição:** Um administrador deve conseguir alterar a denominação apresentada
pela HMS.

#### Regras de negócio

- Somente administradores autorizados podem editar áreas.
- O novo nome deve seguir as mesmas regras do cadastro.
- O novo nome não pode duplicar outra área.
- Alterar o nome não cria uma nova área.
- Os temas permanecem associados.
- Colaboradores e consultas continuam relacionados à mesma área.
- Templates e configurações continuam relacionados à mesma área.
- O novo nome passa a ser usado nas próximas visualizações.
- O nome anterior deve permanecer reconhecível no histórico administrativo.
- Salvar sem alteração não deve criar uma atualização fictícia.

#### Regras de UI/UX

- A ação deve se chamar **Editar área**.
- A interface deve explicar que a alteração será refletida onde a área é
  apresentada.
- A lista de temas deve continuar visível no contexto da área.
- A ação principal deve ser **Salvar alterações**.
- A confirmação deve mostrar o nome resultante.

---

### Indisponibilização da área jurídica

- [ ] **Retirar uma área de novas seleções sem apagar seu histórico**

**Descrição:** Um administrador deve conseguir impedir novos usos de uma área que
deixou de fazer parte da atuação atual da HMS.

#### Regras de negócio

- Somente áreas disponíveis podem ser indisponibilizadas.
- A área não deve ser excluída.
- A área deixa de aparecer em novas seleções.
- Seus temas também deixam de aparecer em novas seleções enquanto a área estiver
  indisponível.
- Os estados individuais dos temas devem ser preservados.
- Colaboradores já associados não devem perder sua especialidade
  silenciosamente.
- Consultas existentes não devem perder sua classificação.
- Templates e configurações existentes não devem perder sua classificação.
- A ação deve apresentar os usos atuais antes da confirmação.
- Novas associações com a área devem ser impedidas.
- Reativar a área pode tornar novamente disponíveis os temas que já estavam
  disponíveis individualmente.

#### Regras de UI/UX

- A ação deve se chamar **Indisponibilizar área**.
- Não deve ser chamada **Excluir área**.
- A confirmação deve apresentar quantos temas e usos atuais serão afetados.
- A interface deve explicar que os cadastros existentes serão preservados.
- Áreas indisponíveis devem continuar localizáveis na gestão.
- O estado deve ser apresentado por texto.

---

### Reativação da área jurídica

- [ ] **Voltar a permitir o uso de uma área**

**Descrição:** Um administrador deve conseguir reativar uma área anteriormente
indisponibilizada.

#### Regras de negócio

- Somente área indisponível pode ser reativada.
- Reativar não cria uma nova área.
- Temas individualmente disponíveis voltam a poder ser escolhidos.
- Temas individualmente indisponíveis permanecem indisponíveis.
- Associações antigas não devem ser duplicadas.
- O nome atual da área deve continuar válido e único.
- A reativação deve permitir identificar quem a realizou e quando.

#### Regras de UI/UX

- A ação deve se chamar **Tornar área disponível**.
- A confirmação deve explicar quais temas poderão voltar às seleções.
- Depois da ação, o estado deve mudar para **Disponível**.
- A interface deve manter acesso ao histórico.

---

### Cadastro de tema jurídico

- [ ] **Adicionar um assunto específico a uma área**

**Descrição:** Um administrador deve conseguir cadastrar um tema dentro da área
correta.

#### Regras de negócio

- Somente administradores autorizados podem cadastrar temas.
- Todo tema deve pertencer a uma área.
- A área deve existir.
- A área precisa estar disponível para receber um novo tema.
- O nome do tema é obrigatório.
- O nome não pode conter apenas espaços.
- Espaços externos devem ser desconsiderados.
- Não pode existir outro tema com o mesmo nome dentro da mesma área.
- O mesmo nome pode existir em outra área quando representar um contexto jurídico
  diferente.
- Diferenças entre letras maiúsculas e minúsculas não tornam dois nomes distintos.
- O tema deve iniciar disponível, salvo decisão explícita de preparação.
- Criar o tema não o associa automaticamente a colaboradores, consultas ou
  templates.

#### Regras de UI/UX

- A criação deve ocorrer dentro do contexto de uma área.
- O cabeçalho deve mostrar a área escolhida.
- O campo deve se chamar **Nome do tema**.
- A ação principal deve ser **Adicionar tema**.
- A interface deve impedir a escolha de uma área indisponível.
- Depois da criação, o tema deve aparecer na lista da área.

---

### Edição do tema jurídico

- [ ] **Atualizar o nome apresentado para um tema**

**Descrição:** Um administrador deve conseguir corrigir a denominação de um tema
sem perder seus usos.

#### Regras de negócio

- Somente administradores autorizados podem editar temas.
- O nome deve seguir as mesmas regras do cadastro.
- O novo nome não pode duplicar outro tema da mesma área.
- Alterar o nome não cria um novo tema.
- A área do tema não pode ser trocada pelo fluxo comum.
- Colaboradores, consultas, templates e configurações continuam associados.
- O novo nome passa a aparecer nas próximas visualizações.
- O nome anterior deve permanecer reconhecível no histórico administrativo.
- Salvar sem alteração não deve criar atualização fictícia.

#### Regras de UI/UX

- A ação deve se chamar **Editar tema**.
- A área deve aparecer como contexto não editável.
- A interface deve explicar que o novo nome será refletido nos usos atuais.
- A ação principal deve ser **Salvar alterações**.
- Para trocar a área, a interface deve orientar a criar outro tema.

---

### Indisponibilização do tema jurídico

- [ ] **Retirar um tema de novas seleções**

**Descrição:** Um administrador deve conseguir impedir novos usos de um tema sem
apagar as associações existentes.

#### Regras de negócio

- Somente tema disponível pode ser indisponibilizado.
- O tema não deve ser excluído.
- O tema deixa de aparecer em novas seleções.
- Colaboradores já associados mantêm o histórico de especialidade.
- Consultas existentes mantêm sua classificação.
- Templates e configurações existentes mantêm sua classificação.
- A ação deve apresentar os usos atuais antes da confirmação.
- Um tema indisponível não pode ser adicionado a novas associações.
- Um tema indisponível pode continuar visível em cadastros antigos.
- A indisponibilização de um tema não altera os demais temas da área.

#### Regras de UI/UX

- A ação deve se chamar **Indisponibilizar tema**.
- A confirmação deve apresentar onde o tema ainda é utilizado.
- A interface deve explicar que usos existentes serão preservados.
- O estado **Indisponível** deve aparecer por texto.
- O tema deve continuar localizável na gestão.

---

### Reativação do tema jurídico

- [ ] **Voltar a permitir a seleção de um tema**

**Descrição:** Um administrador deve conseguir reativar um tema quando ele voltar
a ser utilizado pela HMS.

#### Regras de negócio

- Somente tema indisponível pode ser reativado.
- A área do tema precisa estar disponível.
- O nome do tema deve continuar único dentro da área.
- Reativar não cria um novo tema.
- O tema volta a aparecer em novas seleções.
- Associações anteriores não devem ser duplicadas.
- A reativação deve permitir identificar quem a realizou e quando.

#### Regras de UI/UX

- A ação deve se chamar **Tornar tema disponível**.
- Quando a área estiver indisponível, a interface deve explicar por que o tema
  não pode ser reativado.
- Depois da ação, o estado deve aparecer como **Disponível**.
- A interface deve manter acesso ao histórico.

---

### Relação entre área e tema

- [ ] **Garantir uma hierarquia jurídica coerente**

**Descrição:** Toda seleção de tema deve respeitar sua área de origem.

#### Regras de negócio

- Uma área pode possuir nenhum, um ou vários temas.
- Um tema pertence a exatamente uma área.
- Um tema não pode existir sem área.
- Um tema não pode ser selecionado junto a outra área.
- Trocar a área em um formulário exige nova seleção de temas.
- O catálogo possui somente dois níveis no MVP: área e tema.
- Não existem subtemas.
- A ordem visual não altera a relação entre os itens.
- A área pode permanecer disponível mesmo sem temas, mas não será suficiente para
  fluxos que exigem tema.

#### Regras de UI/UX

- Área deve aparecer antes de tema em todos os formulários.
- O campo de tema deve mostrar apenas opções da área selecionada.
- Sem área, o campo de tema deve permanecer indisponível.
- Ao trocar a área, a interface deve avisar que os temas atuais serão removidos.
- A confirmação deve acontecer antes de limpar seleções já preenchidas.

---

### Prevenção de duplicidades

- [ ] **Manter nomes únicos e reconhecíveis**

**Descrição:** A HMS deve evitar áreas e temas repetidos que representem a mesma
classificação.

#### Regras de negócio

- Nome de área deve ser único no catálogo.
- Nome de tema deve ser único dentro da área.
- Letras maiúsculas e minúsculas não diferenciam nomes.
- Espaços externos não diferenciam nomes.
- Vários espaços consecutivos devem ser tratados de forma consistente.
- Área ou tema indisponível continua contando para a verificação de duplicidade.
- Reativação deve usar o cadastro existente, e não criar outro.
- Nomes semelhantes podem existir quando o administrador confirmar que possuem
  significado jurídico diferente.
- A HMS não deve unir classificações automaticamente.

#### Regras de UI/UX

- A mensagem de duplicidade deve apresentar o item existente.
- A interface deve oferecer **Abrir área** ou **Abrir tema**.
- Sugestões de possíveis duplicidades devem ser apresentadas antes da conclusão.
- O administrador deve conseguir revisar o contexto antes de decidir.

---

### Listagem e pesquisa do catálogo

- [ ] **Localizar áreas e temas para administração**

**Descrição:** Administradores devem consultar o catálogo completo e encontrar
rapidamente uma classificação.

#### Regras de negócio

- A busca deve considerar nome da área.
- A busca deve considerar nome do tema.
- A listagem deve permitir filtro por disponibilidade.
- Áreas indisponíveis devem permanecer consultáveis.
- Temas indisponíveis devem permanecer consultáveis.
- Os resultados devem apresentar a relação entre tema e área.
- A ordenação padrão deve ser previsível.
- O total de temas de cada área pode ser apresentado.
- Somente administradores autorizados acessam ações de gestão.

#### Regras de UI/UX

- A tela deve se chamar **Catálogo Jurídico**.
- A ação principal deve ser **Nova área jurídica**.
- Áreas devem funcionar como agrupadores dos temas.
- Deve existir ação **Adicionar tema** dentro da área.
- Busca e filtros devem ficar no topo.
- Estados disponíveis e indisponíveis não devem depender apenas de cor.
- A interface deve diferenciar catálogo vazio de pesquisa sem resultados.

---

### Seleção simples de tema

- [ ] **Permitir a escolha de um único assunto principal**

**Descrição:** Fluxos como a consulta devem selecionar uma área e um tema
principal.

#### Regras de negócio

- A área deve ser escolhida primeiro.
- Somente áreas disponíveis podem ser usadas em nova classificação.
- Somente temas disponíveis da área podem ser escolhidos.
- Apenas um tema pode ser selecionado.
- Trocar a área remove o tema atual depois de confirmação.
- Um cadastro antigo pode continuar mostrando uma opção indisponível.
- Uma opção indisponível não pode ser escolhida novamente depois de removida.

#### Regras de UI/UX

- O campo deve se chamar **Tema jurídico** no singular.
- O seletor deve permitir pesquisa quando houver muitas opções.
- A opção atual deve permanecer legível.
- Tema indisponível em cadastro antigo deve receber o rótulo **Indisponível**.
- A interface deve orientar a regularização quando o cadastro for alterado.

---

### Seleção múltipla de temas

- [ ] **Permitir uma área com vários assuntos relacionados**

**Descrição:** Colaboradores jurídicos, templates e configurações de pacotes devem
selecionar um ou mais temas da mesma área.

#### Regras de negócio

- A área deve ser escolhida primeiro.
- Pelo menos um tema deve ser selecionado quando o fluxo exigir especialidade.
- Todos os temas devem pertencer à área.
- O mesmo tema não pode ser repetido.
- Somente temas disponíveis podem ser adicionados.
- Remover um tema não remove os demais.
- Trocar a área limpa todos os temas depois de confirmação.
- Opções antigas indisponíveis podem permanecer visíveis no cadastro.
- Uma opção indisponível removida não pode ser adicionada novamente.

#### Regras de UI/UX

- O campo deve se chamar **Temas jurídicos**.
- O seletor deve permitir pesquisa.
- Cada tema selecionado deve aparecer como item removível.
- Quando faltar espaço, os primeiros temas permanecem visíveis.
- Os demais devem ser resumidos como **+N**.
- Abrir o campo deve mostrar todos os temas selecionados.
- Vários temas não devem ser concatenados em um único texto.

---

### Proteção dos usos existentes

- [ ] **Preservar o significado dos cadastros históricos**

**Descrição:** Alterações no catálogo não devem apagar ou substituir
classificações usadas anteriormente.

#### Regras de negócio

- Indisponibilizar não remove associações existentes.
- Renomear mantém a continuidade da classificação.
- Colaboradores não perdem especialidades silenciosamente.
- Consultas não perdem sua área ou tema.
- Templates não perdem sua classificação.
- Configurações e pacotes não perdem seus critérios.
- Cadastros antigos devem continuar legíveis.
- Uma opção indisponível deve ser reconhecida como histórica.
- A gestão deve conseguir localizar os usos atuais antes de alterar o catálogo.
- Exclusão definitiva não faz parte do fluxo comum do MVP.

#### Regras de UI/UX

- Antes de indisponibilizar, a interface deve apresentar um resumo dos impactos.
- Cadastros antigos devem mostrar o nome e o estado da opção.
- A interface não deve apagar campos ou chips automaticamente.
- Quando uma alteração exigir regularização, deve oferecer orientação clara.
- O histórico administrativo deve permanecer acessível sem dominar a tela comum.

---

### Permissões e rastreabilidade

- [ ] **Restringir a gestão e preservar as decisões administrativas**

**Descrição:** Somente pessoas autorizadas devem alterar o catálogo, e as mudanças
precisam permanecer compreensíveis.

#### Regras de negócio

- Administradores autorizados podem criar e editar áreas e temas.
- Administradores autorizados podem disponibilizar e indisponibilizar.
- Outros perfis podem consultar opções conforme seus fluxos.
- Selecionar uma opção não concede permissão para alterá-la.
- Cada criação, edição e mudança de disponibilidade deve registrar responsável e
  data.
- Desabilitar um administrador não apaga sua autoria anterior.
- A repetição acidental de uma ação não deve duplicar itens.
- Na ausência de permissão, a alteração deve ser impedida.

#### Regras de UI/UX

- Ações administrativas não devem aparecer como disponíveis para outros perfis.
- Responsáveis devem ser apresentados pelo nome profissional.
- A confirmação deve explicar o impacto da ação.
- Erros não devem expor informações desnecessárias.
- A tela principal deve priorizar o estado atual; o histórico fica disponível em
  segundo nível.

---

## 4. Regras Gerais

### 4.1 Consistência jurídica

- Área representa uma categoria ampla.
- Tema representa um assunto específico.
- Tema pertence a uma única área.
- Formulários sempre escolhem área antes de tema.
- Opções indisponíveis não entram em novas associações.
- Nomes duplicados devem ser impedidos.
- Mudanças não apagam usos existentes.

### 4.2 Governança

- Somente administradores alteram o catálogo.
- Indisponibilização substitui exclusão no fluxo comum.
- Impactos devem ser apresentados antes de uma mudança.
- A autoria das alterações deve ser preservada.
- O catálogo não deve receber classificações criadas informalmente em outros
  fluxos.

### 4.3 Linguagem e acessibilidade

- Nomes devem usar linguagem jurídica reconhecível pela HMS.
- Siglas devem ser evitadas quando puderem gerar ambiguidade.
- Estados não podem depender somente de cor.
- Seletores devem funcionar por teclado.
- O foco deve permanecer visível.
- Mensagens devem explicar como corrigir duplicidade ou incompatibilidade.
- A interface deve ser profissional, sóbria e acolhedora.

### 4.4 Evolução segura

- Renomear não cria uma classificação diferente.
- Mudar uma classificação de área exige novo tema, não transferência silenciosa.
- Indisponibilizar preserva histórico.
- Reativar reutiliza o cadastro anterior.
- Fusões ou divisões exigem um fluxo futuro específico.
- Os demais módulos não devem manter catálogos paralelos.

---

## 5. Fluxos de Usuário

### Fluxo A — Administrador cria uma área

1. O administrador abre **Catálogo Jurídico**.
2. Seleciona **Nova área jurídica**.
3. Informa o nome.
4. Confirma que a área ficará disponível.
5. A HMS verifica duplicidades.
6. O administrador conclui.
7. A área aparece sem temas.
8. A interface oferece **Adicionar tema**.

### Fluxo B — Administrador adiciona temas

1. O administrador abre uma área disponível.
2. Seleciona **Adicionar tema**.
3. A área permanece visível no cabeçalho.
4. O administrador informa o nome.
5. A HMS verifica duplicidade dentro da área.
6. O administrador confirma.
7. O tema aparece como **Disponível**.
8. O processo pode ser repetido para outros temas.

### Fluxo C — Administrador tenta criar duplicidade

1. O administrador informa um nome já utilizado.
2. A HMS identifica o item existente.
3. A interface impede a criação.
4. Apresenta o nome e o estado atual.
5. Oferece abrir o cadastro existente.
6. Nenhuma nova classificação é criada.

### Fluxo D — Administrador renomeia uma área

1. O administrador abre a área.
2. Seleciona **Editar área**.
3. Informa o novo nome.
4. A HMS verifica duplicidades.
5. A interface explica que os usos atuais continuarão relacionados.
6. O administrador salva.
7. O novo nome passa a ser apresentado.
8. Os temas permanecem na mesma área.

### Fluxo E — Administrador indisponibiliza um tema

1. O administrador abre o tema.
2. Seleciona **Indisponibilizar tema**.
3. A HMS apresenta os usos atuais.
4. Explica que cadastros existentes serão preservados.
5. O administrador confirma.
6. O tema sai das novas seleções.
7. Cadastros antigos continuam mostrando o tema como indisponível.

### Fluxo F — Administrador indisponibiliza uma área

1. O administrador abre a área.
2. Seleciona **Indisponibilizar área**.
3. A HMS apresenta temas e usos afetados.
4. O administrador revisa o impacto.
5. Confirma.
6. A área e seus temas deixam de aparecer em novas seleções.
7. Os estados individuais dos temas são preservados.
8. Usos históricos permanecem legíveis.

### Fluxo G — Administrador reativa uma área

1. O administrador filtra por áreas indisponíveis.
2. Abre a área.
3. Seleciona **Tornar área disponível**.
4. A interface mostra quais temas individuais estão disponíveis.
5. O administrador confirma.
6. A área volta às seleções.
7. Temas disponíveis voltam a aparecer.
8. Temas indisponíveis continuam ocultos das novas seleções.

### Fluxo H — Advogado seleciona um tema em uma consulta

1. O advogado abre a classificação da consulta.
2. Escolhe a área.
3. O campo de tema passa a mostrar apenas temas daquela área.
4. O advogado escolhe um tema.
5. Ao trocar a área, a HMS avisa que o tema será removido.
6. Depois da confirmação, o advogado escolhe um tema da nova área.

### Fluxo I — Administrador seleciona vários temas em um template

1. O administrador abre o modal do template.
2. Seleciona a área jurídica.
3. Abre **Temas jurídicos**.
4. Pesquisa e seleciona vários temas.
5. Cada tema aparece como item removível.
6. Quando faltar espaço, os demais são resumidos como **+N**.
7. O administrador salva o template.

### Fluxo J — Cadastro antigo usa tema indisponível

1. Um colaborador abre um cadastro antigo.
2. O tema continua apresentado.
3. A interface informa **Indisponível**.
4. Alterações não relacionadas podem ser consultadas normalmente.
5. Se o tema for removido, ele não poderá ser selecionado novamente.
6. A interface oferece opções disponíveis da mesma área.

---

## 6. Critérios de Aceite do MVP

O módulo estará apto para o MVP quando:

- administradores conseguirem criar áreas;
- nomes de áreas duplicados forem impedidos;
- uma área puder possuir vários temas;
- cada tema pertencer a somente uma área;
- temas duplicados dentro da área forem impedidos;
- o mesmo nome de tema puder existir em áreas diferentes;
- áreas e temas puderem ser renomeados;
- renomear não perder usos existentes;
- áreas e temas puderem ser indisponibilizados sem exclusão;
- opções indisponíveis deixarem de aparecer em novas seleções;
- usos antigos continuarem legíveis;
- indisponibilizar uma área retirar seus temas das novas seleções;
- reativar uma área respeitar o estado individual dos temas;
- tema não puder ser reativado enquanto a área estiver indisponível;
- seletores mostrarem somente temas da área escolhida;
- troca de área exigir nova seleção de temas;
- consultas aceitarem um tema;
- colaboradores e templates aceitarem vários temas;
- multisseletores permitirem pesquisa, remoção e resumo **+N**;
- impactos serem apresentados antes da indisponibilização;
- alterações administrativas permanecerem rastreáveis;
- exclusão definitiva não fizer parte do fluxo comum.

---

## 7. Indicadores de Produto e Operação

- quantidade de áreas disponíveis e indisponíveis;
- quantidade de temas por área;
- quantidade de temas disponíveis e indisponíveis;
- áreas sem temas;
- frequência de uso de cada área;
- frequência de uso de cada tema;
- quantidade de tentativas de duplicidade impedidas;
- quantidade de áreas e temas renomeados;
- quantidade de indisponibilizações e reativações;
- número de colaboradores por área e tema;
- número de consultas por área e tema;
- número de templates por área e tema;
- configurações de pacotes por área e temas;
- quantidade de cadastros ainda associados a opções indisponíveis;
- tempo médio para regularização de associações indisponíveis.

Os indicadores devem ser apresentados de forma agrupada sempre que não houver
necessidade de identificar cliente ou colaborador.

---

## 8. Relação com Outras Áreas do Produto

### Identidade

- usa uma área e vários temas na especialidade de advogados, paralegais e
  supervisores;
- não cria áreas ou temas;
- preserva associações antigas indisponíveis.

### Consulta

- usa uma área e um tema como classificação principal;
- mostra apenas temas compatíveis com a área;
- não altera o catálogo.

### Agendamento

- pode usar área e temas para ajudar a localizar advogados compatíveis;
- não associa temas diretamente ao horário;
- não mantém classificações paralelas.

### Produção Documental

- usa área e temas no cadastro dos templates;
- usa área e vários temas nas configurações de pacotes;
- utiliza somente opções disponíveis em novos cadastros;
- preserva pacotes antigos.

### Formalização e Casos

- usam a classificação quando necessária para continuidade;
- não criam novos itens no catálogo;
- preservam o contexto das classificações utilizadas.

### Indicadores

- agrupam informações por área e tema;
- não alteram nomes ou disponibilidade;
- devem considerar classificações indisponíveis em históricos.

---

## 9. Fora do Escopo

- cadastro de colaboradores;
- cadastro de clientes;
- classificação automática por inteligência artificial;
- criação de área ou tema durante uma consulta;
- criação de área ou tema dentro do template;
- regras de agenda por área;
- regras de distribuição de casos;
- modelos de documentos;
- configurações de pacotes;
- formulários jurídicos específicos;
- subtemas ou terceiro nível de classificação;
- tema pertencente a várias áreas;
- múltiplas áreas para o mesmo tema;
- transferência de tema entre áreas;
- fusão automática de áreas ou temas;
- divisão automática de uma classificação;
- exclusão definitiva;
- importação em massa;
- catálogo público para clientes;
- tradução dos nomes para outros idiomas;
- sinônimos, apelidos ou palavras-chave no MVP;
- ordenação manual personalizada no MVP;
- regras financeiras por área ou tema.

---

## 10. Perguntas Pendentes

1. Áreas e temas precisarão de descrição além do nome?
2. A ordenação será sempre alfabética ou administradores poderão definir uma
   ordem manual?
3. Nomes com e sem acento serão considerados duplicados?
4. O mesmo nome de tema poderá realmente existir em áreas diferentes?
5. Uma área poderá ser indisponibilizada mesmo com colaboradores e templates
   ativos associados?
6. A HMS deve exigir regularização dos usos atuais antes da
   indisponibilização?
7. Ao reativar uma área, temas anteriormente disponíveis devem voltar
   automaticamente?
8. Será necessário registrar um motivo para indisponibilizar área ou tema?
9. Administradores poderão visualizar uma lista completa dos usos antes da
   alteração?
10. No futuro, haverá sinônimos para melhorar pesquisa e sugestões?

Até essas decisões serem respondidas, este PRD considera que:

- áreas e temas possuem somente nome e disponibilidade;
- a ordenação padrão é alfabética;
- comparações ignoram maiúsculas, minúsculas e espaços externos;
- o mesmo nome de tema pode existir em áreas diferentes;
- indisponibilização é permitida depois de apresentar os impactos;
- os usos atuais não precisam ser removidos;
- reativar uma área torna utilizáveis os temas individualmente disponíveis;
- motivo de indisponibilização é opcional;
- administradores podem consultar os usos antes de confirmar;
- sinônimos não fazem parte do MVP.
