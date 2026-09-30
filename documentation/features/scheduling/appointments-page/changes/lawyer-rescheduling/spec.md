---
title: Advogado remarcar compromissos da própria agenda
status: in_progress
revision: 1
source:
  type: direct-request
  ref: codex-task
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento
jira_tickets:
  - SCRUM-146
scope:
  - packages/core/src/scheduling/domain/use-cases
  - apps/web/src/ui/scheduling/widgets/pages/appointments-page
last_updated_at: 2026-09-29
---

# 1. Context and scope

**Objetivo e fonte.** Permitir que o advogado responsável remarque data e horário de um agendamento da própria agenda. A decisão foi confirmada pelo usuário durante a correção do [PR #183](https://github.com/hms-society/hms/pull/183) e registrada no [PRD de Agendamento, REQ-018 e JN-010](https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2686977/PRD+M+dulo+de+Agendamento), versão 14. O Jira SCRUM-146 permanece sem alteração.

O baseline habilita cancelamento e remarcação apenas para Admin/Atendente. Core rejeita qualquer advogado nas consultas de horários e na remarcação; a UI oculta ambas as ações ao advogado responsável.

| Área | In scope | Out of scope |
| --- | --- | --- |
| Remarcação | Advogado ativo altera somente data/horário de agendamento elegível na própria agenda | Trocar advogado, cancelar agendamento, editar disponibilidade, bloqueios ou dados do cliente |
| Perfis operacionais | Admin/Atendente preservam seleção de advogado, remarcação entre agendas e cancelamento conforme contrato existente | Ampliar escrita para Supervisor, Paralegal, cliente ou estagiário |
| Consulta | Preservar o mesmo agendamento, cliente, Consulta pendente, histórico e regras de disponibilidade | Iniciar, cancelar ou editar o fluxo da Consulta |

## Product alignment

| Source requirement | Delivery | Notes |
| --- | --- | --- |
| PRD v14 REQ-018/JN-010 | `full` | Advogado responsável pode remarcar apenas a própria agenda e não pode trocar advogado; Admin/Atendente preservam a seleção de profissional. |
| PRD v14 REQ-016/019/020 | `full` | Elegibilidade existente, continuidade da Consulta e histórico permanecem aplicáveis. |
| SCRUM-146 | `partial` | O ticket exclui ações de escrita; a decisão explícita do usuário e o PRD vigente autorizam esta extensão. O Jira não é alterado. |

**Decisões aceitas.** A autorização usa o proprietário atual da agenda associada ao agendamento, não um `lawyerId` controlado pelo cliente. Advogado não recebe ação de cancelamento nem campo editável de advogado. Advogado não responsável não pode consultar horários de remarcação nem alterar o compromisso.

# 2. Implementation Contract

| ID | PRD/Jira/source coverage | Required behavior |
| --- | --- | --- |
| `RF-01` | PRD v14 REQ-018/JN-010; decisão direta do usuário | Advogado ativo pode remarcar apenas agendamento elegível da própria agenda, escolhendo nova data/horário disponível e mantendo o advogado responsável. |
| `RF-02` | PRD v14 REQ-018; REQ-019/020 | Remarcação preserva appointmentId, cliente, Consulta pendente e histórico, revalida estado/revisão/disponibilidade e não deixa atualização parcial. |
| `RF-03` | PRD v14 REQ-016–018; decisão direta do usuário | A UI oferece Remarcar ao advogado responsável elegível, não oferece Cancelar nem troca de advogado; Admin/Atendente mantêm a UI e permissões vigentes. |

| ID | RF coverage | Requirement | Given | When | Then | Expected evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `CA-01` | `RF-01` | Slots da própria agenda | Advogado ativo e agendamento Agendado de sua agenda | Consulta slots ou envia `lawyerId` diferente do advogado atual | Slots são limitados à agenda própria; acesso alheio ou tentativa de troca é negada sem revelar disponibilidade de terceiros | Core use-case suite; `MV-01` |
| `CA-02` | `RF-01`, `RF-02` | Remarcar a própria marcação | Agendamento futuro elegível, Consulta ausente ou pendente e slot válido na agenda própria | Advogado confirma nova data/horário | A mesma marcação e Consulta permanecem; somente horário e histórico mudam; conflitos/revisão obsoleta não produzem escrita parcial | Core use-case suite; `MV-01` |
| `CA-03` | `RF-03` | Ações próprias por perfil | Detalhe de compromisso carregado | Advogado responsável ou outro perfil abre os detalhes | Responsável vê Remarcar sem Cancelar; outro advogado não vê escrita; Admin/Atendente continuam vendo ações elegíveis | Web widget suites; `MV-02`; `VIS-01` |
| `CA-04` | `RF-03` | Dialog por perfil | Admin/Atendente ou advogado abre remarcação | Escolhe horário e confirma | Advogado vê responsável fixo e só data/horários; Admin/Atendente mantêm seletor; layout funciona por teclado e a 390 × 844 | Web widget suites; `MV-02`; `VIS-01`–`VIS-02` |

## Cross-cutting restrictions

| Concern | Contract |
| --- | --- |
| Authorization | Core autoriza pelo proprietário da agenda no compromisso atual. Só Admin/Atendente podem escolher outra agenda. Advogado deve estar ativo e ser o responsável atual; propriedade deve ser verificada contra a agenda bloqueada dentro da transação da remarcação. |
| Cancellation | Advogado permanece sem permissão para cancelar; use case e endpoint de cancelamento não mudam. |
| Conflict and consistency | Estado, consulta iniciada, revisão concorrente, passado, bloqueios e sobreposição mantêm os erros atuais e não alteram marcação, Consulta ou histórico em caso de falha. |

## Design Contract

A referência autorizada continua sendo [`yVAoI.png`](../../design/yVAoI.png), inventariada em [`design/manifest.md`](../../design/manifest.md), 600 × 834. Admin/Atendente mantêm a composição atual. Para Advogado, remover o seletor editável e deixar o advogado responsável fixo no contexto/resumo; manter horário atual, data, slots, duração/fuso e confirmação. Validar também a adaptação em 390 × 844, foco/teclado e retorno de foco. Essa variante de permissão é suplementar à referência de Admin/Atendente e não altera tokens ou o diálogo existente para esses perfis.

# 3. Technical Contract

Core Scheduling possui a autorização e validação transacional. Web deriva capacidades distintas para cancelar e remarcar, e fixa o advogado no dialog do responsável. Controller, REST payload e persistência existentes já encaminham o ator e `lawyerId`; nenhum endpoint, schema ou migration novo é necessário.

| Path | Change | Declaration/surface | Contract |
| --- | --- | --- | --- |
| `packages/core/src/scheduling/domain/use-cases/list-reschedule-slots-use-case.ts` | Modify | `ListRescheduleSlotsUseCase` | Autorizar advogado ativo somente contra appointment atual e própria agenda; rejeitar seleção de outra agenda antes de carregar slots. Preservar Admin/Atendente. |
| `packages/core/src/scheduling/domain/use-cases/reschedule-appointment-use-case.ts` | Modify | `RescheduleAppointmentUseCase` | Verificar proprietário da agenda atual após adquirir locks; advogado não pode mudar scheduleId; manter revisão, elegibilidade, disponibilidade e histórico atômicos. |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/use-appointment-details-dialog.ts` | Modify | Hook de permissões | Expor capacidades independentes de cancelamento e remarcação, derivadas do perfil e responsável. |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/index.tsx` | Modify | `AppointmentDetailsDialog` | Mostrar ações por capacidade independente, sem oferecer cancelamento a Advogado. |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/use-reschedule-appointment-dialog.ts` | Modify | Hook do dialog | Manter seleção fixa para Advogado; Admin/Atendente continuam podendo selecionar responsável. |
| `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/index.tsx` | Modify | `RescheduleAppointmentDialog` | Ocultar seletor editável a Advogado e mostrar profissional fixo, mantendo estados e interação contratados. |
| `packages/core/src/scheduling/domain/use-cases/tests/list-reschedule-slots-use-case.test.ts` | Existing expectation only if contradictory | Caso existente de perfil sem escrita | Atualizar somente a expectativa obsoleta que proíbe todos os advogados; não criar novos casos. |
| `packages/core/src/scheduling/domain/use-cases/tests/reschedule-appointment-use-case.test.ts` | Existing expectation only if contradictory | Caso existente de acesso | Atualizar fixtures/expectativa incompatíveis com advogado responsável; não criar novos casos. |

**Module/boundary ownership:** Core Scheduling; UI Scheduling. Identity somente fornece perfil/estado do colaborador. Proibido alterar cancelamento, REST, Validation, Database, migrations, generated files, Consultation ou o fluxo de configuração da agenda.

# 4. Validation Contract

| Acceptance | Automated boundary | Manual scenario | Evidence target |
| --- | --- | --- | --- |
| `CA-01` | `packages/core/src/scheduling/domain/use-cases/tests/list-reschedule-slots-use-case.test.ts` | `MV-01` | `./evaluation.md` |
| `CA-02` | `packages/core/src/scheduling/domain/use-cases/tests/reschedule-appointment-use-case.test.ts` | `MV-01` | `./evaluation.md` |
| `CA-03` | `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/tests/appointment-details-dialog.test.tsx` e teste de hook existentes | `MV-02` | `./evaluation.md` |
| `CA-04` | `apps/web/src/ui/scheduling/widgets/pages/appointments-page/appointment-details-dialog/reschedule-appointment-dialog/tests` | `MV-02` | `./evaluation.md` |

**Commands:** `pnpm --filter @hms/core check-types`; `pnpm --filter web check:types`; `pnpm --filter web check:lint`. Não executar nem adicionar testes locais nesta tarefa. As suítes automatizadas existentes serão executadas pelo CI do PR.

**MV-01 — autorização e persistência (CA-01/02).** Com DB/Auth/Server saudáveis, sessão real de Advogado ativo, agendamento elegível na própria agenda, uma marcação alheia e slots livres/ocupados/bloqueados. Tentar listar slots e remarcar a marcação própria; verificar resposta, appointmentId/cliente/Consulta, agenda, histórico e novo horário. Tentar a marcação alheia e `lawyerId` diferente; confirmar negação sem exposição de slots nem mutação. Confirmar também que Admin/Atendente mantêm a troca de agenda e Advogado não pode cancelar.

**MV-02 — ações e dialog por perfil (CA-03/04).** Em `/agenda/consultas`, usar sessões Admin, Atendente, advogado responsável e outro advogado. Abrir detalhes por teclado. Confirmar Cancelar e Remarcar para perfis operacionais; só Remarcar para o advogado responsável; nenhuma escrita para advogado alheio. Na referência yVAoI a 600 × 834 e adaptação a 390 × 844, verificar seletor presente apenas para Admin/Atendente; para Advogado, profissional fixo, nova data/slots, resumo, confirmação, foco, console e falhas de rede.

# 5. Documentation alignment and revision history

| Document | Authority for | State | Required change/confirmation |
| --- | --- | --- | --- |
| PRD Agendamento v14 REQ-018/JN-010 | Permissões e experiência da remarcação | `changed` | Inclui advogado responsável limitado à própria agenda; Admin/Atendente preservam troca de advogado. |
| SCRUM-146 | Escopo Jira original | `confirmed` | A ação segue extensão autorizada pelo usuário; Jira não é alterado. |
| `documentation/modules.md`, `documentation/architecture.md` | Ownership e fronteiras | `confirmed` | Core Scheduling decide acesso e escrita; Web apresenta capacidade; módulos Identity/Consultation conservam suas responsabilidades. |
| Rule Pack | Core, hooks/widgets e UI | `confirmed` | `documentation/rules/core-package-rules.md`, `use-case-testing-rules.md`, `ui-layer-rules.md`, `code-conventions-rules.md`. |
| Spec original da Agenda, revisão 13 | Contrato da entrega base | `confirmed` | Esta Spec de mudança prevalece somente sobre capacidade de remarcação do Advogado; não altera cancelamento nem escopo anterior. |

| Revision | Date | Material change | Reason |
| --- | --- | --- | --- |
| `1` | `2026-09-29` | Define remarcação pelo Advogado somente na própria agenda | Decisão direta do usuário e alinhamento ao PRD v14. |
