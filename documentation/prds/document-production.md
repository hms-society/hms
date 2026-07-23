# PRD — Módulo de Produção Documental

---

## 1. Visão Geral

O módulo de **Produção Documental** organiza os documentos preparados pela HMS a
partir de modelos reutilizáveis. Ele atende três momentos principais da jornada:

- consulta;
- formalização;
- produção jurídica durante um caso.

O módulo mantém os modelos de documento, define quais modelos devem ser sugeridos
para cada área e conjunto de temas jurídicos, cria pacotes para um atendimento
específico e acompanha cada documento desde a geração ou redação manual até a
revisão e aprovação.

Um documento pode ser produzido com apoio de inteligência artificial ou escrito
manualmente. Em ambos os caminhos, a decisão final é humana. Conteúdo gerado não
pode ser aprovado ou enviado automaticamente.

O pacote representa o conjunto de documentos preparados para uma etapa
específica. Ele só pode ser confirmado quando possuir pelo menos um documento e
todos os documentos incluídos estiverem aprovados.

### Objetivo

Padronizar a produção de documentos da HMS sem retirar a responsabilidade dos
profissionais, permitindo reutilizar modelos, sugerir pacotes conforme o assunto
jurídico, preservar o histórico de elaboração e garantir revisão antes da
aprovação.

### Problema resolvido

Sem uma produção documental centralizada, cada etapa pode usar modelos
desatualizados, gerar documentos diferentes para situações equivalentes, perder
o histórico das alterações ou avançar com conteúdo sem revisão.

Também existe risco de uma alteração administrativa modificar documentos que já
estavam em andamento, de uma rejeição excluir o documento do pacote por engano ou
de uma nova geração apagar o trabalho manual realizado anteriormente.

### Valor entregue

- modelos de documento centralizados;
- associação dos modelos a áreas e temas jurídicos;
- configurações padrão para consultas, formalizações e casos;
- sugestão consistente dos documentos aplicáveis;
- distinção entre documentos obrigatórios e opcionais;
- apoio de inteligência artificial com revisão humana;
- alternativa de redação manual;
- retorno da redação manual para nova geração assistida;
- histórico das versões produzidas;
- aprovação individual de cada documento;
- confirmação segura do pacote completo;
- reaproveitamento do mesmo padrão em diferentes etapas da jornada.

### Contexto do MVP

Um administrador cadastra os modelos oficiais e configura os pacotes padrão. Ao
chegar a uma consulta, formalização ou etapa do caso, a HMS usa a área e os temas
jurídicos para sugerir os documentos aplicáveis.

O colaborador responsável escolhe os documentos, confirma a geração e acompanha
cada item. Um documento pode:

- estar sendo gerado;
- aguardar informações;
- ficar disponível para revisão;
- seguir para preenchimento manual;
- apresentar falha;
- ser aprovado.

Se o profissional rejeitar uma geração, o documento continua no pacote e passa
para preenchimento manual. Se depois decidir retomar o apoio da inteligência
artificial, pode solicitar uma nova geração sem apagar o histórico anterior.

---

## 2. Escopo e Responsabilidades

### 2.1 Responsabilidades do módulo

- cadastrar modelos de documento;
- manter o arquivo-base de cada modelo;
- associar modelos a área e temas jurídicos;
- ativar e desativar modelos;
- configurar pacotes padrão;
- definir a ordem dos documentos no pacote;
- definir em qual etapa cada documento deve ser produzido;
- definir se um documento é obrigatório;
- sugerir documentos conforme área, temas e etapa;
- criar um pacote para uma consulta, formalização ou caso;
- preservar o conteúdo da configuração usada na criação do pacote;
- permitir reconfiguração antes da confirmação;
- gerar documentos com apoio de inteligência artificial;
- permitir redação manual;
- registrar as versões produzidas;
- indicar qual versão está em uso;
- permitir revisão, ajuste, rejeição e aprovação;
- permitir retorno da redação manual para geração assistida;
- confirmar o pacote quando todos os documentos estiverem aprovados;
- preservar pacotes confirmados.

### 2.2 Responsabilidades que pertencem a outros módulos

- criar e manter áreas e temas jurídicos;
- classificar a consulta ou o caso;
- cadastrar clientes e colaboradores;
- registrar o conteúdo da consulta;
- conduzir a formalização;
- administrar o andamento do caso;
- receber e classificar documentos enviados pelo cliente;
- validar qualidade de documentos recebidos;
- controlar prazos, audiências e tarefas;
- realizar assinatura eletrônica;
- enviar documentos ao cliente ou a terceiros;
- realizar protocolo ou distribuição judicial.

### 2.3 Conceitos de negócio

#### Modelo de documento

É a referência reutilizável usada para iniciar a produção de um documento. Possui
nome, descrição, arquivo-base, área, temas e disponibilidade.

#### Configuração padrão de pacote

Define quais modelos devem ser sugeridos para uma combinação de área e temas. Para
cada modelo, informa a ordem, o momento de produção e se o documento é
obrigatório.

#### Pacote de documentos

É o conjunto de documentos criado para uma consulta, formalização ou caso
específico. Depois de criado, mantém suas próprias escolhas e não é alterado
automaticamente por mudanças administrativas futuras.

#### Documento do pacote

É um documento individual que precisa ser produzido, revisado e aprovado dentro
do pacote.

#### Versão do documento

É uma etapa preservada do conteúdo, criada por geração assistida ou redação
manual. Uma versão permanece como atual até ser substituída por outra.

---

## 3. Requisitos

### Cadastro de modelo de documento

- [ ] **Cadastrar um modelo reutilizável**

**Descrição:** Um administrador deve conseguir cadastrar um modelo oficial que
possa ser usado na produção de documentos.

#### Regras de negócio

- Somente administradores autorizados podem cadastrar modelos.
- Todo modelo deve possuir nome.
- O nome deve permitir que o modelo seja reconhecido sem abrir o arquivo.
- O modelo deve possuir uma descrição objetiva de sua finalidade.
- O modelo deve possuir um arquivo-base.
- O arquivo-base deve estar disponível antes da ativação.
- O modelo deve possuir uma área jurídica.
- O modelo deve possuir um ou mais temas jurídicos.
- Todos os temas devem pertencer à área selecionada.
- O mesmo tema não pode ser repetido.
- O cadastro inicial pode permanecer indisponível enquanto estiver incompleto.
- Um modelo incompleto não pode ser usado em novos pacotes.
- Cadastrar o modelo não o adiciona automaticamente a todas as configurações
  compatíveis.

#### Regras de UI/UX

- O modal deve usar os campos **Nome do template**, **Descrição**, **Área
  jurídica**, **Temas jurídicos** e **Arquivo-base**.
- A área deve aparecer antes dos temas.
- O campo de temas deve permitir seleção múltipla.
- O arquivo selecionado deve permanecer visível antes da conclusão.
- Campos obrigatórios devem ser identificados.
- Na criação, o título deve ser **Adicionar template de documento** e a ação
  principal deve ser **Adicionar template**.
- Na edição, o título deve ser **Editar template de documento** e a ação
  principal deve ser **Salvar alterações**.
- A interface deve explicar que a inclusão nos pacotes é configurada
  separadamente.

---

### Associação do modelo a área e temas

- [ ] **Classificar o modelo conforme sua aplicação jurídica**

**Descrição:** Cada modelo deve indicar em quais assuntos jurídicos pode ser
utilizado.

#### Regras de negócio

- O modelo possui uma área jurídica.
- O modelo possui pelo menos um tema.
- Os temas precisam pertencer à área.
- Somente áreas e temas disponíveis podem ser escolhidos em novos cadastros.
- Ao trocar a área, os temas atuais devem ser revistos.
- A classificação do modelo orienta onde ele pode ser sugerido.
- Um modelo não deve ser sugerido para tema incompatível.
- A alteração da classificação vale apenas para novas sugestões.
- Documentos já criados a partir do modelo não devem ser reclassificados.
- Pacotes já criados não devem perder o modelo por uma alteração posterior.

#### Regras de UI/UX

- **Temas jurídicos** deve ser um campo pesquisável.
- Cada tema selecionado deve aparecer como item removível dentro do campo.
- Quando não houver espaço, os primeiros temas permanecem visíveis e os demais
  são resumidos como **+N**.
- Os temas não devem ser concatenados em um único texto.
- Trocar a área deve avisar que os temas atuais serão removidos.
- A interface deve impedir a conclusão sem ao menos um tema.

---

### Edição do modelo

- [ ] **Atualizar informações de um modelo**

**Descrição:** Um administrador deve conseguir corrigir nome, descrição,
classificação ou arquivo-base de um modelo.

#### Regras de negócio

- Somente administradores autorizados podem editar modelos.
- A edição deve respeitar as mesmas validações do cadastro.
- Alterar nome ou descrição vale para apresentações futuras.
- Alterar área ou temas vale para novas sugestões.
- Alterar o arquivo-base vale para novas produções.
- Documentos já produzidos não devem mudar.
- Pacotes já criados não devem receber silenciosamente o novo arquivo-base.
- A alteração não deve apagar o histórico do modelo.
- Salvar sem alterações não deve criar uma atualização fictícia.

#### Regras de UI/UX

- A interface deve diferenciar informações gerais, classificação e arquivo-base.
- Área e temas devem permanecer no mesmo modal usado para editar o template.
- A troca do arquivo-base deve exigir confirmação.
- A confirmação deve explicar que documentos já produzidos não serão alterados.
- O arquivo anterior deve permanecer identificável no histórico administrativo.
- A ação principal deve ser **Salvar alterações**.

---

### Ativação e desativação do modelo

- [ ] **Controlar se o modelo pode ser usado em novas produções**

**Descrição:** Um administrador deve conseguir retirar um modelo de uso sem
apagar seu histórico.

#### Regras de negócio

- Um modelo disponível pode ser usado em novas configurações e pacotes.
- Um modelo indisponível não pode ser escolhido em novas configurações.
- Um modelo indisponível não deve ser sugerido em novas produções.
- A desativação não remove o modelo de pacotes já criados.
- A desativação não apaga documentos produzidos.
- Configurações que ainda apontem para o modelo devem indicar que precisam de
  revisão.
- Reativar o modelo torna possível usá-lo novamente em novas configurações.
- A desativação deve preservar nome, descrição, classificação e arquivo-base.

#### Regras de UI/UX

- A ação deve ser chamada **Desativar modelo**, e não **Excluir**.
- A confirmação deve explicar o impacto nas novas produções.
- Modelos desativados devem continuar localizáveis na gestão.
- O estado deve ser apresentado por texto.
- Configurações afetadas devem possuir uma indicação clara.

---

### Listagem e localização de modelos

- [ ] **Encontrar modelos para gestão e configuração**

**Descrição:** Administradores devem conseguir localizar rapidamente o modelo
correto.

#### Regras de negócio

- A busca deve considerar nome e descrição.
- A listagem deve permitir filtro por área.
- A listagem deve permitir filtro por tema.
- A listagem deve permitir filtro por disponibilidade.
- Modelos desativados devem permanecer consultáveis.
- Os resultados devem possuir uma ordem previsível.
- Informações suficientes devem ser exibidas para distinguir modelos semelhantes.

#### Regras de UI/UX

- Cada item deve mostrar nome, área, temas e disponibilidade.
- Muitos temas devem ser resumidos sem perder a possibilidade de consulta.
- Filtros ativos devem ficar visíveis.
- A interface deve diferenciar lista vazia de busca sem resultados.
- A ação principal da tela deve ser **Novo modelo**.

---

### Configuração padrão dos pacotes

- [ ] **Definir quais documentos devem ser sugeridos por assunto**

**Descrição:** Um administrador deve configurar a composição padrão dos pacotes
para uma área e um ou mais temas jurídicos.

#### Regras de negócio

- A configuração deve possuir uma área jurídica.
- A configuração deve possuir um ou mais temas.
- Todos os temas devem pertencer à área.
- A configuração deve possuir ao menos um documento para ser ativada.
- Cada documento deve usar um modelo disponível.
- O mesmo modelo não pode aparecer duas vezes na mesma configuração para o mesmo
  momento de produção.
- Para cada documento, devem ser definidos:
  - posição;
  - momento de produção;
  - obrigatoriedade.
- Os momentos permitidos são:
  - consulta;
  - formalização;
  - caso.
- A posição deve ser única dentro do mesmo momento.
- Alterar uma configuração afeta somente pacotes criados no futuro.
- Pacotes já criados não devem ser atualizados automaticamente.
- Uma combinação equivalente de área e temas não deve possuir duas configurações
  disponíveis concorrentes no MVP.

#### Regras de UI/UX

- A tela deve se chamar **Configuração dos Pacotes de Documentos**.
- A área deve aparecer antes dos temas.
- A lista de documentos deve aparecer depois dos critérios.
- Cada linha deve apresentar modelo, momento, obrigatoriedade e posição.
- A ordem deve poder ser reorganizada de forma clara.
- A ação principal deve ser **Salvar configuração**.
- A tela não deve ser chamada de cadastro de modelos.

---

### Seleção de temas na configuração

- [ ] **Selecionar vários temas sem perder legibilidade**

**Descrição:** A configuração deve permitir que um pacote padrão seja aplicável a
mais de um tema da mesma área.

#### Regras de negócio

- Pelo menos um tema deve ser selecionado.
- Todos os temas devem pertencer à área.
- Temas repetidos devem ser impedidos.
- Temas indisponíveis não podem ser adicionados.
- Trocar a área exige nova seleção de temas.
- Remover todos os temas impede a conclusão.
- A ordem visual dos temas não altera a aplicação da configuração.

#### Regras de UI/UX

- O campo deve permitir pesquisa.
- Temas selecionados devem aparecer como itens removíveis.
- Os primeiros valores devem permanecer visíveis quando faltar espaço.
- Os demais devem ser resumidos como **+N**.
- Abrir o campo deve permitir visualizar todos os selecionados.
- A interface não deve unir vários temas em uma única linha de texto.

---

### Adição de documento à configuração

- [ ] **Adicionar um modelo já cadastrado ao pacote padrão**

**Descrição:** O administrador deve selecionar um modelo existente e definir como
ele participa da configuração.

#### Regras de negócio

- Apenas modelos disponíveis podem ser adicionados.
- O modelo deve ser compatível com a área e ao menos um dos temas da
  configuração.
- Adicionar o modelo não cria nem edita seu cadastro.
- O administrador deve escolher o momento de produção.
- O administrador deve definir se o documento é obrigatório.
- A posição deve ser definida ou calculada a partir da lista atual.
- Duplicidades devem ser impedidas.
- Cancelar a ação não deve alterar a configuração.

#### Regras de UI/UX

- A janela deve se chamar **Adicionar documento ao pacote**.
- O cabeçalho deve manter visíveis a área e a quantidade de temas.
- O modelo deve ser escolhido em uma lista pesquisável.
- A descrição do modelo deve aparecer apenas como contexto.
- Nome, descrição e arquivo-base não devem ser editáveis nessa janela.
- A ação final deve ser **Adicionar ao pacote**.
- O formulário deve conter somente modelo, momento e obrigatoriedade.

---

### Documentos obrigatórios e opcionais

- [ ] **Diferenciar o que é indispensável do que pode ser escolhido**

**Descrição:** A configuração deve informar quais documentos precisam compor todo
pacote aplicável e quais são apenas sugestões opcionais.

#### Regras de negócio

- Documento obrigatório deve ser incluído quando a configuração for aplicada ao
  momento correspondente.
- Documento obrigatório não pode ser retirado pelo fluxo comum de criação do
  pacote.
- Documento opcional pode ser selecionado ou ignorado pelo colaborador.
- A obrigatoriedade vale somente para novos pacotes.
- Alterar a obrigatoriedade não modifica pacotes já criados.
- Um documento obrigatório também precisa ser produzido, revisado e aprovado.
- Obrigatoriedade não significa aprovação automática.
- Um documento opcional incluído passa a precisar de aprovação para a
  confirmação do pacote.

#### Regras de UI/UX

- A obrigatoriedade deve ser comunicada por texto.
- Documentos obrigatórios devem aparecer selecionados.
- A interface deve explicar por que não podem ser removidos.
- Documentos opcionais devem permitir escolha clara.
- A diferença não deve depender apenas de cor ou ícone.

---

### Ordem e momento de produção

- [ ] **Organizar quando e em qual sequência os documentos aparecem**

**Descrição:** O administrador deve definir a etapa em que cada documento é
sugerido e a ordem em que será apresentado.

#### Regras de negócio

- Cada documento deve possuir um momento de produção.
- Um documento configurado para consulta deve ser sugerido na consulta.
- Um documento configurado para formalização deve ser sugerido na formalização.
- Um documento configurado para caso deve ser sugerido durante o caso.
- Documentos de outros momentos não devem aparecer antecipadamente como
  obrigatórios.
- A ordem deve ser respeitada na apresentação inicial.
- Reordenar a configuração não altera pacotes existentes.
- O colaborador pode produzir documentos em outra sequência quando a situação
  exigir, sem alterar a configuração padrão.

#### Regras de UI/UX

- O momento deve usar os rótulos **Consulta**, **Formalização** e **Caso**.
- A posição deve ficar compreensível na lista.
- A reorganização deve apresentar o resultado antes de salvar.
- A interface deve evitar números de posição conflitantes.

---

### Ativação da configuração padrão

- [ ] **Controlar quais configurações podem originar novos pacotes**

**Descrição:** Uma configuração deve poder ser preparada, revisada e
disponibilizada somente quando estiver completa.

#### Regras de negócio

- Configuração incompleta não pode ser disponibilizada.
- Configuração disponível pode ser usada em novos pacotes.
- Configuração indisponível não deve ser aplicada a novos pacotes.
- Desativar não altera pacotes já criados.
- Configurações antigas devem permanecer consultáveis.
- Uma nova configuração pode substituir a anterior para a mesma combinação.
- A substituição deve evitar duas configurações disponíveis concorrentes.
- Modelos indisponíveis devem impedir nova disponibilização até revisão.

#### Regras de UI/UX

- A interface deve apresentar **Disponível** e **Indisponível**.
- Pendências devem ser listadas antes da ativação.
- A desativação deve exigir confirmação.
- A confirmação deve explicar que pacotes existentes não serão alterados.

---

### Criação do pacote

- [ ] **Criar um pacote para uma etapa específica**

**Descrição:** Uma consulta, formalização ou caso deve conseguir iniciar um pacote
com os documentos aplicáveis àquele contexto.

#### Regras de negócio

- Todo pacote deve pertencer a uma consulta, formalização ou caso.
- Um pacote deve usar a área e os temas informados pela etapa de origem como
  critérios iniciais.
- A configuração disponível deve orientar os documentos sugeridos.
- Documentos obrigatórios do momento devem ser incluídos.
- Documentos opcionais devem depender da escolha do colaborador.
- O pacote deve preservar a composição escolhida no momento da criação.
- Mudanças futuras na configuração não devem alterar o pacote.
- Mudanças futuras no modelo não devem alterar documentos já iniciados.
- Criar o pacote não inicia geração automaticamente.
- A geração depende de confirmação explícita.
- O mesmo contexto não deve receber pacotes duplicados de forma acidental.

#### Regras de UI/UX

- Área e temas devem aparecer antes da lista de documentos.
- Os critérios iniciais não precisam de um marcador indicando sua origem.
- Documentos obrigatórios e opcionais devem ser distinguíveis.
- A ação principal deve indicar claramente quando a produção será iniciada.
- A tela não deve apresentar um contador isolado e ambíguo de documentos.

---

### Reconfiguração do pacote

- [ ] **Buscar e adicionar outros documentos antes da confirmação**

**Descrição:** O colaborador deve poder mudar os critérios de busca e incluir
documentos adicionais no pacote.

#### Regras de negócio

- A reconfiguração é permitida enquanto o pacote não estiver confirmado.
- Área e temas usados na busca podem ser alterados.
- A alteração vale somente para as novas sugestões do pacote.
- A classificação da consulta, formalização ou caso não deve ser alterada.
- Documentos já incluídos não podem ser removidos silenciosamente.
- Documentos já produzidos devem permanecer no pacote.
- Novos documentos incluídos precisam seguir produção, revisão e aprovação.
- Um documento já presente não deve ser adicionado novamente.
- A configuração original deve permanecer reconhecível no histórico do pacote.

#### Regras de UI/UX

- Depois da primeira produção, deve existir **Reconfigurar pacote**.
- A ação deve retornar aos critérios de área e temas.
- A tela deve explicar que os documentos existentes serão preservados.
- Novas sugestões devem ser claramente diferenciadas dos documentos já
  incluídos.
- A ação de produzir novos documentos deve exigir confirmação.

---

### Início da geração assistida

- [ ] **Gerar um documento com apoio de inteligência artificial**

**Descrição:** O colaborador deve poder solicitar uma primeira versão usando o
modelo e as informações disponíveis no contexto.

#### Regras de negócio

- A geração só pode começar após ação explícita.
- O documento precisa pertencer ao pacote.
- O modelo usado deve estar definido.
- Informações disponíveis podem ser usadas para preparar o conteúdo.
- A geração não representa aprovação.
- Enquanto a geração ocorre, o documento deve permanecer como **Gerando**.
- Uma solicitação repetida não deve criar duas gerações simultâneas para o mesmo
  documento.
- Ao terminar com sucesso, o documento deve passar para **Em revisão**.
- O conteúdo gerado deve indicar que depende de revisão humana.
- O documento não pode ser enviado ao cliente antes da aprovação.

#### Regras de UI/UX

- A ação deve ser **Gerar documento** ou **Gerar documentos**, conforme o
  contexto.
- O estado **Gerando** deve ser apresentado por texto.
- A interface deve impedir novas ações conflitantes durante a geração.
- O usuário deve poder continuar acompanhando os demais documentos.
- A conclusão deve levar o documento para revisão, sem aprovação automática.

---

### Informações ausentes

- [ ] **Indicar quando faltam dados para produzir o documento**

**Descrição:** Quando o documento não puder ser preparado por falta de
informações, o colaborador deve compreender o que precisa ser complementado.

#### Regras de negócio

- O documento deve passar para **Aguardando informações**.
- A pendência deve explicar quais informações são necessárias.
- O documento continua incluído no pacote.
- A pendência não deve aprovar nem descartar o documento.
- Depois do complemento, a geração pode ser solicitada novamente.
- O histórico da tentativa anterior deve ser preservado.
- Enquanto aguarda informações, o pacote não pode ser confirmado.

#### Regras de UI/UX

- O estado deve ser acompanhado de uma explicação acionável.
- A interface deve indicar onde a informação pode ser complementada.
- A nova tentativa deve ficar disponível depois da correção.
- O usuário não deve receber apenas uma mensagem genérica de falha.

---

### Falha na geração

- [ ] **Permitir recuperação quando a geração não for concluída**

**Descrição:** Uma falha não deve remover o documento nem obrigar o colaborador a
recomeçar o pacote.

#### Regras de negócio

- O documento deve passar para **Falha na geração**.
- O documento continua no pacote.
- A falha não cria uma versão aprovada.
- O colaborador deve poder tentar novamente.
- O colaborador deve poder iniciar preenchimento manual.
- Tentativas anteriores devem permanecer registradas.
- Uma nova tentativa não pode apagar versões válidas anteriores.
- Enquanto houver falha, o pacote não pode ser confirmado.

#### Regras de UI/UX

- A mensagem deve explicar o que o colaborador pode fazer.
- Devem existir ações para **Tentar novamente** e **Preencher manualmente**.
- A interface não deve tratar a falha como exclusão do documento.
- Informações internas ou incompreensíveis não devem ser apresentadas.

---

### Revisão do documento

- [ ] **Exigir análise humana antes da aprovação**

**Descrição:** Todo documento produzido deve ser revisado por um colaborador
autorizado.

#### Regras de negócio

- Documento gerado deve passar por revisão.
- Documento escrito manualmente também deve passar por revisão antes da
  aprovação, quando produzido por pessoa diferente do aprovador exigido.
- O revisor deve visualizar o conteúdo atual.
- O revisor pode aprovar.
- O revisor pode solicitar ajuste por nova geração.
- O revisor pode rejeitar a geração e seguir para preenchimento manual.
- A decisão sobre um documento não altera os demais.
- Conteúdo não aprovado não pode ser tratado como final.
- A revisão deve preservar quem tomou a decisão e quando.

#### Regras de UI/UX

- O documento em revisão deve apresentar **Aprovar**, **Ajustar** e **Rejeitar
  geração** quando aplicáveis.
- As ações devem explicar resultados diferentes.
- A aprovação deve exigir confirmação quando liberar o último requisito do
  pacote.
- A interface deve identificar qual versão está sendo revisada.
- O estado não deve depender apenas de cor.

---

### Ajuste por nova geração

- [ ] **Solicitar outra versão assistida sem iniciar redação manual**

**Descrição:** O colaborador deve poder pedir um novo conteúdo quando a versão
gerada precisa de ajustes, mas o apoio de inteligência artificial continua
adequado.

#### Regras de negócio

- **Ajustar** é diferente de rejeitar a geração.
- O colaborador deve informar o ajuste desejado.
- A versão atual deixa de ser a versão em uso, mas permanece no histórico.
- Uma nova geração deve ser iniciada.
- O documento volta para **Gerando**.
- A nova versão precisa de revisão.
- A versão anterior não pode ser enviada como aprovada.
- Ajustar não remove o documento do pacote.

#### Regras de UI/UX

- A ação deve se chamar **Ajustar**.
- A interface deve permitir descrever o que precisa mudar.
- Deve ficar claro que será criada uma nova versão.
- A ação não deve usar a mesma confirmação da rejeição.
- Depois da geração, a tela deve destacar a nova versão para revisão.

---

### Rejeição da geração

- [ ] **Rejeitar o conteúdo gerado e passar para preenchimento manual**

**Descrição:** Quando o conteúdo gerado não for adequado, o colaborador deve
conseguir abandonar aquela geração como versão atual sem excluir o documento do
pacote.

#### Regras de negócio

- A rejeição se aplica à geração, não ao documento.
- O documento continua no pacote.
- A versão rejeitada não pode ser enviada ao cliente.
- A versão rejeitada deixa de ser a versão em uso.
- Seu histórico deve ser preservado.
- O documento passa para **Preenchimento manual**.
- Rejeitar não remove a obrigatoriedade do documento.
- Rejeitar não aprova o documento.
- A decisão deve registrar quem rejeitou e quando.
- Documento já aprovado não pode ter sua geração rejeitada.

#### Regras de UI/UX

- A ação deve se chamar **Rejeitar geração**.
- A confirmação deve informar que:
  - a geração atual deixará de ser usada;
  - o documento continuará no pacote;
  - o preenchimento passará a ser manual.
- A ação final deve se chamar **Rejeitar e preencher manualmente**.
- A interface não deve usar apenas **Rejeitar documento**.
- O usuário deve compreender que ainda precisa concluir e aprovar o documento.

---

### Preenchimento manual

- [ ] **Permitir redação sem geração assistida**

**Descrição:** O colaborador deve conseguir escrever ou editar manualmente o
conteúdo do documento.

#### Regras de negócio

- Um documento pode iniciar diretamente em preenchimento manual quando permitido.
- Uma geração rejeitada deve passar para preenchimento manual.
- O trabalho manual deve poder ser salvo ao longo da elaboração.
- Cada etapa preservada deve permanecer no histórico.
- O rascunho manual atual deve ser claramente identificável.
- O preenchimento manual não significa aprovação.
- O documento precisa passar para revisão ou aprovação conforme a permissão do
  responsável.
- Enquanto estiver em preenchimento manual, o pacote não pode ser confirmado.
- Documento aprovado não pode voltar para preenchimento manual.

#### Regras de UI/UX

- O estado deve ser **Preenchimento manual**.
- A interface deve deixar claro que o documento ainda não está aprovado.
- Salvar rascunho e submeter para revisão devem ser ações distintas.
- O usuário deve visualizar quando a última alteração foi salva.
- Deve existir a ação secundária **Voltar para geração por IA**.

---

### Retorno para geração assistida

- [ ] **Retomar o apoio da inteligência artificial depois da redação manual**

**Descrição:** Um documento em preenchimento manual deve poder voltar para uma
nova geração quando o colaborador mudar de estratégia.

#### Regras de negócio

- Somente documento em preenchimento manual pode usar essa ação.
- O rascunho manual atual deixa de ser a versão em uso.
- O rascunho manual permanece no histórico.
- Uma nova geração é iniciada.
- O documento passa para **Gerando**.
- O novo conteúdo precisa de revisão.
- A ação não remove o documento do pacote.
- Documento aprovado não pode voltar para geração.
- Pacote confirmado não permite nova geração.

#### Regras de UI/UX

- A ação deve se chamar **Voltar para geração por IA**.
- A confirmação deve explicar que o rascunho manual deixará de ser a versão
  atual.
- A confirmação deve informar que o histórico será preservado.
- O usuário deve poder cancelar sem alterar o documento.
- Depois da confirmação, o estado deve mudar imediatamente para **Gerando**.

---

### Histórico das versões

- [ ] **Preservar o caminho de elaboração do documento**

**Descrição:** O colaborador deve conseguir compreender como o documento evoluiu
entre gerações e alterações manuais.

#### Regras de negócio

- Cada nova geração deve criar uma nova versão.
- Cada etapa manual preservada deve poder compor o histórico.
- Versões anteriores não devem ser sobrescritas.
- Uma versão deve ser reconhecida como a versão atual.
- O histórico deve informar se a versão foi assistida ou manual.
- O histórico deve informar quem criou a versão e quando.
- Rejeição ou substituição não deve apagar a versão anterior.
- Apenas a versão aprovada pode ser tratada como final.
- O histórico permanece disponível depois da confirmação do pacote.

#### Regras de UI/UX

- A versão atual deve ser claramente destacada.
- As versões devem aparecer em ordem compreensível.
- O usuário deve conseguir identificar origem, responsável e data.
- Versões rejeitadas ou substituídas não devem ser confundidas com a final.
- O histórico deve permanecer acessível sem dominar a revisão cotidiana.

---

### Aprovação do documento

- [ ] **Marcar um documento revisado como aprovado**

**Descrição:** Um colaborador autorizado deve confirmar que o documento está
pronto para compor o pacote final.

#### Regras de negócio

- Somente documento em revisão pode ser aprovado.
- Deve existir uma versão atual.
- A aprovação exige revisão humana.
- A aprovação deve registrar quem aprovou e quando.
- A versão atual passa a ser a versão final do documento no pacote.
- Aprovar um documento não aprova os demais.
- Documento aprovado deixa de aceitar ajuste, rejeição, escrita manual ou nova
  geração no fluxo comum.
- Um documento aprovado ainda depende da confirmação do pacote.
- Conteúdo aprovado não pode ser substituído dentro de pacote confirmado.

#### Regras de UI/UX

- A ação deve se chamar **Aprovar documento**.
- A confirmação deve explicar que o conteúdo ficará pronto para o pacote.
- Depois da aprovação, responsável e data devem ficar visíveis.
- O estado **Aprovado** deve ser apresentado por texto.
- Ações incompatíveis devem deixar de ser oferecidas.

---

### Confirmação do pacote

- [ ] **Finalizar o conjunto de documentos aprovados**

**Descrição:** O colaborador autorizado deve confirmar o pacote quando todos os
documentos estiverem prontos.

#### Regras de negócio

- O pacote deve possuir pelo menos um documento.
- Todos os documentos incluídos devem estar aprovados.
- O pacote não pode ser confirmado enquanto houver documento:
  - gerando;
  - aguardando informações;
  - em revisão;
  - em preenchimento manual;
  - com falha.
- A confirmação deve registrar quem confirmou e quando.
- O pacote só pode ser confirmado uma vez.
- A confirmação deve informar à etapa de origem que a produção foi concluída.
- Um pacote confirmado não pode receber novos documentos.
- Um pacote confirmado não pode ser reconfigurado.
- Documentos aprovados devem permanecer preservados.
- A confirmação não envia automaticamente documentos ao cliente.

#### Regras de UI/UX

- A ação principal deve ser **Confirmar pacote**.
- Enquanto houver pendências, a ação deve permanecer indisponível.
- A explicação deve ser:
  **Aprove todos os documentos para confirmar o pacote.**
- A interface deve indicar quais documentos ainda impedem a confirmação.
- Depois da confirmação, deve mostrar responsável e data.
- A ação não deve continuar disponível.

---

### Pacote confirmado

- [ ] **Preservar o pacote final sem alterações silenciosas**

**Descrição:** Depois da confirmação, o pacote deve representar de forma estável
o conjunto aprovado naquela etapa.

#### Regras de negócio

- A composição do pacote confirmado não pode ser alterada pelo fluxo comum.
- Documentos não podem ser adicionados ou removidos.
- Documentos aprovados não podem voltar para elaboração.
- Mudanças em modelos não alteram o pacote.
- Mudanças em configurações não alteram o pacote.
- Mudanças na classificação da etapa de origem não alteram o pacote.
- O pacote deve permanecer consultável.
- A etapa de origem pode avançar sem assumir a gestão interna dos documentos.
- Uma necessidade posterior de outro documento exige novo fluxo definido pela
  etapa de origem.

#### Regras de UI/UX

- O estado **Confirmado** deve permanecer visível.
- A tela deve priorizar leitura e consulta.
- Ações de produção incompatíveis não devem ser apresentadas.
- Responsável e data da confirmação devem ficar acessíveis.
- A interface deve indicar a etapa à qual o pacote pertence.

---

### Consulta e histórico de pacotes

- [ ] **Localizar pacotes e acompanhar sua situação**

**Descrição:** Colaboradores autorizados devem conseguir localizar pacotes de
consultas, formalizações e casos.

#### Regras de negócio

- Pacotes devem poder ser localizados pela etapa de origem.
- A busca deve permitir cliente, responsável, área, tema e situação.
- Pacotes em produção e confirmados devem permanecer consultáveis.
- O resultado deve apresentar a quantidade de documentos somente quando o
  significado estiver claro.
- A situação do pacote deve refletir se ainda está em revisão ou confirmado.
- O histórico deve preservar documentos e versões.
- O acesso deve respeitar as permissões da consulta, formalização ou caso.
- Pacotes não devem ser excluídos pelo fluxo comum do MVP.

#### Regras de UI/UX

- A listagem deve mostrar contexto, responsável, situação e última atualização.
- Filtros ativos devem ficar visíveis.
- A tela deve diferenciar pacote sem documentos de busca sem resultados.
- A quantidade deve ser acompanhada de um rótulo, como **Documentos incluídos**.
- Pacotes confirmados devem abrir em modo de leitura.

---

### Permissões e responsabilidade

- [ ] **Limitar cada ação às pessoas autorizadas**

**Descrição:** Cadastro, configuração, produção, revisão, aprovação e confirmação
devem respeitar as responsabilidades de cada colaborador.

#### Regras de negócio

- Administradores gerenciam modelos e configurações padrão.
- Colaboradores autorizados na etapa podem selecionar e produzir documentos.
- Somente profissionais autorizados podem revisar.
- Somente profissionais autorizados podem aprovar.
- A confirmação do pacote exige permissão para concluir a produção naquela etapa.
- A autoria de versões manuais deve ser preservada.
- Decisões sobre geração assistida devem registrar o responsável.
- Desabilitar um colaborador não apaga sua autoria anterior.
- Na dúvida sobre a permissão, a ação deve ser impedida.

#### Regras de UI/UX

- Ações indisponíveis não devem parecer executáveis.
- A interface deve explicar quando falta permissão.
- Responsáveis devem ser apresentados pelo nome profissional.
- Confirmações devem informar o efeito da ação.
- Histórico e autoria devem permanecer legíveis.

---

## 4. Regras Gerais

### 4.1 Responsabilidade humana

- Inteligência artificial apoia a redação, mas não aprova documentos.
- Todo conteúdo gerado precisa de revisão humana.
- Ajustar, rejeitar e aprovar são decisões diferentes.
- A versão final é responsabilidade de quem aprova.
- O pacote só avança depois da confirmação humana.
- Conteúdo rejeitado não pode ser enviado ao cliente.

### 4.2 Preservação do histórico

- Versões anteriores não devem ser sobrescritas.
- Trocar de geração assistida para redação manual preserva o histórico.
- Voltar da redação manual para geração assistida preserva o rascunho anterior.
- Alterações administrativas não modificam pacotes já criados.
- A confirmação preserva o conjunto final.
- Desativação não equivale a exclusão.

### 4.3 Consistência

- Área e temas devem ser compatíveis.
- Modelos indisponíveis não participam de novas configurações.
- Documentos obrigatórios não podem ser ignorados.
- Um documento não pode ser gerado duas vezes simultaneamente.
- Um documento aprovado não volta para elaboração no fluxo comum.
- Um pacote vazio não pode ser confirmado.
- Um pacote com pendências não pode ser confirmado.
- Ações repetidas não devem duplicar modelos, documentos ou pacotes.

### 4.4 Linguagem e acessibilidade

- Estados devem ser comunicados por texto e não apenas por cor.
- Campos devem possuir rótulos persistentes.
- Ações críticas devem explicar suas consequências.
- Navegação e revisão devem funcionar por teclado.
- O foco deve permanecer visível.
- Erros devem indicar um próximo passo.
- A interface deve ser profissional, sóbria e acolhedora.

---

## 5. Fluxos de Usuário

### Fluxo — Administrador cadastra um modelo

1. O administrador abre a gestão de modelos.
2. Seleciona **Novo modelo**.
3. Informa nome e descrição.
4. Seleciona área e temas.
5. Adiciona o arquivo-base.
6. Revisa as informações.
7. Seleciona **Salvar modelo**.
8. O modelo fica disponível ou aguarda ativação, conforme sua completude.

### Fluxo — Administrador configura um pacote padrão

1. O administrador abre **Configuração dos Pacotes de Documentos**.
2. Seleciona área e temas.
3. Seleciona **Adicionar documento ao pacote**.
4. Escolhe um modelo disponível.
5. Define momento de produção e obrigatoriedade.
6. Confirma em **Adicionar ao pacote**.
7. Repete para os demais documentos.
8. Organiza a ordem.
9. Seleciona **Salvar configuração**.

### Fluxo — Uma consulta cria seu pacote

1. O advogado abre o pacote da consulta.
2. Área e tema aparecem como critérios iniciais.
3. A HMS apresenta documentos obrigatórios e opcionais.
4. O advogado seleciona os opcionais aplicáveis.
5. Confirma em **Gerar documentos**.
6. Um pacote próprio da consulta é criado.
7. Mudanças administrativas futuras deixam de alterar aquele pacote.

### Fluxo — Colaborador reconfigura o pacote

1. Já existem documentos incluídos.
2. O colaborador seleciona **Reconfigurar pacote**.
3. Altera área ou temas usados na busca.
4. Recebe novas sugestões.
5. Seleciona documentos adicionais.
6. Confirma a produção.
7. Documentos anteriores permanecem no pacote.

### Fluxo — Documento é gerado e aprovado

1. O documento passa para **Gerando**.
2. A geração é concluída.
3. O documento passa para **Em revisão**.
4. O advogado revisa o conteúdo.
5. Seleciona **Aprovar documento**.
6. Confirma.
7. O documento passa para **Aprovado**.

### Fluxo — Advogado solicita ajuste

1. O documento está **Em revisão**.
2. O advogado seleciona **Ajustar**.
3. Descreve o ajuste necessário.
4. Confirma a nova geração.
5. A versão atual permanece no histórico.
6. O documento volta para **Gerando**.
7. A nova versão passa novamente por revisão.

### Fluxo — Advogado rejeita a geração

1. O documento está **Em revisão**.
2. O advogado seleciona **Rejeitar geração**.
3. A confirmação explica que o documento continuará no pacote.
4. Informa que a geração atual deixará de ser usada.
5. Informa que o preenchimento passará a ser manual.
6. O advogado confirma em **Rejeitar e preencher manualmente**.
7. O documento passa para **Preenchimento manual**.
8. A versão rejeitada permanece no histórico e não pode ser enviada.

### Fluxo — Documento manual volta para geração

1. O documento está em **Preenchimento manual**.
2. O colaborador seleciona **Voltar para geração por IA**.
3. A confirmação informa que o rascunho atual será preservado no histórico.
4. O colaborador confirma.
5. O documento passa para **Gerando**.
6. A nova versão precisa de revisão.

### Fluxo — Faltam informações

1. A produção identifica uma informação ausente.
2. O documento passa para **Aguardando informações**.
3. A interface mostra o que falta.
4. O colaborador complementa o contexto necessário.
5. Solicita nova tentativa.
6. O documento volta para **Gerando**.

### Fluxo — A geração falha

1. A produção não é concluída.
2. O documento passa para **Falha na geração**.
3. A interface oferece **Tentar novamente** e **Preencher manualmente**.
4. O colaborador escolhe o caminho.
5. O documento permanece no pacote.
6. O pacote continua impedido de ser confirmado.

### Fluxo — Colaborador confirma o pacote

1. O colaborador revisa todos os documentos.
2. Enquanto houver pendência, **Confirmar pacote** permanece indisponível.
3. O último documento é aprovado.
4. A ação é habilitada.
5. O colaborador seleciona **Confirmar pacote**.
6. A interface explica qual etapa poderá avançar.
7. O colaborador confirma.
8. O pacote passa para **Confirmado**.
9. Documentos e composição deixam de aceitar alterações comuns.

### Fluxo — Configuração administrativa é alterada

1. O administrador edita uma configuração padrão.
2. Adiciona, remove ou reorganiza modelos.
3. Salva a alteração.
4. Novos pacotes passam a usar a nova configuração.
5. Pacotes já criados permanecem iguais.
6. Pacotes confirmados permanecem preservados.

---

## 6. Critérios de Aceite do MVP

O módulo estará apto para o MVP quando:

- administradores conseguirem cadastrar modelos;
- cada modelo possuir nome, descrição, arquivo-base, área e pelo menos um tema;
- temas incompatíveis com a área forem impedidos;
- modelos puderem ser ativados e desativados sem exclusão;
- a tela de configuração for distinta do cadastro de modelos;
- uma configuração aceitar uma área e vários temas;
- temas selecionados forem pesquisáveis, removíveis e resumidos como **+N**;
- documentos puderem ser adicionados por modelo, momento e obrigatoriedade;
- configurações alteradas não modificarem pacotes existentes;
- pacotes puderem ser criados para consulta, formalização e caso;
- documentos obrigatórios forem incluídos;
- opcionais puderem ser escolhidos;
- geração depender de confirmação explícita;
- conteúdo gerado nunca for aprovado automaticamente;
- falta de informação produzir uma pendência compreensível;
- falha permitir nova tentativa ou preenchimento manual;
- **Ajustar** solicitar uma nova geração;
- **Rejeitar geração** passar o documento para preenchimento manual;
- a confirmação da rejeição explicar que o documento continua no pacote;
- documento manual puder voltar para geração assistida;
- versões anteriores permanecerem no histórico;
- todo documento precisar de revisão e aprovação;
- documentos aprovados deixarem de aceitar nova elaboração;
- pacote vazio não puder ser confirmado;
- pacote com qualquer documento pendente não puder ser confirmado;
- o pacote puder ser confirmado quando todos os documentos estiverem aprovados;
- pacotes confirmados permanecerem preservados;
- reconfigurar um pacote não remover documentos existentes silenciosamente.

---

## 7. Indicadores de Produto e Operação

- quantidade de modelos disponíveis e indisponíveis;
- quantidade de configurações por área e temas;
- frequência de uso de cada modelo;
- quantidade média de documentos por pacote;
- percentual de documentos obrigatórios e opcionais incluídos;
- tempo médio de geração;
- percentual de gerações concluídas, pendentes por informação e com falha;
- percentual de documentos aprovados na primeira revisão;
- percentual de documentos ajustados por nova geração;
- percentual de gerações rejeitadas;
- percentual de documentos que passaram para preenchimento manual;
- percentual de documentos manuais que voltaram para geração assistida;
- quantidade média de versões por documento;
- tempo médio entre primeira produção e aprovação;
- tempo médio entre criação e confirmação do pacote;
- quantidade de pacotes impedidos de confirmar por pendências;
- percentual de pacotes reconfigurados;
- frequência de uso de configurações sem alteração manual.

Os indicadores devem ser apresentados de forma agrupada sempre que não houver
necessidade de identificar cliente, caso ou colaborador.

---

## 8. Relação com Outras Áreas do Produto

### Catálogo Jurídico

- mantém áreas e temas;
- define quais assuntos estão disponíveis;
- orienta a classificação dos modelos e configurações.

### Identidade

- fornece os colaboradores;
- informa quem possui permissão administrativa ou jurídica;
- preserva o nome profissional usado na autoria.

### Consulta

- informa área e tema iniciais;
- apresenta o pacote da consulta;
- avança quando as condições definidas forem atendidas;
- não administra as versões dos documentos.

### Formalização

- solicita os documentos próprios da formalização;
- acompanha o pacote relacionado à etapa;
- avança quando o pacote exigido estiver confirmado.

### Casos

- solicita documentos durante a produção jurídica;
- relaciona o pacote ao caso;
- mantém suas próprias regras de equipe e aprovação.

### Gestão de Documentos

- recebe e classifica documentos enviados por clientes e terceiros;
- cuida de qualidade, duplicidade e acesso dos documentos recebidos;
- não define o processo de redação dos documentos produzidos pela HMS.

### Comunicação

- envia documentos somente quando houver autorização e decisão de envio;
- não envia versões rejeitadas, rascunhos ou documentos não aprovados.

---

## 9. Fora do Escopo

- cadastro e manutenção de áreas e temas;
- cadastro de clientes e colaboradores;
- documentos recebidos do cliente;
- leitura e classificação de documentos recebidos;
- controle de qualidade de anexos enviados;
- assinatura eletrônica;
- envio automático ao cliente;
- protocolo ou distribuição judicial;
- controle de prazos;
- definição da equipe de um caso;
- aprovação automática por inteligência artificial;
- geração sem ação explícita;
- exclusão definitiva do histórico;
- alteração automática de pacotes existentes;
- edição de pacote confirmado;
- retorno de documento aprovado para elaboração pelo fluxo comum;
- envio de versão rejeitada;
- colaboração simultânea no mesmo texto no MVP;
- comparação automática entre versões;
- escolha automática da melhor versão;
- múltiplos arquivos finais para o mesmo documento do pacote;
- criação de modelo dentro da janela **Adicionar documento ao pacote**.

---

## 10. Perguntas Pendentes

1. Um modelo poderá pertencer a mais de uma área jurídica ou continuará limitado
   a uma área e vários temas?
2. Deve existir somente uma configuração disponível para cada combinação exata de
   área e temas?
3. Configurações com temas parcialmente coincidentes podem coexistir? Qual delas
   terá prioridade?
4. Quem pode aprovar documentos em cada etapa: qualquer advogado autorizado, o
   responsável pela etapa ou também o supervisor?
5. A pessoa que escreveu manualmente poderá aprovar o próprio documento?
6. Um documento aprovado poderá voltar para revisão antes da confirmação do
   pacote?
7. Um pacote confirmado poderá ser reaberto em situação excepcional?
8. Um documento opcional já incluído poderá ser removido antes do início da
   produção?
9. Quando não existir configuração aplicável, o colaborador poderá montar um
   pacote inteiramente manual?
10. Consulta, formalização e caso possuirão pacotes separados ou um único pacote
    poderá acumular documentos entre as etapas?
11. A descrição do modelo será obrigatória ou opcional?
12. A alteração do arquivo-base deve preservar também as versões anteriores do
    próprio modelo para uso administrativo?

Até essas decisões serem respondidas, este PRD considera que:

- cada modelo pertence a uma área e a um ou mais temas;
- existe uma configuração disponível por combinação exata de área e temas;
- combinações parcialmente coincidentes exigem escolha explícita do colaborador;
- somente advogado autorizado ou supervisor pode aprovar;
- a aprovação pelo próprio autor depende das regras da etapa de origem;
- documento aprovado não volta para revisão no fluxo comum;
- pacote confirmado não é reaberto;
- documentos opcionais só podem ser retirados antes do início da produção;
- na ausência de configuração, o colaborador pode montar o pacote manualmente;
- cada etapa possui seu próprio pacote;
- a descrição do modelo é obrigatória;
- alterações do arquivo-base preservam o histórico administrativo.
