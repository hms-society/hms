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
- Solicita a reserva de uma consulta ao Agendamento e só cria efetivamente o
  Intake depois que a reserva é confirmada.
- Não cria Intake, identificador ou histórico quando a reserva falha; mantém os
  dados apenas no fluxo temporário de criação para correção e nova tentativa.
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

Valida a autorização de origem, recebe arquivos enviados à HMS, identifica e confirma a qual cliente pertencem e governa sua entrada na plataforma antes que sejam utilizados por consultas, casos ou outros fluxos de trabalho.

Requisito de produto: PRD — Módulo de Motor Documental.

Aplica bloqueio de entrada na borda (gatekeeping): recusa e descarta imediatamente arquivos recebidos de números de WhatsApp ou e-mails que não pertençam a um cliente cadastrado e ativo na HMS, sem armazenar arquivos no storage ou gerar lotes documentais.

Cria um lote de documentos exclusivamente para ocorrências válidas recebidas de remetentes cadastrados via WhatsApp ou e-mail (únicos canais compatíveis com o MVP).

Preserva o identificador do lote, os arquivos originais, o canal, o remetente e o horário exato de recebimento.

Mantém remetente e cliente como conceitos separados, permitindo que um contato cadastrado envie documentos de outro titular também cadastrado (ex.: familiares).

Encaminha os lotes recebidos de contatos cadastrados para a Caixa de Triagem como pendentes para confirmação humana de titularidade.

Sugere prioritariamente o cliente dono do contato de origem e utiliza correspondências determinísticas (CPF, CNPJ, dados de OCR e contatos cadastrados) para apoiar a conferência; a IA generativa não decide o cliente.

Apresenta as evidências objetivas da correspondência sem tratá-las como prova absoluta de identidade ou validade jurídica.

Exige que um colaborador autenticado e autorizado confirme toda associação de cliente; uma sugestão nunca vincula um lote automaticamente.

Permite ao colaborador confirmar o titular sugerido, pesquisar e selecionar outro cliente existente na base ou rejeitar o lote.

Não admite a existência de lotes anônimos na esteira operacional de triagem.

Vincula o lote integralmente ao cliente confirmado sem exigir que o atendente selecione consulta, caso ou item de lista de verificação no MVP.

Permite rejeitar lotes pendentes (por ilegibilidade, duplicidade ou conteúdo indevido) com motivo obrigatório registrado, sem exclusão permanente do histórico e sem notificar o remetente.

Permite somente a um administrador autorizado restaurar um lote rejeitado para o status pendente.

Registra a trilha de auditoria completa (audit trail), preservando quem realizou cada ação de triagem e o momento exato em que ocorreu.

Disponibiliza os arquivos vinculados aos fluxos de trabalho autorizados a jusante sem pressupor classificação, autenticidade, suficiência jurídica ou aprovação de lista de verificação.

Não divide nem mescla lotes no MVP.

A classificação documental, a avaliação de qualidade, a detecção de duplicatas, a classificação de acesso, a associação à lista de verificação, as dispensas, a aceitação provisória e o envio posterior continuam sendo responsabilidades futuras deste módulo, mas não fazem parte do MVP atual.

---

## Produção Documental

Produz pacotes de documentos reutilizáveis para consultas, formalizações e casos.

Requisito de produto: [PRD — Módulo de Produção Documental](https://plataformahms.atlassian.net/wiki/x/AQAQ).

- É responsável pelos modelos de origem usados para produzir documentos.
- Permite selecionar modelos e acrescentar documentos ao conjunto associado a
  uma consulta, formalização ou caso; modelos criados depois não alteram
  conjuntos existentes automaticamente.
- Mantém o pacote como agrupamento opcional, sem estado próprio de confirmação;
  a consulta, formalização ou caso decide quando sua etapa pode avançar.
- Preserva versões geradas por IA e versões decorrentes de edição manual como
  registros imutáveis.
- Permite várias versões aprovadas, mantendo no máximo uma versão vigente por
  documento; aprovar ou rejeitar uma versão não apaga as anteriores.
- Trata geração, revisão, aprovação, rejeição e falha como estados das versões e
  execuções, não do item que associa o documento ao pacote.
- Publica eventos de produção para que o módulo responsável acompanhe o resultado
  sem assumir a propriedade dos documentos e de suas versões.

---

## Comunicação

Governa todas as interações registradas com pessoas e as notificações internas.

- Centraliza atendimentos humanos por WhatsApp e e-mail, agrupando as conversas
  dos dois canais em um único atendimento ativo por cliente.
- Registra mensagens recebidas, manuais e automáticas, seus anexos, autoria e
  estados de entrega.
- Envia mensagens automáticas após eventos autorizados e permite respostas
  humanas pelo canal da conversa.
- Recebe documentos enviados pelo WhatsApp ou e-mail e publica eventos para o
  Motor Documental.
- Envia notificações internas aos membros da equipe (novo documento recebido,
  prazo se aproximando, tarefa atribuída).
- Impõe as regras de consentimento: nenhuma mensagem é enviada sem o consentimento
  ativo da pessoa para aquele canal.

---

## Identidade

Sabe quem são todas as pessoas, como elas acessam o sistema e quais autorizações
possuem globalmente.

Requisito de produto: [PRD — Módulo de Identidade](https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2228232).

- Mantém um cadastro único de pessoas, com detecção de duplicatas por identificador
  fiscal.
- Vincula pessoas a usuários do sistema por meio do Supabase Auth.
- Atribui um dos cinco perfis fixos que determinam a autorização em todo o sistema:
  Administrador, Atendente, Advogado, Paralegal ou Supervisor.
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

## Formalização

Coordena os documentos contratuais, os signatários, as solicitações de assinatura
e a transição entre o Intake viável e a abertura do Caso.

Requisito de produto: [PRD — Módulo de Formalização](https://plataformahms.atlassian.net/wiki/x/AQBvAQ).

- Mantém uma única Formalização por Intake e exatamente um cliente no MVP.
- Controla os estados agregados `Em andamento`, `Concluída` e `Cancelada`; os
  estados terminais permanecem somente leitura.
- Referencia as versões vigentes e aprovadas mantidas pela Produção Documental e
  confirma o conjunto de documentos antes da etapa de assinatura.
- Mantém o cliente como primeiro signatário e adiciona o advogado responsável por
  padrão, sem selecionar documentos automaticamente para qualquer signatário.
- Permite adicionar e remover signatários colaboradores ativos com perfil
  Advogado, Paralegal ou Supervisor, usando nome, CPF e contatos de Identidade.
- Exige CPF e pelo menos um canal disponível entre e-mail e WhatsApp, sem exigir
  ambos e sem manter papel na assinatura ou comprovação de representação.
- Relaciona signatários aos documentos e mantém a posição dos campos de assinatura
  em um modelo interno independente do provedor.
- Congela o conteúdo-fonte no envio, gera e preserva o PDF original e solicita a
  assinatura eletrônica por uma porta substituível, inicialmente integrada ao
  Documenso e sem ICP-Brasil no MVP.
- Solicita à Comunicação o envio dos links por e-mail ou WhatsApp, respeitando o
  consentimento específico de cada canal e sem fallback automático.
- Acompanha o progresso por documento; um documento só é considerado assinado
  quando todos os seus signatários concluíram.
- Permite reenvio individual a signatários pendentes e cancelamento de todas as
  solicitações abertas antes de liberar novamente a edição dos documentos.
- Preserva PDFs assinados, evidências e registros de envio, reenvio e cancelamento
  sem depender do armazenamento permanente do provedor.
- Habilita a confirmação da contratação somente depois que todos os documentos
  estão assinados e solicita a abertura idempotente do Caso.
- Muda para `Concluída` e sinaliza o Intake como `Contratado` somente depois da
  abertura bem-sucedida do Caso; em caso de falha, permanece `Em andamento` e
  permite nova tentativa sem duplicar o Caso.
- Muda para `Cancelada` quando o Intake é encerrado sem contratação, cancela as
  solicitações ainda abertas e preserva todo o histórico produzido.

A Formalização não edita o conteúdo dos documentos, não mantém o cadastro oficial
de pessoas ou consentimentos, não envia mensagens diretamente pelos canais, não
define a equipe do Caso e não administra o andamento jurídico após a contratação.

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
