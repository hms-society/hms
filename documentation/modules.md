# Responsabilidades dos Módulos

Cada módulo é responsável por um conjunto claro de atribuições. Nenhum módulo
invade o escopo de outro. Eles se comunicam por meio de eventos e referências
compartilhadas.

---

## Intake

Organiza o ciclo de entrada de uma nova demanda no escritório, desde o primeiro
contato até a contratação ou o encerramento sem contratação.

Requisito de produto: [PRD — Módulo de Intake](https://plataformahms.atlassian.net/wiki/x/AYAY).

- Registra a demanda, o canal de contato, a origem, o responsável operacional e
  o cliente relacionado.
- Mantém o estado, a linha do tempo e o histórico de cada Intake.
- Coordena a abertura do Intake com a reserva de uma consulta no Agendamento.
- Reflete a realização da consulta e registra a decisão de viabilidade.
- Controla a passagem para formalização e reflete a contratação como desfecho
  terminal.
- Permite e registra o encerramento sem contratação durante a jornada ativa.
- Disponibiliza o histórico de Intakes por cliente.
- Publica eventos relevantes para os demais módulos sem alterar seus dados
  internos.

O Intake não mantém o cadastro do cliente, a disponibilidade da agenda, o
conteúdo da consulta, os documentos de formalização, as informações financeiras
ou o andamento jurídico posterior à contratação.

---

## Catálogo Jurídico

Centraliza a classificação jurídica usada em toda a HMS, mantendo as áreas
jurídicas e os temas pertencentes a cada área.

Requisito de produto: [PRD — Módulo de Catálogo Jurídico](https://plataformahms.atlassian.net/wiki/x/AQAT).

- Cadastra, edita, disponibiliza e indisponibiliza áreas jurídicas e temas.
- Garante que cada tema pertença a uma única área.
- Impede nomes duplicados, desconsiderando diferenças de maiúsculas, minúsculas
  e espaços periféricos.
- Oferece áreas e temas para colaboradores, consultas, templates e configurações
  de pacotes.
- Permite pesquisa e filtros do catálogo.
- Preserva áreas e temas usados anteriormente, mesmo quando ficam indisponíveis
  para novas associações.
- Registra alterações administrativas.

O Catálogo Jurídico fornece a classificação comum, mas não cadastra colaboradores,
classifica consultas, mantém templates, configura pacotes nem produz documentos.

---

## Motor Documental

Recebe arquivos enviados ao HMS, identifica a qual cliente pertencem e governa
sua entrada na plataforma antes que sejam usados por consultas, casos ou outros
fluxos de trabalho.

Requisito de produto: [PRD — Módulo de Motor Documental](https://plataformahms.atlassian.net/wiki/x/FoAT).

- Cria um lote de documentos para cada ocorrência válida recebida pelo WhatsApp
  ou e-mail, os únicos canais compatíveis com o MVP.
- Preserva o identificador do lote, os arquivos originais, o canal, o remetente e
  o horário de recebimento.
- Mantém remetente e cliente como conceitos separados, pois a pessoa que envia
  os arquivos pode não ser o cliente a quem pertencem.
- Encaminha todo lote sem cliente confirmado para a caixa de triagem de lotes
  órfãos como pendente.
- Usa correspondências determinísticas de identificadores fiscais, contatos e
  nomes para sugerir no máximo um cliente quando as evidências forem seguras e
  inequívocas; a IA generativa não decide o cliente.
- Apresenta as evidências objetivas por trás de uma sugestão de cliente sem
  tratá-las como prova de identidade ou validade documental.
- Exige que um colaborador autenticado e autorizado confirme toda associação de
  cliente; uma sugestão nunca vincula um lote automaticamente.
- Permite que o colaborador rejeite a sugestão, pesquise manualmente entre os
  clientes existentes ou registre que não foi possível identificar o cliente.
- Mantém um lote não identificado como pendente para que seja revisado depois que
  o cliente for cadastrado ou novas informações estiverem disponíveis.
- Vincula todo o lote a um cliente no MVP sem exigir que o atendente selecione uma
  consulta, um caso ou um item da lista de verificação.
- Permite rejeitar lotes pendentes por um motivo registrado, sem excluir
  permanentemente seus arquivos ou notificar automaticamente o remetente.
- Permite somente a um administrador autorizado restaurar um lote rejeitado para
  o status pendente.
- Preserva quem realizou cada decisão de triagem e quando ela ocorreu.
- Disponibiliza os arquivos vinculados aos fluxos de trabalho autorizados a
  jusante sem pressupor classificação, autenticidade, suficiência jurídica ou
  aprovação da lista de verificação.
- Não divide nem mescla lotes no MVP.

A classificação documental, a avaliação de qualidade, a detecção de duplicatas, a
classificação de acesso, a associação à lista de verificação, as dispensas, a
aceitação provisória e o envio posterior continuam sendo responsabilidades futuras
deste módulo, mas não fazem parte do MVP atual.

---

## Produção Documental

Produz pacotes de documentos reutilizáveis para consultas, formalizações e casos.

Requisito de produto: [PRD — Módulo de Produção Documental](https://plataformahms.atlassian.net/wiki/x/AQAQ).

- É responsável pelos modelos de origem usados para produzir documentos.
- Configura pacotes de documentos padrão para uma área jurídica e um ou mais
  temas jurídicos, incluindo a ordem de cada modelo, o momento da geração e o
  status de obrigatoriedade.
- Instancia pacotes a partir da configuração atual, de modo que alterações
  posteriores na configuração não afetem pacotes já criados.
- Preserva versões manuais e geradas por IA imutáveis, mantendo uma única versão
  ativa.
- Acompanha documentos gerados por IA ou redigidos manualmente durante a revisão
  e aprovação.
- Permite que um documento em redação manual retorne à geração por IA sem excluir
  seu histórico de produção anterior.
- Mantém imutáveis os documentos aprovados dentro do pacote confirmado.
- Confirma um pacote somente quando ele contém pelo menos um documento e todos os
  documentos incluídos foram aprovados.
- Publica eventos de produção para que a consulta, a formalização ou o caso
  responsável possa avançar em seu fluxo sem assumir a propriedade do estado dos
  documentos.

---

## Comunicação

Governa todas as interações registradas com pessoas e as notificações internas.

- Registra toda comunicação (recebida e enviada) em um log central vinculado a
  uma pessoa, triagem ou caso.
- Envia mensagens automáticas pelo WhatsApp após eventos autorizados, sem manter
  atendimento humano integrado ao canal.
- Recebe documentos enviados pelo WhatsApp e publica eventos para o Motor
  Documental.
- Mantém o atendimento humano centralizado no e-mail.
- Envia notificações internas aos membros da equipe (novo documento recebido,
  prazo se aproximando, tarefa atribuída).
- Impõe as regras de consentimento: nenhuma mensagem é enviada sem o consentimento
  ativo da pessoa para aquele canal.

---

## Identidade

Sabe quem são todas as pessoas, como elas acessam o sistema e quais autorizações
possuem globalmente.

Requisito de produto: [PRD — Módulo de Identidade](https://plataformahms.atlassian.net/wiki/x/BIAC).

- Mantém um cadastro único de pessoas, com detecção de duplicatas por identificador
  fiscal.
- Vincula pessoas a usuários do sistema por meio do Supabase Auth.
- Atribui um dos nove perfis fixos que determinam a autorização em todo o sistema.
- Associa cada colaborador jurídico a uma ou mais áreas jurídicas, com um ou mais
  temas pertencentes a cada área selecionada.
- Registra concessões e revogações de consentimento da LGPD em um log imutável e
  somente de acréscimos.
- Não gerencia papéis no nível do caso, acesso externo pelo Portal nem o ciclo de
  vida de consultas e casos.

---

## Agendamento

É responsável pela disponibilidade dos colaboradores e pelas reservas de
compromissos.

Requisito de produto: [PRD — Módulo de Agendamento](https://plataformahms.atlassian.net/wiki/x/AYAT).

- Configura a duração padrão dos compromissos na agenda de cada colaborador.
- Registra a disponibilidade semanal como intervalos de horário local agrupados
  por dia da semana.
- Registra períodos bloqueados inclusivos, com datas sem horário, para férias,
  audiências e outras indisponibilidades de dia inteiro.
- Calcula horários disponíveis a partir da disponibilidade semanal, dos períodos
  bloqueados e dos compromissos existentes.
- Reserva, cancela e remarca compromissos para clientes.
- Não é responsável pelo conteúdo ou resultado jurídico de uma consulta. A
  Consulta mantém apenas uma referência ao compromisso de agendamento.

---

## Consulta

É responsável pela consulta jurídica realizada a partir de um compromisso
agendado.

Requisito de produto: [PRD — Módulo de Consulta](https://plataformahms.atlassian.net/wiki/x/A4AH).

- Cria uma consulta para um cliente e um advogado designado a partir da referência
  de um compromisso do módulo de Agendamento.
- Registra modalidade, canal, ocorrência, ausência, resumo e documentos solicitados.
- Não calcula disponibilidade nem reserva horário na agenda de um colaborador.

---

## O que não é um módulo

**Analytics** não é um módulo. É uma camada de modelo de leitura que se inscreve
nos eventos de todos os módulos e mantém projeções pré-calculadas para os 12
indicadores do MVP. Não possui lógica de domínio, regras nem vocabulário próprios.
Pode ter um banco de dados próprio por motivos de desempenho, mas isso é uma
escolha de infraestrutura, não uma fronteira de domínio.

**Infraestrutura** não é um módulo. Barramento de eventos, armazenamento de modelos
de leitura, integração com IA/OCR, armazenamento de logs imutáveis, temporizadores
de SLA e utilitários de aprovação dupla são mecanismos técnicos compartilhados.
Eles ficam abaixo dos módulos, não ao lado deles.

**Governança de IA** não é um módulo. Cada módulo que usa IA é responsável por suas
próprias sugestões, regras de validação, limiares de confiança e políticas de
bloqueio. A regra de que uma pessoa deve validar antes que a IA produza efeitos é
uma invariante dentro de cada módulo, não uma política central.

**Plataforma/Configuração** não é um módulo. Cada catálogo (modelos de listas de
verificação, modelos de peças, catálogos de papéis, tipos de consentimento, regras
de SLA e parâmetros do sistema) vive dentro do módulo que o consome. A configuração
acompanha sua instância.
