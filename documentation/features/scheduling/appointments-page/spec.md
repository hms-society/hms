---
title: Agenda de Consultas
status: completed
revision: 13
source:
  type: jira-ticket
  ref: https://plataformahms.atlassian.net/browse/SCRUM-146
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento
jira_tickets:
  - SCRUM-146
scope:
  - packages/core
  - packages/validation
  - apps/server
  - apps/web
last_updated_at: 2026-09-29
---

# 1. Context and scope

**Objetivo.** Entregar uma Agenda de Consultas semanal e mensal, com leitura segura de compromissos e bloqueios, filtros, detalhes, cancelamento e remarcação de horários elegíveis, incluindo troca do advogado responsável durante a remarcação. Fonte de entrega: [SCRUM-146](https://plataformahms.atlassian.net/browse/SCRUM-146), complementada pelas decisões explícitas do usuário e pelo [PRD canônico de Agendamento](https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento) v12. Modo **complete**: Core, servidor, validação, web, histórico persistido, controle de acesso, concorrência e seis referências visuais.

Hoje `/agenda` configura disponibilidade; não há calendário de consultas nem consulta por período no repositório. O backend de Agendamento expõe configuração sem guardas nas rotas legadas, o serviço web não lista compromissos, e os métodos antigos de cancelamento/remarcação da Consulta não possuem operação REST funcional. A nova página usa `/agenda/consultas`; `/agenda` continua sendo a configuração de disponibilidade.

| Área | In scope | Out of scope |
| --- | --- | --- |
| Calendário | Semanal/mensal, navegação, Hoje, fuso, agendados/cancelados, bloqueios de dia inteiro, overflow e estados | Visão diária, criar reserva, editar disponibilidade/bloqueios |
| Consulta | Estado de comparecimento em leitura, indicador de início, link à Consulta existente quando autorizada | Marcar não comparecimento, iniciar/concluir Consulta, conteúdo jurídico |
| Alterações | Cancelar e remarcar para horário disponível do advogado selecionado; troca de agenda, sincronização da Consulta existente, histórico e liberação/ocupação atômicas | Criar novo Intake/consulta, cancelar Consulta jurídica ou Intake |
| Dados e acesso | Perfis e escopo definidos abaixo; filtros cliente/advogado/tipo ou situação | Busca global de clientes, revelação de dados completos no calendário |
| Comunicação | Publicar fatos internos duráveis de cancelamento/remarcação | Novo envio externo ao cliente ou template de canal nesta entrega |

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| Agendamento REQ-015 e SCRUM-146 calendário/filtros/estados | full | PRD v12 aprovado: calendário semanal/mensal; Admin não recebe cards de bloqueio, que continuam efetivos na agenda do advogado; REQ-018 permite advogado ativo e slot disponível na remarcação. |
| Agendamento REQ-016 detalhe e Consulta REQ-001 | full | Abrir Consulta apenas quando ela existir e o ator puder acessá-la; não cria uma. |
| Agendamento REQ-017–019 | full | Usuário ampliou SCRUM-146 para cancelar/remarcar e aprovou a troca de advogado no mesmo agendamento, sincronizando a Consulta preparada (PRD v12). |
| Agendamento REQ-020 | partial | Histórico de marcação/cancelamento/remarcação coberto; auditoria de configuração e bloqueios pertence às histórias próprias. |
| Consulta REQ-007–009 | partial | A agenda lê estados e bloqueia escrita após início/finalização; transições da Consulta ficam no módulo de Consulta. |

Decisões de produto: Administrador, Atendente, Supervisor e Paralegal leem todas as agendas; Advogado lê somente a própria; cliente e estagiário não acessam. No calendário do Administrador, eventos de bloqueio são omitidos; continuam vinculados à agenda do advogado e impedem horários nela. **Somente Administrador e Atendente** cancelam/remarcam em qualquer agenda. Na remarcação, esses perfis podem escolher outro advogado ativo; o novo intervalo deve estar disponível para a duração integral na agenda escolhida, e a Consulta preparada acompanha a alteração na mesma transação, preservando appointmentId e cliente. Filtrar por cliente remove bloqueios sem cliente. “Hoje” usa `America/Sao_Paulo` para todos os perfis; a semana vai de domingo a sábado, conforme o cabeçalho mensal do desenho. Um evento continua usando o fuso da própria agenda. A visualização móvel em 390 × 844 é lista agrupada por dia; os demais estados sem quadro Pencil usam componentes HMS. Essas premissas visuais foram aceitas pelo usuário. A inclusão das ações de escrita supera expressamente o “fora de escopo” do ticket; o Jira permanece sem alteração.

# 2. Implementation Contract

| ID | PRD/Jira/source coverage | Required behavior |
| --- | --- | --- |
| RF-01 | Agendamento REQ-015; SCRUM-146 escopo/aceite; decisão do usuário | Exibir semana domingo–sábado ou mês civil real; “Hoje” usa a data de `America/Sao_Paulo` sem perder filtros; projetar cada evento no dia local de sua agenda, inclusive quando agendas têm fusos diferentes; eventos legíveis por texto, incluindo horário inicial/final e fuso, situação, bloqueio distinto nos perfis que podem vê-lo e acesso aos itens excedentes do dia. O calendário do Administrador omite cards de bloqueio. |
| RF-02 | SCRUM-146 filtros/aceite; Agendamento REQ-015 privacidade | Combinar filtros de um cliente, um advogado e tipo/situação; permitir limpar cada um ou todos; encontrar advogado inativo com histórico; ocultar bloqueios sob filtro de cliente. |
| RF-03 | Agendamento REQ-015/016/020; decisão do usuário sobre acesso | Autorizar leitura no servidor: quatro perfis veem todas as agendas e Advogado somente a própria, inclusive detalhes, histórico e resultados de filtro. Para Administrador, omitir eventos de bloqueio sem alterar disponibilidade; Advogado vê bloqueios da própria agenda. Exibir apenas dados pessoais necessários e mascarados. |
| RF-04 | Agendamento REQ-016/019; Consulta REQ-001/002; contrato de documentos da Consulta | Abrir detalhes com cliente, advogado, data, início, fim, duração, estado e indicação de início da Consulta; oferecer link à Consulta existente apenas a Administrador ou ao advogado responsável. O endpoint de Consulta também aplica essa autorização por ID/Intake, independentemente do link. |
| RF-05 | Agendamento REQ-017/019/020; decisão do usuário sobre escrita | Administrador/Atendente podem confirmar cancelamento de horário agendado e ainda não iniciado/finalizado; preservar compromisso/Intake/cliente/histórico, registrar ator e instante, liberar o horário e impedir iniciar a Consulta cancelada. |
| RF-06 | Agendamento REQ-018/019/020; decisão explícita do usuário em 2026-09-28 | Administrador/Atendente podem selecionar o mesmo ou outro advogado ativo e confirmar remarcação para horário futuro disponível na agenda selecionada, com duração integral, sem bloqueio ou conflito; manter appointmentId, cliente e a mesma Consulta preparada, atualizar o advogado da Consulta na mesma transação, registrar agenda/horário anterior e novo, ator/instante e atualizar o resumo imediatamente. |
| RF-07 | Agendamento REQ-017–020; confiabilidade operacional | Revalidar elegibilidade e disponibilidade no servidor no commit; conflito, pedido obsoleto, repetição ou falha não criam dupla ocupação nem alteração parcial; mudanças aceitas geram fatos internos duráveis sem duplicação. |
| RF-08 | Agendamento REQ-015–018; SCRUM-146 estados/validação; premissas visuais aceitas | Diferenciar carregamento, agenda vazia, zero por filtro, erro, acesso restrito, sucesso e conflito; operar por teclado e em 390 × 844, com foco visível e sem depender de cor. |

| ID | RF coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CA-01 | RF-01, RF-02 | Navegação e filtros persistentes | Usuário autorizado e filtros ativos, inclusive navegador em outro fuso | Alterna semana/mês, anterior/próximo e Hoje | Semana domingo–sábado, mês civil e “Hoje” de `America/Sao_Paulo`; filtros mantidos em URL, sem depender do fuso do navegador | Core, route widget, MV-01 |
| CA-02 | RF-01, RF-03 | Eventos e bloqueios | Compromissos agendados/cancelados, no-show e bloqueio final inclusivo | Admin ou Advogado carrega período | Admin recebe compromissos sem cards de bloqueio; Advogado vê apenas os bloqueios da própria agenda, sem alterar o efeito deles sobre disponibilidade | Core, REST, MV-01 |
| CA-03 | RF-01, RF-02 | Filtros, histórico e overflow | Histórico de advogado inativo e dia denso | Combina/limpa filtros ou abre `+N` | Resultados corretos; bloqueio some com cliente; todos os itens de dia cheio acessíveis | Core, REST, widget, MV-01 |
| CA-04 | RF-03, RF-04 | Detalhe e Consulta | Compromisso visível com/sem Consulta e ator Admin/advogado responsável/outro leitor da agenda | Abre card ou URL de Consulta diretamente | Modal mostra dados mínimos e início; link só para Admin ou advogado responsável com Consulta existente; GET por ID/Intake retorna 404 sem conteúdo para os demais; abrir não altera estado nem cria reserva | REST, widget, MV-02 |
| CA-05 | RF-05, RF-07 | Cancelamento | Admin/Atendente, compromisso agendado, Consulta não iniciada | Confirma ação | Estado cancelado, horário livre, ator/instante no histórico, Consulta não iniciável; repetição sem duplicata | Core, PostgreSQL/REST, MV-03 |
| CA-06 | RF-06, RF-07 | Remarcação com advogado selecionável | Admin/Atendente, compromisso elegível, advogado ativo e slot futuro livre | Mantém ou troca advogado, seleciona data/slot e confirma | Mesmo appointmentId, cliente e Consulta; nova agenda/intervalo ocupados, antigo liberado, advogado da Consulta sincronizado e histórico registra antes/depois de agenda/horário | Core, PostgreSQL/REST, MV-03 |
| CA-07 | RF-05–07 | Rejeições/concorrência | Slot ocupado/bloqueado/passado, versão obsoleta, Consulta iniciada/final ou dois pedidos concorrentes | Envia alteração | 409/422/403 apropriado, nenhum estado parcial nem evento duplicado; formulário preserva seleção e oferece recarregar | Core, PostgreSQL/REST, MV-03 |
| CA-08 | RF-03, RF-08 | Permissões, estados e acessibilidade | Perfis de leitura/escrita e viewport 390 × 844 | Navega, filtra e opera por teclado | Advogado vê só própria; Supervisor/Paralegal sem escrita; cliente/estagiário 403; estados distintos, foco recuperado, sem overflow horizontal | REST, route/widget, MV-04 |
| CA-09 | RF-02, RF-03, RF-08 | Erro e minimização | Resposta lenta/falha, cliente não permitido, sessão expirada | Consulta calendário/detalhe/filtro | Loading/erro/reauth/retry adequados; 4xx/5xx não expõem cliente/agenda ou stack; URL forjada não amplia acesso | REST, route/widget, MV-04 |

| Concern | Contract |
| --- | --- |
| Período | A API recebe `view=week|month` e `date=YYYY-MM-DD`, não aceita `[from,to)` arbitrário. A semana contém as 7 datas civis de domingo a sábado que incluem `date`; a grade mensal começa no domingo anterior ou igual ao primeiro dia do mês e termina no sábado posterior ou igual ao último dia, até 42 datas. Para cada agenda autorizada, o servidor converte os limites locais de seu fuso IANA em `[from,to)` UTC; a consulta pode usar a união UTC dessas janelas, mas filtra novamente cada evento pela data local da agenda. Assim agendas em fusos diferentes não perdem eventos nas bordas. |
| Estado | Agendamento possui `scheduled/cancelled`; `no_show`, `completed` e `startedAt` são projeção de Consulta, nunca status persistido de Agendamento. Cancelado mantém o estado próprio mesmo se Consulta pendente. |
| Dados | Cards exibem nome e somente identificação mascarada quando necessária; detalhes e filtros não serializam CPF/CNPJ, email, telefone ou conteúdo jurídico completo sem permissão específica. |
| URL | `view=week\|month`, `date=YYYY-MM-DD`, `clientId`, `lawyerId`, `event=all\|scheduled\|cancelled\|no_show\|blocked`; parâmetros inválidos normalizados ou rejeitados antes da consulta. O filtro `blocked` não inclui compromissos. |
| Temporal | Na entrada inicial e a cada acionamento de “Hoje”, o instante atual é convertido à data civil de `America/Sao_Paulo` para `date` da URL e para destacar o dia atual; não se reutiliza uma data calculada antes da virada do dia. A grade usa datas civis gregorianas, independentes do timezone do navegador; cada evento ocupa a coluna correspondente à sua data local na agenda, com horário e fuso identificados no card/detalhe. Instantes persistidos/REST são UTC ISO 8601. Bloqueios são datas locais inteiras, incluindo o último dia, e entram apenas nos dias civis da grade. Instantes na borda são testados com agendas de fusos diferentes e transição de horário de verão. |
| Elegibilidade | Ocultar escrita para perfis sem permissão; backend revalida em cada pedido. Consulta iniciada (`startedAt`), concluída ou no-show impede ambas as alterações. Falha de leitura da Consulta bloqueia escrita. |
| Consulta completa | O calendário mínimo continua visível aos cinco perfis de leitura. A ficha jurídica completa de Consulta, seus links e os GET por ID/Intake pertencem a Consulta: Administrador vê qualquer uma; Advogado apenas quando `assignedLawyerId === actor.collaboratorId`; Atendente, Supervisor, Paralegal, Cliente e Estagiário não recebem a ficha completa nesta entrega. Objeto fora do escopo e inexistente retornam 404 indistinguível. Esta matriz segue o contrato de documentos da Consulta já aprovado, sem ampliar a permissão de leitura do calendário para conteúdo jurídico. |

## Design Contract

[Manifesto e seis capturas Pencil](design/manifest.md) vinculam semanal (1417 × 900), mensal (1200 × 900), detalhes (621 × 655), filtro cliente (621 × 605), remarcação (600 × 834) e confirmação de cancelamento (513 × 365) aos estados e critérios. Validar também 390 × 844. A lista móvel por dia, faixa de bloqueio e estados loading/vazio/erro/restrito seguem as premissas aceitas no manifesto. O seletor de advogado ativo, resumo do profissional/horário atuais e novos, cartão atual, slots e demais elementos do quadro `yVAoI` fazem parte do contrato; seleção de advogado/data invalida o slot anterior e carrega slots da agenda escolhida. A mensagem “Pessoa ainda não é cliente” nos detalhes continua excluída porque REQ-001 da Consulta exige cliente cadastrado. Datas fictícias do desenho não definem cálculos. Todos os controles visíveis dependem de permissão/estado, acessíveis por teclado, com foco restaurado após fechar modal e indicação textual além de cor.

# 3. Technical Contract

## Current technical state

| Evidence | Current responsibility | Gap |
| --- | --- | --- |
| `packages/core/src/scheduling/domain/entities/appointment.ts`, `packages/core/src/scheduling/interfaces/scheduling-database.ts` | Reserva por Intake sob `SchedulingDatabase.run` e busca de sobreposição com agenda bloqueada | Não há leitura por período/ID, cancelamento, remarcação ou histórico. |
| `apps/server/src/scheduling/database/drizzle/models/appointment-model.ts`, `apps/server/src/shared/database/drizzle/schema/scheduling.ts` | `appointments`, agendas e bloqueios | `schedules` não persiste `timeZone` (mapper usa `America/Sao_Paulo`), bloqueios são `timestamp` de dia inteiro; não existe histórico de remarcação/ator. |
| `apps/server/src/scheduling/database/drizzle/repositories/scheduling.module.ts` e `.../rest/controllers/index.ts` | Composição e controller de disponibilidade | Estão indevidamente dentro de `database/drizzle/repositories`; endpoints existentes não exigem auth. |
| `apps/server/src/consultation/database/drizzle/models/consultation-model.ts`, `.../rest/controllers/get-consultation.controller.ts` | `appointmentId`, `startedAt`, `status`; GET completo só exige colaborador ativo | `pending/completed/no_show` são persistidos; `in_progress` do PRD Consulta v12 ainda não possui fluxo. Criar/fechar ficha/concluir não checam cancelamento da marcação; GET por ID/Intake não verifica advogado responsável/Administrador. |
| `apps/web/src/routes/agenda/index.tsx`, `apps/web/src/rest/services/scheduling-service.ts` | Configuração de disponibilidade e serviço Axios | Não há página/serviço de calendário. Métodos antigos de cancelar/remarcar em `consultation-service.ts` não têm endpoint correspondente; não reutilizá-los. |

## Solution and runtime flow

`GET /scheduling/calendar` recebe visão/data civil/filtros validados e ator autenticado. `ListCalendarUseCase` restringe a agenda do Advogado antes de consultar, carrega agendamentos, carrega bloqueios somente para perfis que podem exibi-los, enriquece por projeções de leitura de Identidade e Consulta e devolve somente campos necessários. Para Administrador, a resposta não contém `CalendarBlock`, inclusive quando `event=blocked`; os bloqueios permanecem no repositório e continuam sendo considerados ao listar/confirmar horários disponíveis. O filtro de tipo `Bloqueios` não aparece na toolbar do Administrador. Detalhe usa a mesma política, busca por ID e histórico; o link à ficha completa só aparece para Administrador ou advogado responsável. `GetConsultationUseCase` e `GetConsultationByIntakeUseCase` recebem o ator do token e aplicam a mesma matriz antes de carregar cliente/Intake/conteúdo jurídico, retornando 404 indistinguível para objeto alheio ou inexistente. Filtros nunca são barreira de autorização; IDs forjados e datas/visões inválidas são recusados; a grade mensal nunca excede 42 dias civis.

`PATCH /scheduling/appointments/:appointmentId/cancel` e `.../reschedule` recebem ator, revisão esperada (`updatedAt` ISO) e, na remarcação, novo início ISO e `lawyerId` opcional (ausente significa advogado atual). Cada caso de uso chama `SchedulingDatabase.run(scope => ...)` e decide elegibilidade, revisão, advogado ativo, agenda de destino, disponibilidade, alteração e histórico/outbox dentro do callback. O adapter Drizzle fornece repositórios vinculados à mesma transação PostgreSQL serializável, reutiliza transação ativa e retenta uma vez em `40001`/`40P01`. A remarcação resolve as agendas de origem e destino, bloqueia ambas em ordem ascendente de ID para evitar deadlock, relê a marcação/revisão e a Consulta pendente sob o mesmo executor, então valida duração integral, fuso, bloqueio e conflito na agenda de destino. O commit atualiza `appointments.schedule_id` e intervalo, `consultations.assigned_lawyer_id`, histórico com os dois schedule IDs e outbox. Provider de Consulta permanece no módulo dono e usa o executor ativo; falha de leitura/escrita aborta tudo. Nunca publica externamente dentro da transação. Repetição da mesma intenção/revisão não duplica; outra intenção ou revisão obsoleta retorna 409. O `appointmentId` e cliente da Consulta não mudam.

Nas transições de Consulta, o caso de uso chama o port compartilhado `AppointmentWriteTransactionProvider.runWithLockedAppointment(appointmentId, callback)` implementado por Agendamento. O adapter obtém a agenda por ID de marcação, bloqueia agenda e depois marcação, nessa ordem, e executa o callback no executor transacional ativo. O callback recebe `undefined` se a marcação não existe, ou um snapshot `{ appointmentId, status }`; **o caso de uso de Consulta** decide se `status === 'scheduled'`, relê a Consulta e grava pelo repositório de Consulta aderido ao mesmo executor. O adapter não decide elegibilidade. Ausência/cancelamento rejeita antes do write; conflito serializável é retentado pelo mesmo dono da transação. `SchedulingDatabaseModule` exporta o token desse port sem importar `ConsultationModule`; `ConsultationModule` importa `SchedulingDatabaseModule`, eliminando ciclo de módulos.

Conclusão e finalização de ficha que muda o contexto jurídico gravam, no mesmo callback transacional da Consulta, uma linha de outbox própria (`consultation_outbox_events`) para `ConsultationCompletedEvent` ou `ConsultationLegalContextUpdatedEvent`. O caso de uso decide se há evento; o repositório apenas persiste o envelope serializável com ID estável. `PublishConsultationEventJob` lê pendências depois do commit, envia com `event.id = outbox.id` e só marca `publishedAt` após aceitação do broker. Falha de envio preserva a pendência e não converte uma Consulta já confirmada em erro de escrita; o cron retenta. Os consumidores de Intake já retornam sem alteração quando o estado/contexto desejado foi aplicado, e o job pode reenviar o mesmo ID após falha entre aceite e marcação. A criação de Consulta permanece no step durável do job existente, cuja publicação subsequente é retentada pelo Inngest.

| Boundary | Producer | Consumer | Canonical contract | Mapping/guarantees | Failure ownership |
| --- | --- | --- | --- | --- | --- |
| HTTP leitura | `calendarQuerySchema`/controllers | `ListCalendarUseCase`, `GetAppointmentDetailsUseCase` | `CalendarQuery`, `CalendarAppointment`, `CalendarBlock` | Data civil/UUID/ISO, payload mínimo, grade ≤42 dias e janelas UTC por agenda | REST 400/401/403/404/503 |
| Projeções | `CalendarIdentityProvider`, `CalendarConsultationProvider` | Use cases de Agendamento | Leituras por IDs, inclusive advogado inativo | Lote; sem importar tabelas alheias em Agendamento | Falha bloqueia resposta/escrita, nunca autoriza por omissão |
| Persistência | `CancelAppointmentUseCase`, `RescheduleAppointmentUseCase` | `SchedulingDatabase` | `Appointment`, `AppointmentChange` | Commit único, revisão e locks | Erros nomeados traduzidos em REST |
| Evento | `AppointmentChange` pendente | `PublishAppointmentChangeJob` | Eventos existentes, payload ampliado | IDs/instantes ISO, publicação idempotente por change ID | Job retenta; commit permanece |
| Evento Consulta | `ConsultationOutboxEvent` pendente | `PublishConsultationEventJob` → jobs de Intake existentes | `ConsultationCompletedEvent`/`ConsultationLegalContextUpdatedEvent` | Envelope no mesmo commit, ID estável, redelivery tolerado | Job retenta; commit da Consulta permanece |
| Web | `SchedulingService` | Hooks de consulta/ação | Schemas compartilhados/DTOs reduzidos | Query key por período/filtros; invalidação após escrita | Hook preserva formulário e oferece retry |

## packages/core — Domain

| Declaration | Kind | Ownership/identity | Contract summary | Related declarations | Consumers |
| --- | --- | --- | --- | --- | --- |
| `CalendarQuery` | Structure | Agendamento, sem ID | Visão/data civil e filtros | Projeções de evento | Listagem |
| `CalendarAppointment`/`CalendarBlock`/`AppointmentChangeDisplay` | Structure | Agendamento, referências explícitas aos IDs de origem | Eventos legíveis e histórico com nome do ator | `Appointment`, Consulta/Identidade por referência | REST/web |
| `AppointmentChange` | Entity | Agendamento, ID próprio | Histórico imutável de horário e transferência de agenda, mais pendência de publicação | `Appointment`, eventos | Detalhe/outbox |
| `ConsultationOutboxEvent` | Entity | Consulta, ID próprio | Envelope de `ConsultationCompletedEvent` ou `ConsultationLegalContextUpdatedEvent` pendente | Consulta/Intake | Publisher da Consulta |
| `AppointmentCancelledEvent`/`AppointmentRescheduledEvent` | Event | Agendamento, fatos consumados | Nomes `_NAME` estáveis; remarcação identifica agenda/advogado anterior e novo | `AppointmentChange` | Mensageria |

| Path | Change | Declaration | Domain role/schema | Invariants/transitions | Errors/events | Exports/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/core/src/scheduling/domain/structures/calendar-query.ts` | Create | `CalendarQuery` | Schema abaixo | Semana ou grade mensal até 42 datas civis | Período inválido | structures barrel/listagem |
| `packages/core/src/scheduling/domain/structures/available-slot.ts` | Modify | `AvailableSlot` | `startsAt: Date`, `endsAt: Date`, `timeZone: string` IANA da agenda consultada | Slot é horário local convertido a UTC e sempre identifica o fuso de destino | — | structures barrel/GET slots |
| `packages/core/src/scheduling/domain/structures/calendar-appointment.ts` | Create | `CalendarAppointment` | Projeção de marcação abaixo | Referência explícita `appointmentId`; Consulta apenas projetada | — | structures barrel/REST |
| `packages/core/src/scheduling/domain/structures/calendar-block.ts` | Create | `CalendarBlock` | Projeção de bloqueio abaixo | Referência explícita `blockedPeriodId` | — | structures barrel/REST |
| `packages/core/src/scheduling/domain/structures/calendar-event.ts` | Create | `CalendarEvent` | União discriminada de marcação/bloqueio | `kind` distinto | — | structures barrel/REST |
| `packages/core/src/scheduling/domain/structures/appointment-change-display.ts` | Create | `AppointmentChangeDisplay` | Histórico enriquecido | Autor projetado | — | structures barrel/REST |
| `packages/core/src/scheduling/domain/structures/appointment-details.ts` | Create | `AppointmentDetails` | Detalhe enriquecido | Histórico projetado | — | structures barrel/REST |
| `packages/core/src/scheduling/domain/structures/index.ts` | Modify | exports | Reexport explícito | — | — | Core/consumidores |
| `packages/core/src/scheduling/domain/entities/appointment-change.ts` | Create/Modify | `AppointmentChange` | Schema abaixo | Imutável exceto `publishedAt`; guarda agenda/advogado anterior e novo quando remarcado | Eventos após commit | entities barrel/repositório |
| `packages/core/src/scheduling/domain/entities/index.ts` | Modify | export `AppointmentChange` | Reexport | — | — | Core/consumidores |
| `packages/core/src/consultation/domain/entities/consultation-outbox-event.ts` | Create | `ConsultationOutboxEvent` | Schema abaixo | Envelope imutável exceto `publishedAt`; ID estável | Eventos Consulta após commit | entities barrel/repositório |
| `packages/core/src/consultation/domain/entities/index.ts` | Modify | export `ConsultationOutboxEvent` | Reexport | — | — | Core/consumidores |
| `packages/core/src/scheduling/domain/errors/appointment-action-forbidden-error.ts` | Create | `AppointmentActionForbiddenError` | Perfil/escopo | Sem dados do alvo | 403 | errors barrel/REST |
| `packages/core/src/scheduling/domain/errors/appointment-not-editable-error.ts` | Create | `AppointmentNotEditableError` | Cancelado/Consulta iniciada/final | Sem mutação | 409 | errors barrel/REST |
| `packages/core/src/scheduling/domain/errors/appointment-revision-conflict-error.ts` | Create | `AppointmentRevisionConflictError` | Revisão/intenção incompatível | Recarregar sem duplicar | 409 | errors barrel/REST |
| `packages/core/src/scheduling/domain/errors/index.ts` | Modify | exports dos erros | Reexport | — | — | Core/REST |
| `packages/core/src/consultation/domain/errors/consultation-appointment-cancelled-error.ts` | Create | `ConsultationAppointmentCancelledError` | Transição jurídica impedida pelo agendamento | Sem conteúdo pessoal no erro | 409 | errors barrel/REST |
| `packages/core/src/consultation/domain/errors/index.ts` | Modify | export do erro | Reexport | — | — | Core/REST |
| `packages/core/src/scheduling/domain/events/appointment-cancelled-event.ts` | Modify | `AppointmentCancelledEvent` | Acrescenta `changeId,scheduleId,clientId,actorId,startsAt,endsAt` | `_NAME` preservado; sem PII | Fato cancelado | job/consumidores |
| `packages/core/src/scheduling/domain/events/appointment-rescheduled-event.ts` | Modify | `AppointmentRescheduledEvent` | `changeId,appointmentId,previousScheduleId,newScheduleId,clientId,actorId,previousStartsAt,previousEndsAt,newStartsAt,newEndsAt,rescheduledAt` | `_NAME` preservado; sem PII | Fato remarcado, inclusive transferência de advogado | job/consumidores |

```ts
// packages/core/src/scheduling/domain/structures/calendar-query.ts
export type CalendarQuery = {
  view: 'week' | 'month'
  date: string
  clientId?: string
  lawyerId?: string
  event: 'all' | 'scheduled' | 'cancelled' | 'no_show' | 'blocked'
}

// packages/core/src/scheduling/domain/structures/calendar-appointment.ts
export type CalendarAppointment = {
  kind: 'appointment'
  appointmentId: string
  scheduleId: string
  clientId: string
  clientName: string
  lawyerId: string
  lawyerName: string
  startsAt: Date
  endsAt: Date
  timeZone: string
  status: 'scheduled' | 'cancelled'
  cancelledAt?: Date
  consultationId?: string
  consultationStatus?: 'pending' | 'in_progress' | 'completed' | 'no_show'
  consultationStartedAt?: Date
  updatedAt: Date
}
// packages/core/src/scheduling/domain/structures/calendar-block.ts
export type CalendarBlock = {
  kind: 'block'
  blockedPeriodId: string
  scheduleId: string
  lawyerId: string
  lawyerName: string
  startsOn: string
  endsOn: string
  reason?: string
  timeZone: string
}
// packages/core/src/scheduling/domain/structures/calendar-event.ts
import type { CalendarAppointment } from './calendar-appointment'
import type { CalendarBlock } from './calendar-block'
export type CalendarEvent = CalendarAppointment | CalendarBlock
// packages/core/src/scheduling/domain/structures/appointment-change-display.ts
import type { AppointmentChange } from '../entities'
export type AppointmentChangeDisplay = AppointmentChange & { actorName: string }
// packages/core/src/scheduling/domain/structures/appointment-details.ts
import type { CalendarAppointment } from './calendar-appointment'
import type { AppointmentChangeDisplay } from './appointment-change-display'
export type AppointmentDetails = CalendarAppointment & {
  changes: AppointmentChangeDisplay[]
}
```

```ts
// packages/core/src/scheduling/domain/entities/appointment-change.ts
import type { Entity } from '#shared/domain/entities/entity'
export type AppointmentChange = Entity & {
  appointmentId: string
  kind: 'cancelled' | 'rescheduled'
  actorId: string
  occurredAt: Date
  previousScheduleId?: string
  newScheduleId?: string
  previousStartsAt: Date
  previousEndsAt: Date
  newStartsAt?: Date
  newEndsAt?: Date
  previousRevision: Date
  resultingRevision: Date
  publishedAt?: Date
}
```

```ts
// packages/core/src/consultation/domain/entities/consultation-outbox-event.ts
import type { Entity } from '#shared/domain/entities/entity'
export type ConsultationOutboxEvent = Entity & {
  consultationId: string
  name: 'consultation/consultation.completed' | 'consultation/consultation.legal-context-updated'
  payload: Record<string, string>
  occurredAt: Date
  publishedAt?: Date
}
```

O import de `AppointmentChange` em `appointment-change-display.ts` usa o barrel de entidades existente. Cada `export type` acima pertence somente ao arquivo indicado. O mapeamento de persistência resolve `actorName` apenas na projeção, sem gravar nome de Identidade na tabela histórica.

**Schema — `CalendarQuery`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `view` | `'week' \| 'month'` | Yes | enum | Grade civil solicitada. |
| `date` | `string` | Yes | YYYY-MM-DD válido | Data âncora civil, sem conversão pelo navegador. |
| `clientId` | `string` | No | UUID | Cliente. |
| `lawyerId` | `string` | No | UUID | Advogado. |
| `event` | `'all' \| 'scheduled' \| 'cancelled' \| 'no_show' \| 'blocked'` | Yes | enum | Situação/tipo. |

**Schema — `CalendarAppointment`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `kind` | `'appointment'` | Yes | literal | Discriminador. |
| `appointmentId` | `string` | Yes | UUID | Referência ao Agendamento. |
| `scheduleId` | `string` | Yes | UUID | Agenda. |
| `clientId` | `string` | Yes | UUID | Cliente. |
| `clientName` | `string` | Yes | não vazio | Nome mínimo. |
| `lawyerId` | `string` | Yes | UUID | Advogado. |
| `lawyerName` | `string` | Yes | não vazio | Nome profissional. |
| `startsAt` | `Date` | Yes | instante válido | Início UTC. |
| `endsAt` | `Date` | Yes | depois de startsAt | Fim UTC. |
| `timeZone` | `string` | Yes | IANA | Fuso da agenda. |
| `status` | `'scheduled' \| 'cancelled'` | Yes | enum | Agendamento. |
| `cancelledAt` | `Date` | No | se cancelado | Instante histórico. |
| `consultationId` | `string` | No | UUID e ator Admin/advogado responsável | Consulta existente; omitido dos demais perfis de leitura. |
| `consultationStatus` | `'pending' \| 'in_progress' \| 'completed' \| 'no_show'` | No | projeção | Estado da Consulta. |
| `consultationStartedAt` | `Date` | No | projeção | Início registrado. |
| `updatedAt` | `Date` | Yes | instante válido | Revisão otimista. |

**Schema — `CalendarBlock`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `kind` | `'block'` | Yes | literal | Discriminador. |
| `blockedPeriodId` | `string` | Yes | UUID | Referência ao bloqueio. |
| `scheduleId` | `string` | Yes | UUID | Agenda. |
| `lawyerId` | `string` | Yes | UUID | Advogado. |
| `lawyerName` | `string` | Yes | não vazio | Profissional. |
| `startsOn` | `string` | Yes | YYYY-MM-DD | Primeiro dia local. |
| `endsOn` | `string` | Yes | YYYY-MM-DD, não antes de startsOn | Último dia local incluso. |
| `reason` | `string` | No | texto curto | Motivo interno. |
| `timeZone` | `string` | Yes | IANA | Fuso da agenda. |

**Schema — `AppointmentDetails`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `...CalendarAppointment` | `CalendarAppointment` | Yes | mesmo contrato | Campos da projeção. |
| `changes` | `AppointmentChangeDisplay[]` | Yes | cronológico | Histórico com responsável profissional. |

**Schema — `CalendarEvent`**

| Variant | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `kind: 'appointment'` | `CalendarAppointment` | Conditional | schema de `CalendarAppointment` | Evento com cliente/horário. |
| `kind: 'block'` | `CalendarBlock` | Conditional | schema de `CalendarBlock` | Bloqueio de dia inteiro. |

**Schema — `AppointmentChangeDisplay`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `...AppointmentChange` | `AppointmentChange` | Yes | mesmo contrato | Registro histórico. |
| `actorName` | `string` | Yes | não vazio | Nome profissional resolvido por Identidade, inclusive colaborador inativo. |

**Schema — `AppointmentChange`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | UUID | Registro. |
| `appointmentId` | `string` | Yes | UUID | Marcação. |
| `kind` | `'cancelled' \| 'rescheduled'` | Yes | enum | Ação. |
| `occurredAt` | `Date` | Yes | instante válido | Quando. |
| `actorId` | `string` | Yes | UUID | Responsável. |
| `previousScheduleId` | `string` | Conditional | UUID com kind rescheduled | Agenda de origem. |
| `newScheduleId` | `string` | Conditional | UUID com kind rescheduled | Agenda de destino. |
| `previousStartsAt` | `Date` | Yes | instante válido | Início anterior. |
| `previousEndsAt` | `Date` | Yes | depois de previousStartsAt | Fim anterior. |
| `newStartsAt` | `Date` | Conditional | com kind rescheduled | Novo início. |
| `newEndsAt` | `Date` | Conditional | com kind rescheduled, depois de newStartsAt | Novo fim. |
| `previousRevision` | `Date` | Yes | instante válido | Revisão anterior. |
| `resultingRevision` | `Date` | Yes | posterior à revisão anterior | Nova revisão. |
| `publishedAt` | `Date` | No | após envio | Estado do outbox. |

**Schema — `ConsultationOutboxEvent`**

| Field | Type | Required | Validation | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | UUID | ID estável do envelope/evento. |
| `consultationId` | `string` | Yes | UUID | Consulta alterada. |
| `name` | união dos dois `_NAME` de Consulta | Yes | enum | Tipo do evento existente. |
| `payload` | `Record<string,string>` | Yes | schema do evento correspondente | IDs e instante ISO, sem conteúdo jurídico/PII. |
| `occurredAt` | `Date` | Yes | instante válido | Momento da transição. |
| `publishedAt` | `Date` | No | depois da aceitação | Estado de entrega. |

## packages/core — Use cases

| Use case | Actor/trigger | Input/output | Direct collaborators | Consistency boundary | Failures/side effects |
| --- | --- | --- | --- | --- | --- |
| `ListCalendarUseCase` | Perfis de leitura | Ator + `CalendarQuery` → `CalendarEvent[]` | Agendas, compromissos, Identidade, Consulta | Escopo aplicado antes de filtros; Administrador não recebe CalendarBlock; bloqueio não deixa de afetar disponibilidade | Período/escopo inválido, projeção indisponível |
| `GetAppointmentDetailsUseCase` | Perfil de leitura | Ator + ID → `AppointmentDetails` | Mesmas projeções e histórico | Escopo por ID sem vazamento; link só Admin/advogado responsável | 404 indistinguível para objeto fora do escopo |
| `GetConsultationUseCase`/`GetConsultationByIntakeUseCase` | Admin ou advogado responsável | Ator + ID/Intake → ficha completa | Repositórios de Consulta e projeções existentes | Autoriza antes de carregar cliente/Intake/conteúdo | 404 indistinguível sem exposição da ficha |
| `CancelAppointmentUseCase` | Admin/Atendente | ID + revisão + ator → `AppointmentDetails` | `SchedulingDatabase`, relógio/ID | Regras no callback; idempotência por revisão/intenção | Histórico e outbox no commit |
| `RescheduleAppointmentUseCase` | Admin/Atendente | ID + revisão + advogado opcional + novo início + ator → `AppointmentDetails` | `SchedulingDatabase`, Identidade, Agendas, provider de escrita da Consulta, relógio/ID | Rechecagem integral; locks ordenados de agenda origem/destino e sincronização da Consulta no callback | Conflito sem mutação parcial |
| `ListRescheduleSlotsUseCase` | Admin/Atendente | ID + advogado opcional + data local → slots com `timeZone` | Agendas e compromissos | Lê agenda escolhida; duração da marcação; leitura não reserva; confirmação revalida | Não elegível/sem slots/erro |
| `CheckAppointmentAvailabilityUseCase` | Leitura/commit | Agenda, duração, intervalo, bloqueios e compromissos → elegibilidade | `Schedule`, `Appointment`, `BlockedPeriod` | Mesma regra em sugestão, remarcação e reserva; confirmação revalida sob lock | Sem side effect |
| `ListCalendarFilterOptionsUseCase` | Perfis de leitura | dimensão + busca/cursor → opções | Agendamentos e Identidade | Busca em Identidade intersectada com IDs de agendamentos autorizados; pagina até 20 itens visíveis ou fim | Sem vazamento de cliente/inativo ou falso vazio terminal |
| `ReserveIntakeAppointmentUseCase` | Job existente | Pedido de reserva → `Appointment` | Repositórios/transação | Usa mesmo lock da agenda e mantém retry por Intake | Sem dupla reserva |
| `CreateConsultationFromAppointmentUseCase`/`CompleteConsultationUseCase`/`FinalizeConsultationAttendanceUseCase` | Evento/ator da Consulta | Pedido existente → Consulta | `AppointmentWriteTransactionProvider`, `ConsultationsRepository`, `ConsultationOutboxRepository` | Callback sob lock agenda → marcação; caso de uso exige scheduled e relê Consulta | Sem criar/finalizar/concluir após cancelamento; conclusão/contexto e outbox no mesmo commit |
| `AuthorizeScheduleAccessUseCase` | Acesso à disponibilidade legada | Ator + agenda/colaborador + ação → permitido | `SchedulesRepository` | Advogado própria; Admin todas; outros rejeitados | 403 sem vazamento |

| Path | Change | Declaration/signature | Input/output/errors | Authorization/consistency | Side effects/dependencies | Consumers/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/core/src/scheduling/domain/use-cases/list-calendar-use-case.ts` | Create | `ListCalendarUseCase.execute({actor,query})` | `CalendarEvent[]`, erros de período/acesso/projeção | Perfil/escopo antes da consulta; janela UTC derivada de cada agenda, projeção por data local; no-show apenas projeção; não busca/projeta bloqueios para Admin | Leituras batch, nenhuma escrita; disponibilidade mantém os bloqueios | GET calendar; unit |
| `packages/core/src/scheduling/domain/use-cases/get-appointment-details-use-case.ts` | Create | `GetAppointmentDetailsUseCase.execute({actor,appointmentId})` | `AppointmentDetails`/404 | Mesma política da lista, inclusive histórico; link só Admin/advogado responsável | Nenhuma escrita | GET detail; unit |
| `packages/core/src/scheduling/domain/use-cases/cancel-appointment-use-case.ts` | Create | `CancelAppointmentUseCase.execute({actor,appointmentId,expectedRevision})` | Detalhe/403/404/409 | Perfil, revisão, estado Consulta, `database.run` | Caso de uso grava histórico/outbox via scope | PATCH cancel; unit |
| `packages/core/src/scheduling/domain/use-cases/reschedule-appointment-use-case.ts` | Create/Modify | `RescheduleAppointmentUseCase.execute({actor,appointmentId,expectedRevision,startsAt,lawyerId?})` | Detalhe/403/404/409/422 | Advogado atual por omissão; troca somente para advogado ativo com agenda; duração preservada; futuro/horário/bloqueio/overlap; locks origem/destino em ordem estável | Atualiza marcação, Consulta existente, histórico e outbox no mesmo commit | PATCH reschedule; unit |
| `packages/core/src/scheduling/domain/use-cases/list-reschedule-slots-use-case.ts` | Create/Modify | `ListRescheduleSlotsUseCase.execute({actor,appointmentId,date,lawyerId?})` | Slots da agenda selecionada com duração atual; 403/404/409 | Advogado atual por omissão; exige profissional ativo e agenda; não reserva; filtra passado/bloqueios/overlap | GET slots; unit |
| `packages/core/src/scheduling/domain/use-cases/check-appointment-availability-use-case.ts` | Create | `CheckAppointmentAvailabilityUseCase.execute({schedule,startsAt,endsAt,blockedPeriods,appointments,excludeAppointmentId?})` | Elegibilidade; horário/bloqueio/overlap | Aplica regra canônica em sugestão, remarcação e reserva; nenhuma leitura própria | Puro; invocado dentro da transação nos writes | Três casos consumidores; unit |
| `packages/core/src/scheduling/domain/use-cases/list-calendar-filter-options-use-case.ts` | Create | `ListCalendarFilterOptionsUseCase.execute({actor,kind,search,cursor})` | Página de até 20 IDs/nomes visíveis; 403 | Busca batelada até preencher página ou esgotar candidatos; cursor opaco continua sobre fonte global | Zero terminal somente sem nextCursor | GET filters; unit |
| `packages/core/src/scheduling/domain/use-cases/reserve-intake-appointment-use-case.ts` | Modify | `ReserveIntakeAppointmentUseCase.execute` | Assinatura externa preservada | Lock por agenda com remarcação; valida disponibilidade no commit | Reserva existente sem evento duplicado | Job existente; regressão unit/DB |
| `packages/core/src/scheduling/domain/use-cases/authorize-schedule-access-use-case.ts` | Create | `AuthorizeScheduleAccessUseCase.execute({actor,scheduleId?,collaboratorId?,operation})` | Sem payload em sucesso/403 | Advogado própria, Admin todas, perfil ativo | Nenhuma escrita | SchedulesController; unit |
| `packages/core/src/consultation/use-cases/complete-consultation-use-case.ts` | Modify | `CompleteConsultationUseCase.execute` | Assinatura preservada; injeta provider transacional e outbox | Dentro do callback, exige marcação scheduled, relê Consulta e valida pending/ficha/pacote antes do write | Grava Consulta e evento pendente atomicamente; sem broker no caso | Controller/test existente |
| `packages/core/src/consultation/use-cases/finalize-consultation-attendance-use-case.ts` | Modify | `FinalizeConsultationAttendanceUseCase.execute` | Assinatura preservada; injeta provider transacional e outbox | Dentro do callback, exige marcação scheduled e relê Consulta antes do write | Grava evento de contexto pendente somente se área/tema mudaram; sem broker no caso | Controller/test existente |
| `packages/core/src/consultation/use-cases/create-consultation-from-appointment-use-case.ts` | Modify | `CreateConsultationFromAppointmentUseCase.execute` | Retorna undefined se reserva cancelada antes do job; injeta provider transacional | Dentro do callback, exige marcação scheduled e relê Consulta/Intake; mantém unique por appointment/Intake | Sem Consulta para cancelada | Job/test existente |
| `packages/core/src/consultation/use-cases/get-consultation-use-case.ts` | Modify | `GetConsultationUseCase.execute({actor,consultationId})` | Ficha completa/404 | Admin ou advogado associado; autoriza antes de buscar outras entidades | Sem dados de objeto alheio | GET por ID; unit |
| `packages/core/src/consultation/use-cases/get-consultation-by-intake-use-case.ts` | Modify | `GetConsultationByIntakeUseCase.execute({actor,intakeId})` | Ficha completa/404 | Resolve Consulta mínima e delega ao mesmo controle de acesso por ID | Sem bypass por Intake | GET by-intake; unit |
| `packages/core/src/scheduling/domain/use-cases/index.ts` | Modify | exports dos oito novos casos | — | — | — | Server |
| `packages/core/src/scheduling/domain/use-cases/tests/list-calendar-use-case.test.ts` | Create | casos de listagem | Perfil, filtro, data | Leitura observável | Sem side effect | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/list-calendar-filter-options-use-case.test.ts` | Create | facetas pesquisáveis | Páginas globais sem itens visíveis, cursor e fim | Sem falso vazio ou vazamento | — | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/list-reschedule-slots-use-case.test.ts` | Modify | slots disponíveis | Advogado atual/selecionado, inativo/sem agenda, duração, bloqueio e passado | Não reserva | — | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/authorize-schedule-access-use-case.test.ts` | Create | rotas legadas | Admin/próprio/alheio/outros | 403 sem vazamento | — | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/get-appointment-details-use-case.test.ts` | Create | casos de detalhe | Escopo/Consulta/histórico | 404 seguro | — | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/cancel-appointment-use-case.test.ts` | Create | casos de cancelamento | Ator/revisão/estado | Idempotência | Change único | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/reschedule-appointment-use-case.test.ts` | Modify | casos de remarcação | Mesmo/outro advogado, identidade ativa, lock duplo, Consulta sincronizada e rejeições | Sem mutação parcial nem mudança parcial de Consultation | Change único | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/check-appointment-availability-use-case.test.ts` | Create | regra canônica de disponibilidade | Janela, duração, bloqueio e sobreposição | Resultado igual para consumidores de leitura e escrita | Sem side effect | Vitest |
| `packages/core/src/scheduling/domain/use-cases/tests/reserve-intake-appointment-use-case.test.ts` | Modify | regressão de reserva | Mesmo lock e Intake | Uma ocupação | Job preservado | Vitest |
| `packages/core/src/consultation/use-cases/tests/complete-consultation-use-case.test.ts` | Create | conclusão após cancelamento e outbox | Agendamento ativo/cancelado | Rejeição sem evento; sucesso cria pendência única no callback | Broker não chamado diretamente | Vitest |
| `packages/core/src/consultation/use-cases/tests/finalize-consultation-attendance-use-case.test.ts` | Modify | finalização após cancelamento e contexto | Agendamento ativo/cancelado | Rejeição sem gravação; contexto alterado cria pendência única | Broker não chamado diretamente | Vitest |
| `packages/core/src/consultation/use-cases/tests/create-consultation-from-appointment-use-case.test.ts` | Modify | criação após cancelamento | Evento reservado atrasado | Sem Consulta duplicada/cancelada | Job só publica se criou | Vitest |
| `packages/core/src/consultation/use-cases/tests/get-consultation-use-case.test.ts` | Modify | leitura por ID | Admin/advogado associado/demais | 404 seguro antes de carregar detalhes | — | Vitest |
| `packages/core/src/consultation/use-cases/tests/get-consultation-by-intake-use-case.test.ts` | Create | leitura por Intake | ID forjado e escopo do ator | 404 seguro sem bypass | — | Vitest |

## packages/core — Interfaces

| Contract | Kind/owner | Capability | Implementers | Consumers | Guarantees/failures |
| --- | --- | --- | --- | --- | --- |
| `AppointmentsRepository` | Repositório/Agendamento | Busca por período/ID, histórico | `DrizzleAppointmentsRepository` | Leitura e reserva | Intervalos `[from,to)`, sem N+1 |
| `SchedulesRepository` | Repositório/Agendamento | Buscar agendas/bloqueios por período | `DrizzleSchedulesRepository` | Calendário e disponibilidade | Inclui advogado inativo sem criar agenda |
| `CalendarIdentityProvider` | Provider compartilhado/Identidade | Nomes mínimos de clientes/advogados e ator ativo | `DrizzleCalendarIdentityProvider` | Use cases de Agendamento | Leitura autorizada batch; sem dados cadastrais completos |
| `CalendarConsultationProvider` | Provider compartilhado/Consulta | ID, estado e início por appointment | `DrizzleCalendarConsultationProvider` | Leitura/mutações | Falha fechada; não expõe ficha |
| `RescheduledAppointmentConsultationProvider` | Provider de escrita compartilhado/Consulta | Sincronizar lawyerId da Consulta pendente existente pelo appointmentId | Implementação na camada de dados de Consulta com executor transacional ativo | `RescheduleAppointmentUseCase` | Atualiza somente no callback de transação; não cria Consulta; sem mudança parcial |
| `SchedulingDatabase` | Escopo transacional/Agendamento | Repositórios vinculados a uma transação | `DrizzleSchedulingDatabase` | Casos de reserva/cancelamento/remarcação | SERIALIZABLE, retry limitado e rollback; regras nos casos de uso |
| `AppointmentWriteTransactionProvider` | Provider compartilhado/Agendamento | Callback sob lock agenda → marcação, snapshot de status | `DrizzleAppointmentWriteTransactionProvider` | Casos de uso de Consulta | Mesmo executor; sem regra de elegibilidade no adapter |
| `ConsultationsRepository` | Repositório/Consulta | Criação/escrita no executor ativo | `DrizzleConsultationsRepository` | Criar/concluir/finalizar Consulta | Não decide estado da marcação; caso de uso falha fechado |
| `ConsultationOutboxRepository` | Repositório/Consulta | Enfileirar no executor ativo, listar pendências e marcar entrega | `DrizzleConsultationOutboxRepository` | Casos de Consulta e publisher | Unicidade por ID; sem envio externo na transação |

| Path | Change | Contract/signature | Capability semantics | Guarantees/failures | Implementers/consumers | Exports |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/core/src/scheduling/interfaces/appointments-repository.ts` | Modify | `replaceIfRevisionMatches` aceita `scheduleId`; histórico da mudança inclui agenda/advogado anterior/novo; mantém demais operações | Transferência de marcação e histórico no scope | Filtros limitados e parametrizados; nenhuma escrita fora do callback | Drizzle/use cases | interfaces barrel |
| `packages/core/src/scheduling/interfaces/schedules-repository.ts` | Modify | `findByCollaboratorIdForUpdate` já adicionado; `findByIdForUpdate`, `listByCollaboratorIds(ids?)`, `listBlockedPeriods(scheduleIds,from,to)`; mantém métodos | Batch por agenda/período, fim inclusivo dos bloqueios | Lock de agenda antes do appointment, sem omitir profissionais inativos | Drizzle/listagem | interfaces barrel |
| `packages/core/src/shared/interfaces/calendar-identity-provider.ts` | Create | `CalendarIdentityProvider.getActor(id)`, `getClients(ids)`, `getLawyers(ids)`, `getCollaborators(ids)`, `searchClients(search,cursor,limit)`, `searchLawyers(search,cursor,limit)` | Identidade pesquisa nomes (inclusive inativos) e resolve autores; Agendamento intersecta IDs no escopo | Lotes limitados, sem dados completos | Identity adapter/Agendamento | interfaces barrel |
| `packages/core/src/shared/interfaces/calendar-consultation-provider.ts` | Create | `CalendarConsultationProvider.getByAppointmentIds(ids)` | Projeção de ID/estado/início por marcação | Leitura crítica adere ao executor ativo após lock de agenda/marcação | Consultation adapter/Agendamento | interfaces barrel |
| `packages/core/src/shared/interfaces/rescheduled-appointment-consultation-provider.ts` | Create | `RescheduledAppointmentConsultationProvider.syncLawyerForAppointment(appointmentId,lawyerId)` | Atualiza apenas `assignedLawyerId` da Consulta pendente existente | Requer executor transacional ativo; ausência de Consulta é no-op e falha de persistência aborta a transação | Consultation adapter/Agendamento | interfaces barrel |
| `packages/core/src/shared/interfaces/appointment-write-transaction-provider.ts` | Create | `AppointmentWriteTransactionProvider.runWithLockedAppointment(id,callback)` | Snapshot mínimo de status da marcação sob lock; callback genérico | Lock agenda → marcação e executor compartilhado, sem decisão de elegibilidade | Scheduling adapter/casos de Consulta | interfaces barrel |
| `packages/core/src/scheduling/interfaces/scheduling-database.ts` | Created | `SchedulingDatabase.run(operation)` | Executa callback com repositórios transacionais; sem regra de negócio no adapter | Commit/rollback, retry `40001`/`40P01` uma vez | Drizzle/use cases | interfaces barrel |
| `packages/core/src/scheduling/interfaces/scheduling-database-repositories.ts` | Created | `SchedulingDatabaseRepositories` | `appointmentsRepository`, `schedulesRepository`; ampliar somente com ports necessários | Nenhum tipo Drizzle no Core | Casos de uso | interfaces barrel |
| `packages/core/src/scheduling/interfaces/index.ts` | Modified | export dos contratos de transação | Único barrel | — | Core/server | subpath existente |
| `packages/core/src/shared/interfaces/index.ts` | Modify | export dos providers de projeção e transação | Contratos compartilhados por Agendamento e módulos de origem | Sem dependência de módulo | Core/server | subpath existente |
| `packages/core/src/consultation/interfaces/consultations-repository.ts` | Confirm | `add`, `replace`, `findById`, `findByIntakeId` existentes | Consulta escreve somente após caso de uso verificar snapshot bloqueado | Métodos usam executor transacional ativo, sem regra de Agendamento no repo | Drizzle/consultation use cases | barrel existente |
| `packages/core/src/consultation/interfaces/consultation-outbox-repository.ts` | Create | `add(event)`, `listPending(limit)`, `markPublished(id,publishedAt)` | Persistir evento de Consulta no callback; publisher lê/atualiza após commit | `id` estável; markPublished condicional; sem conteúdo jurídico/PII | Drizzle/casos de Consulta/job | interfaces barrel |
| `packages/core/src/consultation/interfaces/index.ts` | Modify | export `ConsultationOutboxRepository` | Reexport | — | Core/server | subpath existente |

Nenhum tipo Drizzle ou contexto de transação passa para Core. A remarcação lê a agenda atual, resolve e valida o advogado/agenda de destino, bloqueia as agendas de origem e destino em ordem estável de ID, relê marcação e Consulta no mesmo executor e então verifica disponibilidade na agenda de destino. Mudança concorrente da agenda ou revisão obsoleta retorna conflito; marcação, advogado da Consulta, histórico e outbox são gravados no mesmo commit. A projeção de Consulta e o provider de escrita usam o executor ativo; qualquer falha aborta tudo. Não há coluna de tenant hoje; o escopo real é o colaborador autenticado/agenda. Uma futura dimensão de estabelecimento exige migração própria e não é inferida neste contrato.

Nas facetas, sem texto de busca o Agendamento pagina IDs distintos de marcações autorizadas e pede nomes à Identidade. Com texto, a Identidade devolve candidatos por nome em páginas limitadas (incluindo advogado inativo); o Agendamento intersecta os IDs com marcações autorizadas e continua percorrendo páginas até reunir 20 opções visíveis ou esgotar a busca. Se a varredura atingir o orçamento de uma chamada antes de encontrar opção visível, devolve `items: []` **com** `nextCursor` opaco e `nextCursor` presente; o hook continua carregando sem mostrar “sem resultados”. Somente `nextCursor` ausente encerra a busca e permite o estado vazio. O cursor inclui a posição da busca em Identidade, permanece vinculado a `search`/`kind`/ator e é rejeitado quando esses parâmetros mudam. Limites de página e varredura impedem consulta ilimitada; a resposta não revela contagens ou nomes fora do escopo. Para Advogado, a faceta de profissional contém apenas sua própria agenda.

Assinaturas mínimas dos ports novos, sem tipos de framework:

```ts
interface CalendarIdentityProvider {
  getClients(ids: readonly string[]): Promise<ReadonlyMap<string, { name: string }>>
  getLawyers(ids: readonly string[]): Promise<ReadonlyMap<string, { name: string; active: boolean }>>
  getCollaborators(ids: readonly string[]): Promise<ReadonlyMap<string, { name: string }>>
  getActor(id: string): Promise<CollaboratorSummary | undefined>
  searchClients(search: string, cursor: string | undefined, limit: number):
    Promise<{ items: readonly { id: string; name: string }[]; nextCursor?: string }>
  searchLawyers(search: string, cursor: string | undefined, limit: number):
    Promise<{ items: readonly { id: string; name: string }[]; nextCursor?: string }>
}
interface CalendarConsultationProvider {
  getByAppointmentIds(ids: readonly string[]): Promise<ReadonlyMap<string, {
    id: string
    status: 'pending' | 'in_progress' | 'completed' | 'no_show'
    startedAt?: Date
  }>>
}
interface AppointmentWriteTransactionProvider {
  runWithLockedAppointment<Result>(
    appointmentId: string,
    operation: (appointment: { appointmentId: string; status: 'scheduled' | 'cancelled' } | undefined) => Promise<Result>,
  ): Promise<Result>
}
interface SchedulingDatabaseRepositories {
  readonly appointmentsRepository: AppointmentsRepository
  readonly schedulesRepository: SchedulesRepository
}
interface SchedulingDatabase {
  run<Result>(operation: (repositories: SchedulingDatabaseRepositories) => Promise<Result>): Promise<Result>
}
```

## packages/validation — Validation

| Schema | Concern/owner | Shape responsibility | Composes/derives from | Boundary consumers | Error/type contract |
| --- | --- | --- | --- | --- | --- |
| `calendarQuerySchema` | Agendamento | `view,date,clientId,lawyerId,event` | Data civil/UUID Zod | GET calendar, web service | 400 com issues seguras |
| `appointmentChangeSchema` | Agendamento | `expectedRevision`, `startsAt` e `lawyerId` opcional só para reschedule | UUID/ISO Zod | PATCHs, React Hook Form | 400 de forma; elegibilidade fica no Core |
| `appointmentChangeEventSchema` | Agendamento | Payload de fato interno em ISO, incluindo agenda anterior/nova em remarcações | Campos de eventos Core | Inngest job/outbox | Rejeição controlada de payload inválido |
| `calendarSearchSchema` | Web/Agendamento | view/date/filtros da URL | enum/data/UUID | TanStack route | `date` ausente permanece opcional no parse; Page hook normaliza para Hoje de São Paulo na entrada; URL inválida corrigida |
| `consultationOutboxEventSchema` | Consulta | `name` discriminado e payload dos dois eventos existentes | UUID/ISO Zod | Write outbox/publisher | Rejeição controlada sem conteúdo jurídico |
| `calendarOptionsQuerySchema` | Agendamento | kind/search/cursor e data/lawyerId opcional para slots | UUID/data local | GET filters/slots | 400 com limites de busca |

| Path | Change | Schema/declaration | Fields/refinements | Composition/ownership | Consumers | Export/tests |
| --- | --- | --- | --- | --- | --- | --- |
| `packages/validation/src/scheduling/schemas/calendar-query-schema.ts` | Create | `calendarQuerySchema` | `view` week/month e `date` YYYY-MM-DD válidos; UUID opcionais; evento default all; rejeita from/to arbitrário | Sintaxe, não acesso | controller/service | root barrel; controller tests |
| `packages/validation/src/scheduling/schemas/appointment-change-schema.ts` | Modify | `rescheduleAppointmentChangeSchema` aceita `lawyerId` UUID opcional para compatibilidade; início permanece obrigatório em remarcação | Form/REST | controllers/dialog | root barrel; widget/controller tests |
| `packages/validation/src/scheduling/schemas/appointment-change-event-schema.ts` | Modify | `appointmentChangeEventSchema` | IDs de agenda anterior/nova UUID em eventos de remarcação; contrato antigo de cancelamento preservado | Evento | Inngest | root barrel; job test |
| `packages/validation/src/scheduling/schemas/calendar-search-schema.ts` | Create | `calendarSearchSchema` | `view` week/month, `date` civil válida quando presente, filtros opcionais; sem ler relógio no schema | URL | route/widget | root barrel; route test |
| `packages/validation/src/consultation/schemas/consultation-outbox-event-schema.ts` | Create | `consultationOutboxEventSchema` | Nome `_NAME`, IDs UUID, occurredAt ISO e payload mínimo por variante | Evento da Consulta | Caso de uso/job | consultation barrel; job/consumer tests |
| `packages/validation/src/consultation/index.ts` | Modify | export do schema de outbox | Reexport | — | Core/server | subpath existente |
| `packages/validation/src/scheduling/schemas/calendar-options-query-schema.ts` | Modify | `rescheduleSlotsQuerySchema` aceita `lawyerId` UUID opcional junto à data civil | Query, não acesso | GET slots | root barrel; controller |
| `packages/validation/src/scheduling/schemas/index.ts` | Create | exports de schemas | Reexport `.ts` | — | web/server | scheduling barrel |
| `packages/validation/src/scheduling/index.ts` | Create | reexport | Único dono | — | web/server | package export |
| `packages/validation/package.json` | Modify | `./scheduling` | Export aponta `src/scheduling/index.ts` | — | web/server | typecheck |

## apps/server and apps/web — REST

| Operation | Server entry | Core action/contract | Web consumer | Security/tenant source | Compatibility/error owner |
| --- | --- | --- | --- | --- | --- |
| `GET /scheduling/calendar` | `ListCalendarController.handle` | `ListCalendarUseCase` | `SchedulingService.listCalendar` | Auth + ActiveCollaborator + actor do token | Query schema/DTO; 400/403/503 |
| `GET /scheduling/appointments/:id` | `GetAppointmentDetailsController.handle` | `GetAppointmentDetailsUseCase` | `SchedulingService.getAppointmentDetails` | Mesmo ator/escopo | 404 sem existência lateral |
| `GET /scheduling/calendar/filters` | `ListCalendarFilterOptionsController.handle` | `ListCalendarFilterOptionsUseCase` | `SchedulingService.listCalendarFilterOptions` | Facetas de dados visíveis | 400/403 |
| `GET /scheduling/appointments/:id/slots` | `ListRescheduleSlotsController.handle` | `ListRescheduleSlotsUseCase` | `SchedulingService.listRescheduleSlots` | Admin/Atendente; `lawyerId` opcional, padrão advogado atual | 400/403/404/409/422 |
| `PATCH /scheduling/appointments/:id/cancel` | `CancelAppointmentController.handle` | `CancelAppointmentUseCase` | `SchedulingService.cancelAppointment` | Admin/Atendente no Core | 400/403/404/409 |
| `PATCH /scheduling/appointments/:id/reschedule` | `RescheduleAppointmentController.handle` | `RescheduleAppointmentUseCase` | `SchedulingService.rescheduleAppointment` | Admin/Atendente no Core; `lawyerId` opcional por compatibilidade | 400/403/404/409/422 |

| Path | Change | Declaration/operation | Boundary/security | Request/response/errors | Effects/consumers | Registration/examples |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/scheduling/rest/controllers/list-calendar.controller.ts` | Create | `ListCalendarController`, GET calendar | Auth/ActiveCollaborator/CurrentCollaborator; restrição no caso | Query schema; DTO com ISO e bloqueio local; 400/403/503 | Read only | SchedulingModule/Swagger |
| `apps/server/src/scheduling/rest/controllers/get-appointment-details.controller.ts` | Create | `GetAppointmentDetailsController`, GET appointment | Id UUID e escopo | 200/401/403/404/503 | Read only | SchedulingModule/Swagger |
| `apps/server/src/scheduling/rest/controllers/list-calendar-filter-options.controller.ts` | Create | `ListCalendarFilterOptionsController`, GET filters | Ator e filtro validados | Página de opções ID/nome apenas, inclusive advogado inativo histórico | Read only | SchedulingModule/Swagger |
| `apps/server/src/scheduling/rest/controllers/list-reschedule-slots.controller.ts` | Modify | `ListRescheduleSlotsController`, GET slots | Ator Admin/Atendente, ID/data/advogado opcional | Slots ISO/duração e fuso IANA da agenda selecionada; não reserva | Read only | SchedulingModule/Swagger |
| `apps/server/src/scheduling/rest/controllers/cancel-appointment.controller.ts` | Create | `CancelAppointmentController`, PATCH cancel | Ator do token, não body | revisão, 200/403/404/409 | Commit único | SchedulingModule/Swagger |
| `apps/server/src/scheduling/rest/controllers/reschedule-appointment.controller.ts` | Modify | `RescheduleAppointmentController`, PATCH reschedule | ID, ator e schema | revisão + início ISO + lawyerId opcional; 200/409/422 | Commit único entre agendas e Consulta | SchedulingModule/Swagger |
| `apps/server/src/scheduling/rest/controllers/schedules.controller.ts` | Create | `SchedulesController` movido | Auth/ActiveCollaborator e `AuthorizeScheduleAccessUseCase` para agenda própria/Admin em rotas legadas | Contrato de disponibilidade preservado | Não vaza agendas | SchedulingModule; substitui arquivo legado |
| `apps/server/src/consultation/rest/controllers/complete-consultation.controller.ts` | Modify | `CompleteConsultationController` | Injeção do caso, provider transacional e outbox | 409 se agendamento cancelado | Sem evento direto; pendência no commit | ConsultationModule |
| `apps/server/src/consultation/rest/controllers/finalize-consultation-attendance.controller.ts` | Modify | `FinalizeConsultationAttendanceController` | Injeção do caso, provider transacional e outbox | 409 se agendamento cancelado | Sem evento direto; pendência se contexto mudou | ConsultationModule |
| `apps/server/src/consultation/rest/controllers/get-consultation.controller.ts` | Modify | `GetConsultationController` | Ator pelo `CurrentCollaborator`/token | 404 para outro advogado/perfis sem ficha | Sem carregar conteúdo alheio | ConsultationModule |
| `apps/server/src/consultation/rest/controllers/get-consultation-by-intake.controller.ts` | Modify | `GetConsultationByIntakeController` | Mesmo ator/controle por ID | 404 para Intake alheio | Sem bypass | ConsultationModule |
| `apps/server/src/consultation/rest/controllers/tests/get-consultation.controller.test.ts` | Modify | GET por ID com ator real | Admin/advogado responsável/demais | 200/404 sem PII alheia | DB real | Vitest/Supertest |
| `apps/server/src/consultation/rest/controllers/tests/get-consultation-by-intake.controller.test.ts` | Modify | GET por Intake com ator real | Mesmo escopo por ID | 200/404 sem bypass | DB real | Vitest/Supertest |
| `apps/server/src/scheduling/database/drizzle/repositories/rest/controllers/index.ts` | Remove | `SchedulesController` legado | Saída da camada Database | — | — | Import substituído |
| `apps/server/src/scheduling/rest/controllers/index.ts` | Create | exports dos sete controllers | — | — | — | SchedulingModule |
| `apps/server/src/scheduling/rest/dtos/calendar-response.dto.ts` | Modify | `CalendarResponseDto`, `AppointmentDetailsResponseDto`, `RescheduleSlotResponseDto` | Instantes serializados UTC; slot também retorna `timeZone` IANA de destino | União discriminada, histórico/ator nome por projeção; sem CPF/email | Web | Swagger |
| `apps/web/src/rest/services/scheduling-service.ts` | Modify | `listCalendar(query view/date)`, `listCalendarFilterOptions(kind,search,cursor)`, `getAppointmentDetails(id)`, `listRescheduleSlots(id,date,lawyerId?)`, `cancelAppointment(id,revision)`, `rescheduleAppointment(id,revision,startsAt,lawyerId?)` | Sessão pelo RestClient existente | Slots tipados com timezone IANA da agenda de destino; preserva erros sem `any` | Hooks de Agendamento; métodos de disponibilidade mantidos | service tests |
| `apps/server/src/scheduling/rest/controllers/tests/calendar-read.controller.test.ts` | Create | HTTP GET calendário/detalhe/filtros | Sessão/DB real fixture | 400/403/404, sem PII | Queries reais | Vitest/Supertest |
| `apps/server/src/scheduling/rest/controllers/tests/appointment-actions.controller.test.ts` | Create | HTTP PATCH/slots | Sessão/DB real fixture | 200/403/409/422 | Histórico/horário | Vitest/Supertest |
| `apps/server/src/scheduling/rest/controllers/tests/schedules-access.controller.test.ts` | Create | HTTP disponibilidade legada | Guard/caso de acesso | Própria/Admin; outros 403 | Rotas existentes | Vitest/Supertest |
| `apps/server/src/consultation/rest/controllers/tests/consultation-appointment-guard.controller.test.ts` | Create | HTTP finalizar/concluir | Sessão/DB real fixture | 409 se cancelado | Sem conclusão/evento | Vitest/Supertest |

## apps/server — Database

| Persistence capability | Domain owner | Core contract | Models/types | Mapper | Repository/transaction owner |
| --- | --- | --- | --- | --- | --- |
| Calendário/compromisso | Agendamento | `AppointmentsRepository`, `SchedulesRepository` | `appointmentModel`, `schedules`, `blockedPeriods` | `DrizzleAppointmentMapper`, mapeamento de agenda | Drizzle repositories |
| Alteração/histórico/outbox | Agendamento | `SchedulingDatabase` | `appointmentChangeModel`, `DrizzleAppointmentChange` | `DrizzleAppointmentChangeMapper` | `DrizzleSchedulingDatabase` |
| Dados de apresentação | Identidade/Consulta | Providers de calendário | Modelos próprios existentes | Projeções mínimas | Adapters nos módulos donos |
| Eventos duráveis da Consulta | Consulta | `ConsultationOutboxRepository` | `consultationOutboxEventModel`, row type | `DrizzleConsultationOutboxEventMapper` | `DrizzleConsultationOutboxRepository` no executor ativo |

| Path | Change | Declaration/operation | Schema/mapping | Integrity/query contract | Migration/transaction | Registration/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/scheduling/database/drizzle/models/appointment-model.ts` | Modify | `appointmentModel` | Campos existentes preservados; índice de período | Índice `(schedule_id,starts_at,ends_at)` para overlap/período; cancelados legíveis | Migração 0053; escrita no scope | Repo |
| `apps/server/src/shared/database/drizzle/schema/scheduling.ts` | Modify | `schedules`, `blockedPeriods` | `time_zone text not null default 'America/Sao_Paulo'`; índice de bloqueio | Fuso IANA validado no limite; datas finais inclusivas | Backfill/default e índice na 0053 | Schedules repo |
| `apps/server/src/scheduling/database/drizzle/models/appointment-change-model.ts` | Modify | `appointmentChangeModel` | Adiciona `previous_schedule_id,new_schedule_id` UUID opcionais para mudanças legadas | FKs a `schedules`; novo reschedule grava ambos; constraint exige o par | Migração 0055 | Repo/job |
| `apps/server/src/consultation/database/drizzle/models/consultation-outbox-event-model.ts` | Create | `consultationOutboxEventModel` | Tabela abaixo, envelope sem PII | FK, ID único, índice de pendências | Migração 0053 | Repository/job |
| `apps/server/src/consultation/database/drizzle/models/index.ts` | Modify | export do model de outbox | — | — | — | Drizzle schema/repo |
| `apps/server/src/consultation/database/drizzle/types/entities/drizzle-consultation-outbox-event.ts` | Create | `DrizzleConsultationOutboxEvent` | Inferência do model | Sem `any` | — | Mapper |
| `apps/server/src/consultation/database/drizzle/types/entities/index.ts` | Modify | export row type | — | — | — | Mapper |
| `apps/server/src/consultation/database/drizzle/mappers/drizzle-consultation-outbox-event-mapper.ts` | Create | `DrizzleConsultationOutboxEventMapper` | Payload ISO/IDs e timestamps | Sem perda de dados ou PII | — | Repo/job |
| `apps/server/src/consultation/database/drizzle/mappers/index.ts` | Modify | export do mapper de outbox | — | — | — | DB module |
| `apps/server/src/scheduling/database/drizzle/models/index.ts` | Modify | export change model | — | — | — | Repo |
| `apps/server/src/scheduling/database/drizzle/types/entities/drizzle-appointment-change.ts` | Create | `DrizzleAppointmentChange` | Inferência do model | Sem `any` | — | Mapper |
| `apps/server/src/scheduling/database/drizzle/types/entities/index.ts` | Modify | export row type | — | — | — | Mapper |
| `apps/server/src/scheduling/database/drizzle/mappers/drizzle-appointment-change-mapper.ts` | Create | `DrizzleAppointmentChangeMapper.toDomain` | Timestamps UTC e opcionais; sem perdas | Preserva before/after e publish | — | Repo |
| `apps/server/src/scheduling/database/drizzle/mappers/index.ts` | Modify | export mapper | — | — | — | Repo/module |
| `apps/server/src/scheduling/database/drizzle/repositories/drizzle-appointments-repository.ts` | Modify | `findById,listOverlapping,listChanges,listDistinctFacetIds,filterFacetIdsInScope` | Filtros parametrizados, histórico via mapper | Facetas só de agendas autorizadas, sem join a tabelas de Identidade | Envelope UTC das janelas por agenda; pós-filtro por data local no caso de uso | Use cases |
| `apps/server/src/scheduling/database/drizzle/repositories/drizzle-schedules-repository.ts` | Modify | `findByCollaboratorIdForUpdate` implementado; adicionar `findByIdForUpdate,listByCollaboratorIds,listBlockedPeriods` e mapeador | Usa `timeZone` persistido; datas locais corretas | Inclui agenda histórica/inativa; `FOR UPDATE` na reserva | Índice de bloqueio | Use cases |
| `apps/server/src/shared/database/drizzle/database.module.ts` | Modified | export `DatabaseTransactionContext` | Uma instância para adapters no mesmo processo | Consulta futura adere ao executor ativo | Sem transação duplicada | Scheduling/Consultation |
| `apps/server/src/scheduling/messaging/inngest/jobs/reserve-intake-appointment-job.ts` | Modified | injeta `SchedulingDatabase` | Assinatura de evento preservada | Reserva no callback transacional | Publicação continua após commit | Inngest |
| `apps/server/src/scheduling/database/drizzle/repositories/drizzle-scheduling-database.ts` | Created | `DrizzleSchedulingDatabase.run` | Cria scope de repositórios, sem regras de negócio | Transação SERIALIZABLE, contexto ativo e retry limitado | Reserva já usa; ampliar scope para histórico/outbox | Casos de uso |
| `apps/server/src/scheduling/database/drizzle/repositories/drizzle-appointment-write-transaction-provider.ts` | Create | `DrizzleAppointmentWriteTransactionProvider` | Busca scheduleId, lock agenda → marcação, callback em `SchedulingDatabase.run` | Snapshot mínimo/undefined, sem decidir elegibilidade, retry serializable | Mesmo contexto ativo | ConsultationModule |
| `apps/server/src/scheduling/database/drizzle/repositories/scheduling-database-executor.ts` | Created | `SchedulingDatabaseExecutor` | Executor Drizzle de conexão/transação | Não cruza para Core | `withDatabase` | Repositórios |
| `apps/server/src/shared/database/drizzle/database-transaction-context.ts` | Created | `DatabaseTransactionContext` | Reusa executor ativo em callbacks aninhados | Nunca cria commit próprio | Providers críticos de Consulta aderem ao contexto | SharedDatabaseModule |
| `apps/server/src/scheduling/database/drizzle/repositories/index.ts` | Modified | export `DrizzleSchedulingDatabase` e `DrizzleAppointmentWriteTransactionProvider` | — | — | — | DB module |
| `apps/server/src/scheduling/constants/scheduling-repositories.ts` | Modified | tokens `database`, `appointmentWriteTransactionProvider` | DI | — | — | DB module |
| `apps/server/src/scheduling/database/scheduling-database.module.ts` | Modified | `SharedDatabaseModule`, repositories, database, write provider | Exporta token transacional a Consulta | Sem import de ConsultationModule | — | SchedulingModule/ConsultationModule |
| `apps/server/src/identity/database/drizzle/repositories/drizzle-calendar-identity-provider.ts` | Create | `DrizzleCalendarIdentityProvider` | ID/nome/perfil/ativo; sem ficha completa | Batch; inclui inativos históricos; consulta sem cliente não retorna nome | Leitura própria Identity | IdentityModule exporta token |
| `apps/server/src/identity/database/identity-database.module.ts` | Modify | provider/export | Registra `DrizzleCalendarIdentityProvider` com DB compartilhado | Sem consulta cruzada | DI | IdentityModule |
| `apps/server/src/identity/constants/identity-repositories.ts` | Modify | token `calendarProvider` | DI da projeção | — | — | IdentityDatabaseModule |
| `apps/server/src/consultation/database/drizzle/repositories/drizzle-calendar-consultation-provider.ts` | Create | `DrizzleCalendarConsultationProvider` | ID/status/startedAt por appointment | Batch; leitura sob lock mantido pelo chamador, sem expor conteúdo | Consulta own table | ConsultationModule exporta token |
| `apps/server/src/consultation/database/drizzle/repositories/drizzle-rescheduled-appointment-consultation-provider.ts` | Create | `DrizzleRescheduledAppointmentConsultationProvider` | Atualiza `assigned_lawyer_id` da Consulta pendente por appointmentId usando executor ativo | Falha aborta a transação; não cria nem altera conteúdo jurídico | Consulta own table | ConsultationModule exporta token |
| `apps/server/src/consultation/constants/consultation-repositories.ts` | Modify | token `rescheduledAppointmentProvider` | DI do provider transacional de remarcação | — | — | ConsultationDatabaseModule |
| `apps/server/src/consultation/database/consultation-database.module.ts` | Modify | provider e export | Injeta DatabaseTransactionContext no adapter de remarcação | Sem import de Scheduling; executor compartilhado | DI | ConsultationModule |
| `apps/server/src/consultation/constants/consultation-repositories.ts` | Modify | tokens `calendarProvider`, `outbox` | DI de projeção e persistência de eventos | — | — | ConsultationDatabaseModule |
| `apps/server/src/consultation/database/drizzle/repositories/drizzle-consultations-repository.ts` | Modify | `add`, `replace`, `findById`, `findByIntakeId` existentes | Usa `DatabaseTransactionContext.get()` quando ativo, senão conexão normal; não importa tabela de Agendamento | Leituras/escritas do callback no mesmo executor | Sem efeito externo dentro | Casos de Consulta |
| `apps/server/src/consultation/database/drizzle/repositories/drizzle-consultation-outbox-repository.ts` | Create | `DrizzleConsultationOutboxRepository` | `add/listPending/markPublished` via executor ativo quando presente | Enqueue transacional; lote pendente limitado; markPublished condicional | Migração 0053 | Casos de Consulta/job |
| `apps/server/src/consultation/database/drizzle/repositories/index.ts` | Modify | export do repo de outbox | — | — | — | DB module |
| `apps/server/src/consultation/database/consultation-database.module.ts` | Modify | repository/provider/outbox | Injeta contexto compartilhado nos repos; exporta projection provider e outbox | Sem import de Scheduling, sem ciclo | DI | ConsultationModule/MessagingModule |
| `apps/server/src/shared/database/drizzle/migrations/0053_appointment_calendar_history.sql` | Generate | Migração de fuso/índices/histórico e outbox da Consulta | Tabelas abaixo | Compatibilidade de dados existentes | Já entregue; preservar sem reescrever | DB deploy |
| `apps/server/src/shared/database/drizzle/migrations/0055_faulty_red_hulk.sql` | Generate | Colunas/FKs de agenda anterior e nova no histórico | Duas colunas UUID nullable para compatibilidade legada | FK RESTRICT; pares nulos para legado/cancelamento ou preenchidos para remarcação | Gerar, revisar e registrar no journal; não reescrever migração aplicada | DB deploy |
| `apps/server/src/shared/database/drizzle/migrations/meta/0053_snapshot.json` | Generate | Snapshot Drizzle da migração | Estado de modelos resultante | Gerado, sem edição manual | `db:migration:generate` | journal/migrate |
| `apps/server/src/shared/database/drizzle/migrations/meta/_journal.json` | Generate | entrada 0053 | Versão sequencial | Não editar manualmente fora do fluxo de migração | `pnpm --filter server db:migration:generate`; ajustar nome gerado/journal juntos | migrate |
| `apps/server/src/scheduling/database/drizzle/repositories/tests/scheduling-database.test.ts` | Remove | Teste direto do adapter | Cobertura deslocada para os fluxos HTTP com banco real | Sem testes de repositório/adapter conforme Database Rule | — | Controller integration |

### Migration data model — `schedules` (delta)

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `time_zone` | `text` | No | `America/Sao_Paulo` | Fuso IANA da agenda; backfill das linhas legadas com o default do mapper atual. |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `schedules_collaborator_id_unique` | `collaborator_id` | existente, unique | Uma agenda por profissional. |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| `schedules_time_zone_nonempty_check` | CHECK | `length(time_zone)>0` | Impedir fuso vazio; validação IANA fica na entrada. |

### Migration data model — `appointments` (delta)

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `id, intake_id, schedule_id, client_id, starts_at, ends_at, status, cancelled_at, created_at, updated_at` | existentes | como hoje | como hoje | Nenhuma coluna removida ou reinterpretada; preservar vínculos/horários. |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `appointments_schedule_period_idx` | `schedule_id,starts_at,ends_at` | btree | Janela e overlap. |
| `appointments_intake_id_uq` | `intake_id` | existente, unique | Idempotência da reserva. |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| `appointments_status_check`, `appointments_period_check` | CHECK existentes | status permitido e fim > início | Integridade preservada. |

### Migration data model — `blocked_periods` (delta)

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `id,schedule_id,start_date,end_date,description,created_at` | existentes | como hoje | como hoje | Mapeamento por datas locais preservado. |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `blocked_periods_schedule_period_idx` | `schedule_id,start_date,end_date` | btree | Busca de bloqueios por agenda/período. |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| FK de `schedule_id` | FK existente | `schedules.id` | Sem bloqueio órfão. |

### Migration data model — `appointment_changes` (nova tabela)

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | uuid | No | gerado na aplicação | ID do fato/outbox. |
| `appointment_id` | uuid | No | — | Agendamento alterado. |
| `kind` | text | No | — | `cancelled` ou `rescheduled`. |
| `actor_id` | uuid | No | — | Colaborador responsável. |
| `occurred_at` | timestamptz | No | — | Instante da ação. |
| `previous_schedule_id,new_schedule_id` | uuid cada | Yes para linhas legadas; ambos presentes em novas remarcações | Agenda/advogado anterior e novo; nulos para cancelamento. |
| `previous_starts_at,previous_ends_at` | timestamptz cada | No | — | Horário anterior. |
| `new_starts_at,new_ends_at` | timestamptz cada | Yes | null | Novo horário apenas na remarcação. |
| `previous_revision,resulting_revision` | timestamptz cada | No | — | Revisões antes/depois. |
| `published_at` | timestamptz | Yes | null | Publicação de fato concluída. |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `appointment_changes_appointment_occurrence_idx` | `appointment_id,occurred_at,id` | btree | Histórico ordenado. |
| `appointment_changes_pending_idx` | `occurred_at,id` WHERE `published_at IS NULL` | partial btree | Dispatcher. |
| `appointment_changes_revision_uq` | `appointment_id,previous_revision,kind` | unique | Retry sem duplicar registro. |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| `appointment_changes_appointment_fk` | FK | `appointment_id -> appointments.id` RESTRICT | Histórico não removível em cascata. |
| `appointment_changes_kind_check` | CHECK | dois valores permitidos | Tipo válido. |
| `appointment_changes_period_check` | CHECK | novo início/fim ambos nulos se cancelado; ambos presentes e `new_ends_at>new_starts_at` se remarcado | Forma histórica coerente. |
| `appointment_changes_schedule_pair_check` | CHECK | agenda anterior/nova são ambas nulas ou ambas presentes | Transferência rastreável, preservando registros legados. |
| `appointment_changes_revision_check` | CHECK | `resulting_revision>previous_revision` | Revisão monotônica. |

### Migration data model — `consultation_outbox_events` (nova tabela)

| Column | Type | Nullable | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | uuid | No | gerado na aplicação | ID estável de envio/reenvio. |
| `consultation_id` | uuid | No | — | Consulta cujo estado mudou. |
| `name` | text | No | — | Nome `_NAME` existente de conclusão ou contexto jurídico. |
| `payload` | jsonb | No | — | IDs e instante ISO do evento, sem ficha ou PII. |
| `occurred_at` | timestamptz | No | — | Instante da transição. |
| `published_at` | timestamptz | Yes | null | Aceite do broker. |

| Index name | Columns | Type | Purpose |
| --- | --- | --- | --- |
| `consultation_outbox_pending_idx` | `occurred_at,id` WHERE `published_at IS NULL` | partial btree | Busca paginada das pendências. |
| `consultation_outbox_consultation_occurrence_idx` | `consultation_id,occurred_at,id` | btree | Auditoria e deduplicação observável. |

| Constraint | Type | Definition | Purpose |
| --- | --- | --- | --- |
| `consultation_outbox_consultation_fk` | FK | `consultation_id -> consultations.id` RESTRICT | Impede evento órfão. |
| `consultation_outbox_name_check` | CHECK | somente os dois nomes `_NAME` de Consulta listados | Impede publicação inesperada. |
| `consultation_outbox_payload_check` | CHECK | `jsonb_typeof(payload)='object'` | Envelope estrutural; validação completa fica no schema do evento. |

O insert do envelope ocorre pelo mesmo `DatabaseTransactionContext` do write de Consulta, sem transação aninhada; uma falha de insert desfaz a transição. `published_at` é alterado apenas pelo job após aceitação. O gerador Drizzle inclui esta tabela no mesmo número sequencial da migração da Agenda, por dependência de entrega; a tabela continua pertencendo ao módulo de Consulta.

**Cross-database notes.** O contrato transacional usa lock de linha PostgreSQL `FOR UPDATE` na agenda e depois na marcação; não presume portabilidade desse detalhe. `timestamp with time zone` guarda instantes; bloqueios legados são interpretados como datas locais via mapeamento explícito e testados em borda de fuso. O controle do app é de uma instalação sem coluna de tenant; nenhum filtro de tenant fictício deve ser acrescentado.

A revisão resultante deve ser monotônica mesmo com duas ações no mesmo milissegundo: usar instante persistido estritamente posterior a `previousRevision` e à hora atual do provider, sob lock. O mesmo valor é escrito em `appointments.updated_at` e `appointment_changes.resulting_revision`. Consultas de histórico usam `occurred_at,id` para ordem estável.

**Migration delivery.** A migração inicial 0053 já está no worktree. Gerar a extensão a partir dos modelos com `pnpm --filter server db:migration:generate`, revisar o SQL produzido e registrar a migração gerada `0055_faulty_red_hulk.sql` e `meta/0055_snapshot.json` com journal correspondente; 0054 já foi consumida pelo outbox da Consulta. Preservar todas as linhas legadas: `previous_schedule_id` e `new_schedule_id` são nulos em mudanças antigas e cancelamentos; ambos são escritos em novas remarcações. O deploy do esquema precede os escritores atualizados. Não alterar migrações anteriores. Se o journal corrente indicar outro número, usar o próximo número real sem sobrescrever migração existente.

## apps/server — Messaging

| Event | Publisher | Trigger/consumer | Payload authority | Durable steps/side effects | Registration/reliability |
| --- | --- | --- | --- | --- | --- |
| `AppointmentCancelledEvent._NAME` | Linha `appointment_changes` confirmada | `PublishAppointmentChangeJob` → consumidores internos | Agendamento, change ID e IDs/horário/ator | `publish-appointment-change`, marca `publishedAt` após aceitação | Cron/registro único, retry/idempotência |
| `AppointmentRescheduledEvent._NAME` | Idem | Idem | Mesmo fato com antes/depois | Mesmo step | Mesmo contrato |
| `ConsultationCompletedEvent._NAME` | Linha `consultation_outbox_events` no commit de conclusão | `PublishConsultationEventJob` → `CompleteIntakeAfterConsultationJob` existente | Consulta, envelope com ID estável e payload atual | Envio após commit; Intake idempotente no estado concluído | Cron registrado em `CONSULTATION_INNGEST_FUNCTIONS`, retry |
| `ConsultationLegalContextUpdatedEvent._NAME` | Linha `consultation_outbox_events` no commit de contexto alterado | `PublishConsultationEventJob` → `SyncIntakeLegalContextJob` existente | Consulta, envelope com ID estável e payload atual | Envio após commit; Intake idempotente no contexto igual | Mesmo cron/registro |

| Path | Change | Declaration | Event/trigger/payload | Reliability/steps | Lifecycle/registration | Producers/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/scheduling/messaging/inngest/jobs/publish-appointment-change-job.ts` | Create | `PublishAppointmentChangeJob.function` | Cron curto; `appointmentChangeEventSchema`, datas ISO | Lê lote pendente sem manter transação durante envio; usa change ID estável para dedup, marca publicado depois da aceitação; consumidores toleram redelivery | Inngest único | Histórico → áreas assinantes |
| `apps/server/src/consultation/messaging/inngest/jobs/create-consultation-from-appointment-job.ts` | Modify | `CreateConsultationFromAppointmentJob` | Evento de reserva existente | Cancelado antes do processamento vira no-op sem `ConsultationCreatedEvent`; retry não duplica | Job existente | Consulta/Intake |
| `apps/server/src/consultation/messaging/inngest/jobs/publish-consultation-event-job.ts` | Create | `PublishConsultationEventJob.function` | Cron curto; os dois `_NAME` e seus schemas de payload atuais | Lê lote pendente, `event.id=outbox.id`, marca publicado somente após aceite; redelivery tolerado pelos jobs de Intake | Grupo Inngest da Consulta, sem segundo endpoint | `ConsultationOutboxRepository`/Intake |
| `apps/server/src/consultation/messaging/inngest/jobs/tests/publish-consultation-event-job.test.ts` | Create | publicação/retry de outbox | Evento de conclusão/contexto, ID/ISO | Falha preserva pendência; aceite marca; reenvio usa mesmo ID | Fixture Inngest | Vitest |
| `apps/server/src/consultation/messaging/inngest/jobs/index.ts` | Modify | export novo job | — | — | registry | module |
| `apps/server/src/consultation/messaging/consultation-messaging.module.ts` | Modify | `CONSULTATION_INNGEST_FUNCTIONS` | Registra publisher junto ao job existente | Uma única entrada por cron | Bootstrap único | app.module existente |
| `apps/server/src/scheduling/messaging/inngest/jobs/index.ts` | Modify | export novo job | — | — | registry | module |
| `apps/server/src/scheduling/messaging/scheduling-messaging.module.ts` | Modify | `SCHEDULING_INNGEST_FUNCTIONS` | Adiciona job ao grupo existente | Sem segundo endpoint Inngest | Bootstrap único | app.module existente |
| `apps/server/src/scheduling/messaging/inngest/jobs/tests/publish-appointment-change-job.test.ts` | Create | retry/publicação | Change ID/ISO, agenda origem/destino | Sem duplicata, marcação após aceite e payload com agendas anterior/nova | Fixture Inngest | Vitest |

O job junta cada linha pendente ao Agendamento para obter o `clientId`. O evento cancelado carrega `changeId,appointmentId,scheduleId,clientId,actorId,startsAt,endsAt,cancelledAt`; o remarcado carrega `changeId,appointmentId,previousScheduleId,newScheduleId,clientId,actorId,previousStartsAt,previousEndsAt,newStartsAt,newEndsAt,rescheduledAt`. Todos os IDs são UUID e os instantes são serializados como ISO UTC antes de `sendEvent`. Falha após aceite e antes de marcar `publishedAt` pode redeliver; o identificador estável e consumidores idempotentes impedem efeito duplo. A entrega de mensagem ao cliente permanece fora deste escopo.

## apps/web — UI

| Widget | Kind | Parent/entry | Direct children | Public contract | Behavior owner |
| --- | --- | --- | --- | --- | --- |
| `AppointmentsPage` | Page | `/agenda/consultas` | `CalendarToolbar`, `WeekCalendar`, `MonthCalendar`, `MobileDayList`, `CalendarFeedback`, `AppointmentDetailsDialog`, `ClientFilterDialog`, `DayEventsDialog` | `AppointmentsPageProps` sem dados externos; agenda e orquestração | `useAppointmentsPage` |
| `CalendarToolbar` | Component | `AppointmentsPage` | — | `CalendarToolbarProps`: período, filtros, callbacks | `useCalendarToolbar` |
| `WeekCalendar` | Component | `AppointmentsPage` | `AppointmentCard` | `WeekCalendarProps`: dias/eventos, abrir card | `useWeekCalendar` |
| `MonthCalendar` | Component | `AppointmentsPage` | `AppointmentCard` | `MonthCalendarProps`: semanas/eventos, abrir dia/card | `useMonthCalendar` |
| `MobileDayList` | Component | `AppointmentsPage` | `AppointmentCard` | `MobileDayListProps`: dias/eventos | `useMobileDayList` |
| `AppointmentCard` | Component | Calendários/lista móvel | — | `AppointmentCardProps`: evento, acionamento | Render puro, sem hook |
| `CalendarFeedback` | Component | `AppointmentsPage` | — | `CalendarFeedbackProps`: loading/empty/filtered/error/forbidden/retry | Render puro, sem hook |
| `DayEventsDialog` | Component | `AppointmentsPage` | `AppointmentCard` | `DayEventsDialogProps`: dia/eventos/fechar | `useDayEventsDialog` |
| `ClientFilterDialog` | Component | `AppointmentsPage` | — | `ClientFilterDialogProps`: selecionado/aplicar/fechar | `useClientFilterDialog` |
| `AppointmentDetailsDialog` | Component | `AppointmentsPage` | `CancelAppointmentDialog`, `RescheduleAppointmentDialog` | `AppointmentDetailsDialogProps`: ID/fechar | `useAppointmentDetailsDialog` |
| `CancelAppointmentDialog` | Component | `AppointmentDetailsDialog` | — | `CancelAppointmentDialogProps`: detalhe/fechar/sucesso | `useCancelAppointmentDialog` |
| `RescheduleAppointmentDialog` | Component | `AppointmentDetailsDialog` | — | `RescheduleAppointmentDialogProps`: detalhe/advogados ativos/fechar/sucesso | `useRescheduleAppointmentDialog` |

| Path | Change | Declaration/surface | Widget/role | State/actions contract | Async/failure contract | Design/responsive/accessibility | Dependencies/tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/src/routes/agenda/consultas.tsx` | Create | thin `Route` | route | `validateSearch(calendarSearchSchema)`; render Page | SSR false from parent; auth parent | Page hook normaliza `date` ausente para Hoje de São Paulo e atualiza URL | Page/route test |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/index.tsx` | Create | `AppointmentsPage` | Page renderer | Compõe filhos, DOM callbacks | Não busca dados diretamente | Pencil 1417/1200, mobile 390; landmark/main | page hook/tests |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/use-appointments-page.ts` | Create | `useAppointmentsPage` | Page hook | URL view/date/filtros, diálogo selecionado, datas civis da grade, eventos; “Hoje” calcula a data atual em `America/Sao_Paulo` a cada ação; Admin normaliza filtro `blocked` para `all` | Usa query/ação, invalida/refaz; estados | Restaurar foco e scroll previsível | route/query hooks |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/index.tsx` | Create | `CalendarToolbar` | Component renderer | Tabs Semana/Mês, setas, Hoje, seletores, limpar; filtro Bloqueios ausente para Admin | Botões disabled só quando necessário | e9hQ5V/aDlqK; teclado/labels | Page/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/use-calendar-toolbar.ts` | Create | `useCalendarToolbar` | Component hook | Formata intervalo e delega alterações ao pai | Sem fetch | Não perde filtros | Page |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/index.tsx` | Create | `WeekCalendar` | Component renderer | Grade, faixa de bloqueios, cards | — | e9hQ5V; dias locais por agenda e rótulo de fuso | Page/Card/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/use-week-calendar.ts` | Create | `useWeekCalendar` | Component hook | Agrupa/ordena eventos por dia e faixa horária; semana domingo–sábado | Sem fetch | Limita elementos sem esconder acesso | Page |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/index.tsx` | Create | `MonthCalendar` | Component renderer | Grade gregoriana e `+N` clicável | — | aDlqK; sem copiar datas fictícias | Page/Card/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/use-month-calendar.ts` | Create | `useMonthCalendar` | Component hook | Calcula grade civil de domingos a sábados, até 42 dias, overflow e callbacks | Sem fetch | `+N` botão com nome acessível | Page |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/index.tsx` | Create | `MobileDayList` | Component renderer | Lista agrupada por dia | — | 390 × 844, sem rolagem horizontal | Page/Card/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/use-mobile-day-list.ts` | Create | `useMobileDayList` | Component hook | Agrupa, ordena e mantém bloqueios por dia | Sem fetch | Datas textuais | Page |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-card/index.tsx` | Create | `AppointmentCard` | Component puro | Nome, início–fim, texto de status; bloqueio diferenciado | — | e9hQ5V/aDlqK; `button` para marcação, sem cor isolada | Calendários |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-feedback/index.tsx` | Create | `CalendarFeedback` | Component puro | Variante e retry; vazio geral ≠ zero filtrado ≠ proibido | Erro preservado sem PII | Tokens HMS, `role=alert/status` | Page |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/index.tsx` | Create | `DayEventsDialog` | Component renderer | Todos os eventos do dia | — | aDlqK; focus trap/return | Page/Card/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/use-day-events-dialog.ts` | Create | `useDayEventsDialog` | Component hook | Estado de abertura/foco local | — | Escape/fechar | Page |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/index.tsx` | Create | `ClientFilterDialog` | Component renderer | Busca/seleção única/aplicar/limpar | Loading/zero/erro de opções | c7tlDG; CPF mascarado só se autorizado | Page/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/use-client-filter-dialog.ts` | Create | `useClientFilterDialog` | Component hook | Texto/seleção controlados localmente; `calendarOptionsQuerySchema` limita busca; aplicar atualiza `calendarSearchSchema` da rota | Busca debounced em escopo; `items: []` com nextCursor mantém loading e busca próxima página; vazio só no fim; preserva escolha em falha | Foco e rolagem no diálogo | Filter-options hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/index.tsx` | Create | `AppointmentDetailsDialog` | Component renderer | Resumo/histórico/link Consulta, filhos de escrita condicionais | Loading/404/403/erro | gQg7t; foco/fechar | details query/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/use-appointment-details-dialog.ts` | Create | `useAppointmentDetailsDialog` | Component hook | Estado de subdiálogos, permissões derivadas e navegação | Recarrega ao mudar ID; guarda stale | Link só se acesso permitido | details query/actions |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/index.tsx` | Create | `CancelAppointmentDialog` | Component renderer | Consequência, manter/confirmar | Pending/erro/sucesso | KIhkn, AlertDialog destrutivo | parent/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/use-cancel-appointment-dialog.ts` | Create | `useCancelAppointmentDialog` | Component hook | Submissão única com revisão | 409 recarrega e preserva contexto | Foco retorna ao detalhe | actions hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/index.tsx` | Modify | `RescheduleAppointmentDialog` | Component renderer | Composição próxima a yVAoI: cliente/status; cartão do horário atual; seletor de advogado; data, slots e duração/fuso; resumo antes/depois com profissional; slots sempre formatados no `timeZone` retornado pela agenda de destino; confirmar | Pending/conflict/empty/error; opções limitadas a advogados ativos e estados acessíveis | yVAoI 600 × 834; adaptação rolável em 390 × 844, tokens HMS e foco restaurado | parent/hook |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/use-reschedule-appointment-dialog.ts` | Modify | `useRescheduleAppointmentDialog` | Component hook | RHF + `appointmentChangeSchema`, seleção `lawyerId`, data e slot; slots dependem de data/profissional; busca páginas ativas via `identityService.listActiveCollaborators({profile: lawyer})` | Revalidação server; preserva seleção em 409; troca advogado invalida slot selecionado | Teclado para seletor e slots; foco e recuperação | actions/slot/filter hooks |
| `apps/web/src/ui/scheduling/hooks/use-calendar-query.ts` | Create | `useCalendarQuery` | feature query hook | Query key view/data civil/filtros, `listCalendar` | Loading/refetch/error; não exibe stale de outro escopo | — | Page/service; rota real com HTTP mockado |
| `apps/web/src/ui/scheduling/hooks/use-appointment-details-query.ts` | Create | `useAppointmentDetailsQuery` | feature query hook | `getAppointmentDetails` por ID | 404/403/error separados | — | Details/service |
| `apps/web/src/ui/scheduling/hooks/use-appointment-actions.ts` | Create | `useAppointmentActions` | feature action hook | `cancelAppointment`, `rescheduleAppointment`; invalida calendar/detail/slots | Status e recovery sem optimistic edit | — | Dialogs/service |
| `apps/web/src/ui/scheduling/hooks/use-reschedule-slots.ts` | Create | `useRescheduleSlots` | feature query hook | `listRescheduleSlots` por appointment/data | Loading/zero/409/erro sem reservar | — | Reschedule dialog/service |
| `apps/web/src/ui/scheduling/hooks/use-calendar-filter-options.ts` | Create | `useCalendarFilterOptions` | feature query hook | Obtém opções de clientes/advogados somente do universo autorizado | Consome páginas vazias intermediárias enquanto houver nextCursor; busca paginada/debounced e erro | — | Toolbar/client dialog |
| `apps/web/src/constants/routes.ts` | Modify | `ROUTES.appointmentsCalendar` | route constant | `/agenda/consultas` | — | Link estável | sidebar/navigation |
| `apps/web/src/constants/sidebar-items.ts` | Modify | item Agenda de Consultas | sidebar config | Adiciona aos cinco perfis de leitura; não ao cliente/estagiário; mantém Minha Agenda | — | Ícone e nome acessíveis | AppLayout tests |
| `apps/web/src/routeTree.gen.ts` | Generate | rota compilada | generated | Fonte `routes/agenda/consultas.tsx` | — | `pnpm --filter web generate-routes`; não editar manualmente | Router |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/tests/appointments-page.test.tsx` | Create | página composta | widget test | Widgets/filtros/estados | Retry/teclado | Design/390 × 844 | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/tests/use-appointments-page.test.ts` | Create | hook dono da página | hook test | URL/período/estado selecionado | Loading/erro/refetch mapeados ao usuário | Mocks dos hooks de domínio | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/tests/calendar-toolbar.test.tsx` | Create | `CalendarToolbar` | widget test | Navegação, visão, filtros e limpar | Delegação ao hook dono e semântica acessível | Desktop/mobile conforme widget | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/tests/use-calendar-toolbar.test.ts` | Create | `useCalendarToolbar` | owning hook test | Intervalo/URL sem perder filtros | Estado/falha/recuperação do widget | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/tests/week-calendar.test.tsx` | Create | `WeekCalendar` | widget test | Grade semanal, bloqueios e cards | Delegação ao hook dono e semântica acessível | Desktop/mobile conforme widget | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/tests/use-week-calendar.test.ts` | Create | `useWeekCalendar` | owning hook test | Agrupamento local, clique e overflow | Estado/falha/recuperação do widget | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/tests/month-calendar.test.tsx` | Create | `MonthCalendar` | widget test | Grade mensal e +N | Delegação ao hook dono e semântica acessível | Desktop/mobile conforme widget | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/tests/use-month-calendar.test.ts` | Create | `useMonthCalendar` | owning hook test | Semanas reais, agrupamento local e overflow | Estado/falha/recuperação do widget | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/tests/mobile-day-list.test.tsx` | Create | `MobileDayList` | widget test | Lista diária responsiva | Delegação ao hook dono e semântica acessível | Desktop/mobile conforme widget | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/tests/use-mobile-day-list.test.ts` | Create | `useMobileDayList` | owning hook test | Agrupamento, ordem, bloqueios e acesso a todos | Estado/falha/recuperação do widget | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/tests/day-events-dialog.test.tsx` | Create | `DayEventsDialog` | widget test | Eventos excedentes e foco | Delegação ao hook dono e semântica acessível | Desktop/mobile conforme widget | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/tests/use-day-events-dialog.test.ts` | Create | `useDayEventsDialog` | owning hook test | Abertura, Escape, foco e seleção | Estado/falha/recuperação do widget | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/tests/client-filter-dialog.test.tsx` | Create | `ClientFilterDialog` | widget test | Busca, seleção e aplicar | Delegação ao hook dono e semântica acessível | Desktop/mobile conforme widget | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/tests/use-client-filter-dialog.test.ts` | Create | `useClientFilterDialog` | owning hook test | Debounce, página vazia com cursor, loading/zero terminal/erro e recovery | Estado/falha/recuperação do widget | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/tests/appointment-details-dialog.test.tsx` | Create | `AppointmentDetailsDialog` | widget test | Resumo, histórico, link e ações por papel | Loading/403/404/erro | gQg7t/foco | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/tests/use-appointment-details-dialog.test.ts` | Create | `useAppointmentDetailsDialog` | owning hook test | ID selecionado, permissões e subdiálogos | Recarrega sem stale; foco | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/tests/cancel-appointment-dialog.test.tsx` | Create | `CancelAppointmentDialog` | widget test | Confirmação, pending e falha visíveis | Não duplica ação | KIhkn/foco | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/tests/use-cancel-appointment-dialog.test.ts` | Create | `useCancelAppointmentDialog` | owning hook test | Submissão/revisão/409 | Preserva contexto e recupera | — | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/tests/reschedule-appointment-dialog.test.tsx` | Create | `RescheduleAppointmentDialog` | widget test | Data, slots, resumo e confirmação | Empty/pending/conflict/error | yVAoI/390 × 844 | Vitest |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/tests/use-reschedule-appointment-dialog.test.ts` | Create | `useRescheduleAppointmentDialog` | owning hook test | RHF, slot, data, revisão | Preserva seleção em 409 | — | Vitest |
| `apps/web/tests/routes/agenda/consultas.test.ts` | Create | rota com hooks reais e HTTP mockado | route test | Search, queries e mutações reais no cliente | Request/query/body, cache/refetch e UI sem stale de outro escopo | 390 × 844 | Playwright CLI |

**UI file/widget tree.** Cada linha abaixo é um caminho relativo ao repositório; o recuo mostra o widget pai, sem transferir a propriedade do estado ao filho.

```text
apps/web/src/routes/agenda/consultas.tsx — route → AppointmentsPage
apps/web/src/ui/scheduling/widgets/pages/appointments-page/index.tsx — Page
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/use-appointments-page.ts — Page hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/use-calendar-toolbar.ts — hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/use-week-calendar.ts — hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/use-month-calendar.ts — hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/use-mobile-day-list.ts — hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-card/index.tsx — pure Component shared by three calendars
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-feedback/index.tsx — pure Component
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/use-day-events-dialog.ts — hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/use-client-filter-dialog.ts — hook
  apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/index.tsx — Component
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/use-appointment-details-dialog.ts — hook
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/index.tsx — Component
      apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/use-cancel-appointment-dialog.ts — hook
    apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/index.tsx — Component
      apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/use-reschedule-appointment-dialog.ts — hook
apps/web/src/ui/scheduling/hooks/use-calendar-query.ts — feature query
apps/web/src/ui/scheduling/hooks/use-appointment-details-query.ts — feature query
apps/web/src/ui/scheduling/hooks/use-calendar-filter-options.ts — feature query
apps/web/src/ui/scheduling/hooks/use-reschedule-slots.ts — feature query
apps/web/src/ui/scheduling/hooks/use-appointment-actions.ts — feature action
```

O escopo de escrita dos Builders é o conjunto exato de caminhos `Create/Modify/Generate/Remove` nas tabelas de camada, mais os artefatos de testes listados; cada módulo conserva a propriedade indicada. Caminhos proibidos como fonte de atalho: `design/hms.pen` por shell, `apps/web/src/rest/services/consultation-service.ts` para simular as ações, o PRD antigo e a edição manual de `routeTree.gen.ts`/snapshot. A saída de validação de cada Builder é o teste de seu boundary, typecheck/lint do workspace e ausência de import transversal indevido; a saída integrada exige os CA/MV da seção 4 e registro em evaluation.md.

Cada widget com hook mantém `index.tsx` restrito a renderização e ligação DOM; seu `use-*.ts` possui estado/derivações/efeitos. `AppointmentCard` e `CalendarFeedback` são renderizadores puros, portanto dispensam hook. O `AppLayout` e o layout de `/agenda` existentes permanecem donos da estrutura/guarda/SSR. O cliente só enxerga ação quando o servidor também a permite.

## apps/server and apps/web — Composition

| Composition boundary | Kind/scope | Imports/dependencies | Provides/exports | Consumers | Lifecycle/order |
| --- | --- | --- | --- | --- | --- |
| `SchedulingModule` | Feature module | DB, Identity, Consulta, Mensageria, Provision | Casos/REST; provider transacional exportado pelo DB | `AppModule` | Bootstrap depois de providers |
| `IdentityModule`/`ConsultationModule` | Feature exports | Adapters próprios; ConsultationModule importa SchedulingDatabaseModule | Providers de projeção; Consulta consome provider transacional de Agendamento | SchedulingModule | Sem dependência de tabelas cruzadas ou ciclo de módulos |
| `RestContextProvider` | Web provider | `SchedulingService` existente | Métodos ampliados | Hooks | Sessão atual |

| Path | Change | Declaration | Wiring/configuration | Lifecycle/order | Connected contracts | Generation/consumers |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/server/src/scheduling/scheduling.module.ts` | Create | `SchedulingModule` | Controllers, casos, DB, Identity, Consulta, Messaging, Provision | Um módulo raiz de feature | Ports por token; sem ciclos | AppModule |
| `apps/server/src/scheduling/database/drizzle/repositories/scheduling.module.ts` | Remove | módulo legado deslocado | Substituído pelo módulo correto | — | — | app.module import troca |
| `apps/server/src/identity/identity.module.ts` | Modify | export do `CalendarIdentityProvider` | Provider do módulo dono | — | Port Scheduling | SchedulingModule |
| `apps/server/src/consultation/consultation.module.ts` | Modify | export do `CalendarConsultationProvider`; GET de Consulta com ator e outbox injetados | Provider/handlers do módulo dono | — | Port Scheduling, outbox e autorização Consulta | SchedulingModule |
| `apps/server/src/app.module.ts` | Modify | import `SchedulingModule` | Troca caminho; grupo Inngest existente continua único | Sem segundo endpoint | REST/messaging | Bootstrap |

O provider web `apps/web/src/ui/shared/contexts/rest-context/use-rest-context-provider.ts` já instancia `SchedulingService` e não precisa mudar: os métodos novos ficam no mesmo objeto e `RestContextValue` usa `ReturnType`. As rotas de Consulta existentes são consumidoras do link, não donas de cancelamento/remarcação. Não modificar o serviço legado de Consulta para simular sucesso.

## Technical decisions

| Decision | Chosen approach | Alternative considered | Reason | Accepted trade-off |
| --- | --- | --- | --- | --- |
| URL da nova página | `/agenda/consultas`, mantendo `/agenda` | Substituir `/agenda` | Preserva configuração operacional existente e permite navegação clara | Duas entradas de agenda na navegação |
| Histórico e publicação | Uma tabela imutável de mudanças também atua como outbox | Emitir Inngest diretamente após PATCH | Falha do broker não perde fato confirmado | Polling e índice pendente |
| Conflito de horários | Lock transacional por agenda + revisão otimista; reserva participa | Check de overlap fora de transação | Evita dupla ocupação sob concorrência real | Dependência de PostgreSQL |
| Coordenação transacional | `SchedulingDatabase.run` entrega repositórios vinculados à transação; `AppointmentWriteTransactionProvider` compartilha lock/executor com Consulta; casos de uso decidem regras | Adapter com métodos `cancel/reschedule/reserve` | Espelha o padrão MRP de Scoops e evita decisão de elegibilidade no adapter | Scope precisa crescer quando histórico/outbox forem implementados |
| Opções de filtro | Facetas paginadas derivadas só de agendamentos visíveis; varrer páginas de candidatos até preencher página visível ou terminar | Reusar lista global de clientes/advogados ativos | Evita vazamento/falso vazio e inclui advogado inativo histórico | Cursor vinculado ao ator/busca e varredura limitada |
| Consulta completa | Admin e advogado responsável podem ler a ficha; demais leitores da agenda recebem apenas projeção mínima | Tratar todo leitor da agenda como leitor jurídico | Alinha-se ao PRD Consulta e à decisão já registrada na Spec de documentos da Consulta | GET por ID e Intake existentes precisam de autorização no servidor |
| Eventos de Consulta | Outbox do módulo de Consulta no mesmo commit da conclusão/finalização | Publicar pelo broker após commit sem registro durável | Falha de publicação não perde evento nem reverte transição concluída | Tabela, job e migração adicionais |

# 4. Validation Contract

Testes de widget/rota com page.route são cobertura isolada, não prova de integração REST/Auth. Testes de controller devem usar HTTP real e PostgreSQL segundo as Rules; a passagem autenticada final usa serviços locais reais e Playwright CLI. O repositório não possui script test em @hms/validation nem test:e2e em server; schemas são exercitados pelos consumidores e typecheck.

| Test file | Test type | Target | Coverage goal |
| --- | --- | --- | --- |
| packages/validation/src/scheduling/schemas/tests/appointment-change-schema.test.ts | unit | Reschedule/cancel validation schemas | Existing input shape and malformed instant behavior |
| packages/validation/src/scheduling/schemas/tests/calendar-options-query-schema.test.ts | unit | Reschedule slot query schema | Local date parsing; optional lawyerId remains syntactic UUID only |
| packages/validation/src/scheduling/schemas/tests/appointment-change-event-schema.test.ts | unit | Appointment change event schema | Discriminated cancel/reschedule envelopes; cancellation scheduleId and reschedule previous/new schedule IDs |
| packages/core/src/scheduling/domain/use-cases/tests/list-calendar-use-case.test.ts | unit | ListCalendarUseCase | Período, fuso, bloqueios, estado e escopo, Admin sem bloqueios e advogado vendo os próprios |
| packages/core/src/scheduling/domain/use-cases/tests/list-calendar-filter-options-use-case.test.ts | unit | ListCalendarFilterOptionsUseCase | Paginação visível, cursor e ausência de falso vazio |
| packages/core/src/scheduling/domain/use-cases/tests/get-appointment-details-use-case.test.ts | unit | GetAppointmentDetailsUseCase | Acesso por ID, Consulta opcional, histórico/404 |
| packages/core/src/scheduling/domain/use-cases/tests/cancel-appointment-use-case.test.ts | unit | CancelAppointmentUseCase | Papel, estado, revisão, idempotência |
| packages/core/src/scheduling/domain/use-cases/tests/reschedule-appointment-use-case.test.ts | unit | RescheduleAppointmentUseCase | Mesmo/outro advogado ativo, sincronização da Consulta e duração; passado/bloqueio/overlap/advogado inativo/sem agenda |
| packages/core/src/scheduling/domain/use-cases/tests/list-reschedule-slots-use-case.test.ts | unit | ListRescheduleSlotsUseCase | Slots elegíveis sem reserva |
| packages/core/src/scheduling/domain/use-cases/tests/authorize-schedule-access-use-case.test.ts | unit | AuthorizeScheduleAccessUseCase | Admin/advogado próprio/outros |
| packages/core/src/scheduling/domain/use-cases/tests/check-appointment-availability-use-case.test.ts | unit | CheckAppointmentAvailabilityUseCase | Semana local, duração integral, bloqueio inclusivo, overlap e exclusão da própria marcação |
| packages/core/src/scheduling/domain/use-cases/tests/reserve-intake-appointment-use-case.test.ts | unit, Modify | ReserveIntakeAppointmentUseCase | Reserva partilha lock e mantém retry por Intake |
| packages/core/src/consultation/use-cases/tests/complete-consultation-use-case.test.ts | unit | CompleteConsultationUseCase | Conclusão só com horário ativo |
| packages/core/src/consultation/use-cases/tests/finalize-consultation-attendance-use-case.test.ts | unit, Modify | FinalizeConsultationAttendanceUseCase | Ficha não finaliza com horário cancelado |
| packages/core/src/consultation/use-cases/tests/create-consultation-from-appointment-use-case.test.ts | unit, Modify | CreateConsultationFromAppointmentUseCase | Evento reservado atrasado não cria Consulta após cancelamento |
| packages/core/src/consultation/use-cases/tests/get-consultation-use-case.test.ts | unit, Modify | GetConsultationUseCase | Admin e advogado responsável recebem ficha; demais 404 |
| packages/core/src/consultation/use-cases/tests/get-consultation-by-intake-use-case.test.ts | unit | GetConsultationByIntakeUseCase | Mesmo controle de acesso pelo Intake |
| apps/server/src/scheduling/rest/controllers/tests/calendar-read.controller.test.ts | integration | GET calendar/detail/filters | Auth, 400/403/404, perfis/privacidade, dados reais |
| apps/server/src/scheduling/rest/controllers/tests/appointment-actions.controller.test.ts | integration | PATCH cancel/reschedule e GET slots | Validação, permissões, estado, histórico, HTTP |
| apps/server/src/scheduling/rest/controllers/tests/schedules-access.controller.test.ts | integration | Rotas de disponibilidade legadas | Guarda/escopo próprio/Admin |
| apps/server/src/consultation/rest/controllers/tests/consultation-appointment-guard.controller.test.ts | integration | Finalizar/concluir Consulta | 409 após cancelamento, sem evento; sucesso com outbox no commit |
| apps/server/src/consultation/rest/controllers/tests/get-consultation.controller.test.ts | integration, Modify | GET Consulta por ID | Admin/advogado responsável 200; outro ator 404 sem ficha |
| apps/server/src/consultation/rest/controllers/tests/get-consultation-by-intake.controller.test.ts | integration, Modify | GET Consulta por Intake | Mesmo escopo do GET por ID, sem bypass |
| apps/server/src/scheduling/messaging/inngest/jobs/tests/publish-appointment-change-job.test.ts | integration | PublishAppointmentChangeJob | Retry, dedup por ID, ISO, marcação pós-aceitação |
| apps/server/src/consultation/messaging/inngest/jobs/tests/publish-consultation-event-job.test.ts | integration | PublishConsultationEventJob | Pendência preservada em falha, ID estável no retry, publishedAt após aceite |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/tests/appointments-page.test.tsx | widget | Página composta | Visões, filtros, estados, overflow, foco |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/tests/use-appointments-page.test.ts | hook dono | Estado/URL da página | Período, filtros, seleção e mapeamento de loading/erro |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/tests/calendar-toolbar.test.tsx | widget | CalendarToolbar | Navegação, visão, filtros e limpar; markup acessível e delegação dos handlers |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/calendar-toolbar/tests/use-calendar-toolbar.test.ts | owning hook | useCalendarToolbar | Intervalo/URL sem perder filtros; estados e ações observáveis |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/tests/week-calendar.test.tsx | widget | WeekCalendar | Grade semanal, bloqueios e cards; markup acessível e delegação dos handlers |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/week-calendar/tests/use-week-calendar.test.ts | owning hook | useWeekCalendar | Agrupamento local, clique e overflow; estados e ações observáveis |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/tests/month-calendar.test.tsx | widget | MonthCalendar | Grade mensal e +N; markup acessível e delegação dos handlers |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/month-calendar/tests/use-month-calendar.test.ts | owning hook | useMonthCalendar | Semanas reais, agrupamento local e overflow; estados e ações observáveis |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/tests/mobile-day-list.test.tsx | widget | MobileDayList | Lista diária responsiva; markup acessível e delegação dos handlers |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/mobile-day-list/tests/use-mobile-day-list.test.ts | owning hook | useMobileDayList | Agrupamento, ordem, bloqueios e acesso a todos; estados e ações observáveis |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/tests/day-events-dialog.test.tsx | widget | DayEventsDialog | Eventos excedentes e foco; markup acessível e delegação dos handlers |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/day-events-dialog/tests/use-day-events-dialog.test.ts | owning hook | useDayEventsDialog | Abertura, Escape, foco e seleção; estados e ações observáveis |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/tests/client-filter-dialog.test.tsx | widget | ClientFilterDialog | Busca, seleção e aplicar; markup acessível e delegação dos handlers |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/client-filter-dialog/tests/use-client-filter-dialog.test.ts | owning hook | useClientFilterDialog | Debounce, página vazia intermediária com cursor, zero terminal/erro e recovery; estados e ações observáveis |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/tests/appointment-details-dialog.test.tsx | widget | Detalhes | Resumo, histórico, ações autorizadas, loading/403/404/erro |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/tests/use-appointment-details-dialog.test.ts | owning hook | Detalhes | ID, permissões, subdiálogos, stale/foco |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/tests/cancel-appointment-dialog.test.tsx | widget | Cancelamento | Confirmação, pending, erro, foco |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/cancel-appointment-dialog/tests/use-cancel-appointment-dialog.test.ts | owning hook | Cancelamento | Revisão, submissão única, 409 e recovery |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/tests/reschedule-appointment-dialog.test.tsx | widget | Remarcação | Slots, resumo, pending/conflict/error, teclado |
| apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/tests/use-reschedule-appointment-dialog.test.ts | owning hook | Remarcação | RHF, data/slot/revisão e preservação em 409 |
| apps/web/tests/routes/agenda/consultas.test.ts | route, HTTP mocked | URL/rota/hooks reais | Search/back/forward, requests, invalidação/refetch, viewport/teclado isolados |

| Test file | Test case | Description | Assertions |
| --- | --- | --- | --- |
| appointment-change-schema.test.ts | requires a new start for rescheduling and omits it for cancellation | Existing reschedule and cancel shapes; lawyerId is optional for rescheduling | Current syntactic rules remain valid |
| calendar-options-query-schema.test.ts | validates the local date used to list reschedule slots | Date with optional lawyerId query | Valid civil date accepted; invalid date rejected |
| appointment-change-event-schema.test.ts | accepts the complete rescheduling envelope | Rescheduled event with origin/destination schedule IDs | Schema accepts previousScheduleId/newScheduleId; cancellation continues using scheduleId |
| list-calendar-use-case.test.ts | limits and projects the visible calendar | Semana domingo–sábado, grade mensal domingo–sábado, duas agendas em fusos distintos, borda de mês/DST, bloqueio final, cancelado/no-show | Nenhum evento perdido/duplicado; dia local de cada agenda e no-show apenas da Consulta |
| list-calendar-use-case.test.ts | combines scoped filters | Cliente, advogado inativo, tipo e URL forjada | Só próprias para Advogado; sem bloqueio com cliente; consultationId omitido de ator sem ficha |
| list-calendar-filter-options-use-case.test.ts | fills visible pages without false empty | Primeira página global só tem clientes fora do escopo e próxima tem um visível | Não mostra vazio terminal; nextCursor opaco/ator-vinculado; opção visível é encontrada sem nomes alheios |
| get-appointment-details-use-case.test.ts | returns eligible details and history | Com/sem Consulta, Admin/advogado associado/outros | Link e consultationId só para Admin/advogado responsável, horário/histórico legíveis |
| get-appointment-details-use-case.test.ts | hides inaccessible appointment | ID alheio | 404 sem dados do alvo |
| cancel-appointment-use-case.test.ts | cancels once before consultation starts | Admin/Atendente e retry | Uma mudança/outbox, horário livre, mesmo vínculo |
| cancel-appointment-use-case.test.ts | rejects unauthorized or started/final consultation | Perfis sem escrita e estados finais | 403/409, zero mutação |
| reschedule-appointment-use-case.test.ts | moves same appointment atomically | Slot livre futuro na mesma agenda e em outra agenda ativa | ID/cliente/Consulta mantidos, agenda antiga livre, nova ocupada, advogado da Consulta atualizado no mesmo commit, histórico/outbox com agendas anterior/nova |
| reschedule-appointment-use-case.test.ts | rejects blocked stale past or overlapping slot | Cada branch | 409/422, sem alteração parcial |
| list-reschedule-slots-use-case.test.ts | lists eligible slots without booking | Bloqueio, passado, conflito, advogado selecionado, inativo ou sem agenda | Apenas slots possíveis da agenda selecionada; nenhuma escrita |
| authorize-schedule-access-use-case.test.ts | limits legacy schedule access | Admin, Advogado próprio/alheio, outros perfis | Permitido só Admin/próprio; 403 sem dados para demais |
| check-appointment-availability-use-case.test.ts | checks one availability rule for all callers | Horário local, bloqueio de último dia, overlap e exclusão da marcação atual | Elegibilidade idêntica para slots/reserva/remarcação; sem mutação |
| reserve-intake-appointment-use-case.test.ts | serializes against concurrent move | Reserva concorrente | Uma ocupação, retry por Intake |
| complete-consultation-use-case.test.ts | rejects cancelled appointment | Marca cancelada | Consulta não conclui nem enfileira evento |
| complete-consultation-use-case.test.ts | commits completion with pending event | Marca ativa e ficha válida | Consulta concluída e envelope único no mesmo callback; broker não chamado |
| finalize-consultation-attendance-use-case.test.ts | rejects cancelled appointment | Marca cancelada | Ficha não finaliza nem enfileira evento |
| finalize-consultation-attendance-use-case.test.ts | queues legal-context change only when changed | Área/tema novo versus iguais | Envelope único só com mudança, no callback; sem broker direto |
| create-consultation-from-appointment-use-case.test.ts | ignores cancelled reservation | Job atrasado após cancelamento | Sem Consulta criada ou evento de criação |
| get-consultation-use-case.test.ts | authorizes before loading full context | Admin, advogado associado, outro advogado e outros perfis | 200 só nos dois primeiros; 404 sem chamadas a cliente/Intake para alvo alheio |
| get-consultation-by-intake-use-case.test.ts | prevents lookup bypass | Intake com Consulta de outro advogado | 404 sem ficha, mesma matriz do GET por ID |
| calendar-read.controller.test.ts | enforces read roles and civil-period limits | HTTP com DB | Cinco perfis permitidos no escopo; cliente/estagiário 403; view/date inválidos ou from/to arbitrário 400; bordas entre fusos corretas |
| calendar-read.controller.test.ts | hides unauthorized facets and history | Faceta/detalhe forjados | IDs/nomes só do universo permitido; inativo com histórico incluído |
| appointment-actions.controller.test.ts | persists cancel and reschedule | HTTP + DB | 200, linha atual/histórico/outbox, Consulta mantém appointmentId |
| appointment-actions.controller.test.ts | rejects unsafe writes and concurrent moves | Perfis, revisão, Consulta, slot e duas requisições concorrentes | 403/404/409/422; uma ocupação, sem histórico/outbox órfão após rollback |
| schedules-access.controller.test.ts | protects legacy schedule routes | Advogado próprio/alheio, Admin, demais | Respostas compatíveis apenas quando autorizado |
| consultation-appointment-guard.controller.test.ts | prevents completion after cancellation | Cancelamento e conclusão concorrentes com HTTP e banco reais | Só uma transição vence; estado/outbox coerentes; nenhum commit parcial |
| consultation-appointment-guard.controller.test.ts | commits consultation and outbox together | Conclusão/contexto válido e erro forçado no insert do envelope | Sucesso persiste ambos; falha desfaz ambos |
| get-consultation.controller.test.ts | hides another consultation | Admin, advogado responsável e outros com URL direta | 200 autorizado, 404 para objeto alheio/inexistente sem conteúdo jurídico |
| get-consultation-by-intake.controller.test.ts | cannot bypass authorization by Intake | Intake alheio na URL | 404 sem conteúdo, mesma regra por ID |
| publish-appointment-change-job.test.ts | publishes pending change once | Falha/retry de broker | Mesmo change ID, ISO, publishedAt só após aceite |
| publish-consultation-event-job.test.ts | retries committed consultation facts | Falha após commit e após aceite do broker | Linha permanece pendente na falha; mesmo event.id no reenvio; publishedAt só após aceite; Intake idempotente |
| appointments-page.test.tsx | renders calendar and recovery states | Visões/empty/filtered/error/restricted | Texto, overflow acessível, filtros e retry |
| calendar-toolbar.test.tsx + use-calendar-toolbar.test.ts | exposes CalendarToolbar behavior | Navegação, visão, filtros e limpar; Intervalo/URL sem perder filtros | UI acessível, ações e estados coerentes com a data civil e o escopo |
| week-calendar.test.tsx + use-week-calendar.test.ts | exposes WeekCalendar behavior | Grade semanal, bloqueios e cards; Agrupamento local, clique e overflow | UI acessível, ações e estados coerentes com a data civil e o escopo |
| month-calendar.test.tsx + use-month-calendar.test.ts | exposes MonthCalendar behavior | Grade mensal e +N; Semanas reais, agrupamento local e overflow | UI acessível, ações e estados coerentes com a data civil e o escopo |
| mobile-day-list.test.tsx + use-mobile-day-list.test.ts | exposes MobileDayList behavior | Lista diária responsiva; Agrupamento, ordem, bloqueios e acesso a todos | UI acessível, ações e estados coerentes com a data civil e o escopo |
| day-events-dialog.test.tsx + use-day-events-dialog.test.ts | exposes DayEventsDialog behavior | Eventos excedentes e foco; Abertura, Escape, foco e seleção | UI acessível, ações e estados coerentes com a data civil e o escopo |
| client-filter-dialog.test.tsx + use-client-filter-dialog.test.ts | exposes ClientFilterDialog behavior | Busca, seleção e aplicar; página vazia intermediária seguida de match visível | Mantém loading com cursor, só mostra zero terminal no fim; sem nomes fora do escopo |
| appointment-details-dialog.test.tsx + use-appointment-details-dialog.test.ts | exposes only authorized details and actions | Papel/Consulta/loading/403/404 | Link e ações condicionais, foco restaurado |
| cancel-appointment-dialog.test.tsx + use-cancel-appointment-dialog.test.ts | confirms a cancellation once | Revisão/pending/409 | Confirmação, erro e recovery sem duplicata |
| reschedule-appointment-dialog.test.tsx + use-reschedule-appointment-dialog.test.ts | selects and confirms an available slot | Data/slot/conflito/teclado | Seleção preservada, formulário e foco corretos |
| use-appointments-page.test.ts | maps domain hook state into page behavior | Filtros/alteração/erro; “Hoje” antes/depois da meia-noite de São Paulo com navegador em outro fuso | URL usa data de `America/Sao_Paulo`, não data antiga/nativa; loading/erro, seleção e ações delegadas |
| consultas.test.ts | preserves URL state and refreshes after writes | Navegação com hooks reais e HTTP mockado | Requests por escopo, refetch correto sem stale, sem overflow horizontal |

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| CA-01 | Core list, widget, route | MV-01 | evaluation.md calendário desktop |
| CA-02 | Core list, server read | MV-01 | evaluation.md eventos/bloqueios |
| CA-03 | Core list, server read, widget | MV-01 | evaluation.md filtros/overflow |
| CA-04 | Core detail e GET Consulta por ID/Intake, server read, dialog | MV-02 | evaluation.md detalhe/link/URL direta |
| CA-05 | Core cancel, HTTP action com PostgreSQL | MV-03 | evaluation.md cancelamento/DB |
| CA-06 | Core reschedule, HTTP action com PostgreSQL | MV-03 | evaluation.md remarcação/DB |
| CA-07 | Core actions, HTTP concorrente com PostgreSQL, outbox Agendamento/Consulta e messaging | MV-03 | evaluation.md concorrência/falhas |
| CA-08 | Server read/action, widget, route | MV-04 | evaluation.md papéis/mobile/teclado |
| CA-09 | Server read/action, hook, widget | MV-04 | evaluation.md falhas/segredos |

**MV-01 — calendário real (CA-01–03).** Antes de abrir o navegador, docker compose ps -a deve mostrar DB/Auth saudáveis; curl http://localhost:8000/auth/v1/health e curl http://localhost:3333/health devem passar; Nest deve terminar bootstrap. Iniciar pnpm --filter server dev e pnpm --filter web dev em sessões persistentes anotadas. Conferir HMS_USER_SEED_PASSWORD e apps/server/src/identity/database/identity-seeder.ts; autenticar por /login com campos por rótulo e verificar URL e conteúdo autenticado. Preparar agendada/cancelada/no-show, bloqueio final inclusivo, advogado inativo histórico e duas agendas de fusos diferentes com instantes próximos da borda mensal. Confirmar que o Advogado vê bloqueios da própria agenda, que o Admin não recebe cards nem filtro de bloqueios, inclusive com URL `event=blocked`, e que os horários continuam indisponíveis na agenda do advogado. Viewports 1417 × 900 e 1200 × 900, comparar e9hQ5V.png, aDlqK.png, c7tlDG.png.

1. Abrir /agenda/consultas com navegador em outro fuso, alternar Semana/Mês, setas/Hoje e voltar no navegador; conferir semana domingo–sábado, grade mensal com bordas domingo–sábado, `date` de “Hoje” em `America/Sao_Paulo`, URL/filtros, rótulos de fuso, evento na data local de cada agenda e REST real.
2. Buscar cliente, selecionar por teclado e aplicar; combinar advogado inativo e status; limpar filtros; bloqueios só quando cliente não filtra.
3. Abrir +N por Enter em dia cheio, conferir todos os itens e restaurar foco.
4. Registrar screenshot/trace, console, requests falhos, 4xx/5xx e DB; classificar todo erro. Capturas agenda-week-desktop, agenda-month-overflow e client-filter. Nenhuma escrita nessa passagem.

**MV-02 — detalhes e Consulta (CA-04).** Mesmo ambiente, sessão real e viewport 1417 × 900; comparar gQg7t.png. Abrir card por teclado, verificar cliente mascarado, advogado, início/fim/duração, estado e histórico. Com Admin e advogado responsável, seguir Abrir consulta e verificar URL /consultas/:consultationId e conteúdo autorizado; com Atendente/Supervisor/Paralegal/outro Advogado, confirmar que o link e consultationId não aparecem e que GET direto por ID e por Intake retorna 404 sem ficha. Sem Consulta existente, ação ausente com explicação. Voltar e confirmar ausência de PATCH/POST ou reserva. Verificar Escape/foco, console/requisições e captura appointment-details.

**MV-03 — ações reais (CA-05–07).** Sessões reais Admin e Atendente; fixtures com Consulta pendente, iniciada/final e slots livre/bloqueado/ocupado em duas agendas ativas, além de um advogado inativo e um sem agenda. Comparar KIhkn.png e yVAoI.png em 600 × 834 e adaptação em 390 × 844.

1. Confirmar cancelamento por teclado; verificar HTTP, appointments, appointment_changes, vínculo de Consulta, liberação e evento pendente/publicado. Em conclusão/finalização válida de Consulta, verificar commit conjunto de Consulta e consultation_outbox_events; simular falha do broker no job e confirmar pendência/retry sem reverter o write. Repetir mesma intenção e conferir uma mudança.
2. Remarcar para outro advogado ativo com slot livre; comparar antes/depois, verificar mesmo appointmentId/cliente/Consulta, agenda e horário antigos liberados, destino ocupado, advogado da Consulta atualizado e histórico com agenda anterior/nova.
3. Tentar slot concorrente com duas sessões, passado, bloqueio e revisão obsoleta; verificar 409/422, escolha preservada e nenhuma ocupação dupla.
4. Registrar cancel-confirm e reschedule, trace, console e requests; restaurar dados de fixture quando aplicável.

**MV-04 — perfis, estados e mobile (CA-08–09).** Sessões reais dos cinco perfis de leitura e cliente/estagiário; criar/reutilizar contas de teste pelos fluxos de Identidade e anotar credenciais de fixture sem gravá-las em evaluation.md. Viewport 390 × 844; fixtures de agenda própria/alheia, lista vazia e filtro sem resultado. Verificar Admin/Atendente/Supervisor/Paralegal em todas, Advogado só própria, cliente/estagiário 403 e escrita só dos dois primeiros. Usar Tab, Enter, setas e Escape; conferir foco, rótulos, lista por dia, sem overflow e estado não dependente de cor. Para erro real, parar brevemente a sessão Server já anotada, conferir falha/retry visíveis, reiniciar e aguardar bootstrap antes de repetir; teste isolado com page.route pode complementar, mas deve ser rotulado como mock. Em sessão expirada, autenticar novamente em contexto novo. Classificar console, hidratação, 4xx/5xx, refresh de Auth e requests falhos. Capturas agenda-mobile e agenda-states. Encerrar somente sessões Server/Web com Ctrl-C, deixando Docker compartilhado.

| Command | Purpose/coverage |
| --- | --- |
| pnpm --filter @hms/core test | Unit de Agendamento/Consulta e regressão de reserva. |
| pnpm --filter server test | Controller de Agendamento/Consulta com PostgreSQL real, acesso GET por ID/Intake e jobs de outbox. |
| pnpm --filter web test -- src/ui/scheduling | Widgets/hooks. |
| pnpm --filter web exec playwright test tests/routes/agenda/consultas.test.ts | Rota isolada; mocks rotulados. |
| pnpm --filter web test:integration | Suíte browser; não substitui MV real. |
| pnpm --filter web generate-routes | Gerar routeTree.gen.ts. |
| pnpm --filter @hms/core check-types; pnpm --filter @hms/validation check-types; pnpm --filter server check:types; pnpm --filter web check:types | Typecheck dos quatro workspaces, sequencial. |
| pnpm --filter server check:lint; pnpm --filter web check:lint; pnpm --filter @hms/core lint; pnpm --filter @hms/validation lint | Biome por workspace, sequencial. |
| pnpm --filter @hms/core check:architecture; pnpm --filter server check:architecture; pnpm --filter web check:architecture | Fronteiras, sequencial. |
| pnpm --filter server db:migration:generate; pnpm --filter server db:migration:apply | Migração após revisão do SQL/journal, sequencial. |

Registrar resultados executados, URLs, sessão, trace, screenshots e achados em [evaluation.md](evaluation.md) somente no início da implementação. A Spec não afirma aprovação antecipada de testes.

# 5. Documentation alignment and revision history

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| [PRD Agendamento v12](https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento) | REQ-015–020, confiabilidade/privacidade | changed | PRD v12 preserva semana/mês, oculta cards de bloqueio para Admin sem remover a restrição na agenda do advogado e permite trocar para advogado ativo com horário disponível, sincronizando a Consulta existente na remarcação. |
| [PRD Consulta v12](https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2621441/PRD+M+dulo+de+Consulta) | REQ-001/002, REQ-007–009 e acesso à ficha | changed | REQ-002 explicita a leitura da ficha completa por Administrador ou Advogado responsável, distingue a projeção mínima da Agenda e aplica a mesma regra ao acesso pela Agenda, por Consulta e por Intake. O fluxo `in_progress` segue como discrepância entre código e PRD, fora desta sincronização. |
| [SCRUM-146](https://plataformahms.atlassian.net/browse/SCRUM-146) | Pedido e critérios originais | confirmed | Usuário ampliou fora de escopo para cancelar/remarcar; ticket não foi alterado. |
| documentation/features/document-production/consultation-document-production-ui/spec.md | Acesso de Admin e advogado associado a documentos da Consulta | confirmed | Decisão de produto já aceita pelo usuário nessa feature fundamenta a matriz conservadora da ficha completa; calendário mantém matriz própria. |
| documentation/architecture.md, documentation/modules.md | Donos Agendamento/Consulta/Identidade | confirmed | Projeções por ports, sem consultar diretamente tabelas de outros módulos. O link de Modules ao PRD antigo é discrepância documental para atualização separada. |
| documentation/design.md, design/hms.pen | Tokens e quadros | confirmed | Seis capturas locais; desvios/premissas no manifesto. |
| documentation/infrastructure.md, documentation/tooling.md | Stack e comandos reais | confirmed | Reusar Nest/Drizzle/Zod/TanStack/Inngest/Playwright CLI; sem dependência nova. |
| AGENTS.md, AGENTS.local.md | Ambiente e validação | confirmed | Navegador autenticado com REST/Auth reais e CLI. |

| Rule | Applies to | Evaluated revision |
| --- | --- | --- |
| documentation/rules/rules.md, documentation/rules/sdd-rules.md | Seleção e SDD | eb8d7c6f |
| documentation/rules/code-conventions-rules.md, documentation/rules/core-package-rules.md, documentation/rules/use-case-testing-rules.md | Core/TS/testes | eb8d7c6f + providers compartilhados nesta revisão |
| documentation/rules/validation-package-rules.md, documentation/rules/rest-layer-rules.md, documentation/rules/controllers-testing-rules.md | Schemas/HTTP/fixtures | eb8d7c6f |
| documentation/rules/database-layer-rules.md, documentation/rules/server-app-layer-rules.md, documentation/rules/provision-layer-rules.md, documentation/rules/messaging-layer-rules.md | Persistência/DI/clock/eventos | eb8d7c6f |
| documentation/rules/ui-layer-rules.md, documentation/rules/web-app-routing-rules.md, documentation/rules/widget-testing-rules.md | Web/rota/widget | eb8d7c6f + exceção query/action nesta revisão |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| 1 | 2026-09-24 | Contrato da Agenda de Consultas, seis referências e leitura/cancelamento/remarcação | SCRUM-146, PRD v10 e decisões do usuário |
| 2 | 2026-09-24 | Ports e adapters de projeção do calendário renomeados para `Provider` | Preferência de nomenclatura do usuário; comportamento preservado |
| 3 | 2026-09-24 | Rule Pack explicita `Provider` para projeções entre módulos | Regra global solicitada pelo usuário; contratos da Agenda já conformes |
| 4 | 2026-09-24 | Providers de projeção movidos para `shared/interfaces` | Decisão do usuário por contratos compartilhados; adapters permanecem nos módulos donos dos dados |
| 5 | 2026-09-24 | `SchedulingDatabase.run` substitui métodos de mutação no adapter; reserva existente passa ao scope transacional | Decisão do usuário após comparação com MRP de Scoops e nome `SchedulingDatabase` |
| 6 | 2026-09-24 | Remove teste dedicado de query/action hooks; transfere evidência a hook dono e rota | Diretriz do usuário e Rule Pack de widget atualizado |
| 7 | 2026-09-24 | Substitui teste agregado de diálogos por testes colocados em cada widget/hook dono | Alinhamento à Widget Testing Rule |
| 8 | 2026-09-24 | Define calendário multi-fuso por data civil, port transacional Consulta/Agendamento, tipos Core separados e disponibilidade em caso de uso; desloca testes DB para HTTP e completa pares de widget | Correção dos cinco achados da revisão |
| 9 | 2026-09-24 | Fixa “Hoje” em `America/Sao_Paulo` e semanas/grade mensal de domingo a sábado | Aprovação explícita do usuário para a convenção temporal de navegação |
| 10 | 2026-09-24 | Protege GET de Consulta por ID/Intake, persiste eventos de Consulta em outbox, corrige paginação de facetas e separa testes por caso de uso | Correção dos quatro achados remanescentes da revisão |
| 11 | 2026-09-24 | Sincroniza a matriz de leitura da ficha completa com o PRD Consulta v12 e atualiza o alinhamento documental | Autorização explícita do usuário para publicar a decisão no PRD canônico |
| 12 | 2026-09-28 | Autoriza troca para advogado ativo com disponibilidade durante remarcação, sincroniza a Consulta existente e aproxima o diálogo de yVAoI | Confirmação do usuário; PRD canônico atualizado para v11 |
