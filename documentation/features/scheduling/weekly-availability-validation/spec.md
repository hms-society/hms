---
title: Validação e Mesclagem de Intervalos de Disponibilidade Semanal na Agenda
status: completed
source:
  type: jira-ticket
  ref: https://plataformahms.atlassian.net/browse/SCRUM-174
jira_tickets:
  - SCRUM-173
  - SCRUM-174
  - SCRUM-175
scope:
  - packages/core
  - packages/validation
  - apps/server
  - apps/web
last_updated_at: 2026-10-14
---

# 1. Context and scope

**Objetivo.** Corrigir falhas de integridade e usabilidade no cadastro e validação de disponibilidade semanal do advogado no Módulo de Agendamento (REQ-006 / `/agenda`), atendendo às pendências de QA reportadas na Sprint 9:
- **[SCRUM-174](https://plataformahms.atlassian.net/browse/SCRUM-174) (CT-030):** Impedir intervalos que se sobrepõem no mesmo dia (ex: `09:00–12:00` e `11:00–13:00`).
- **[SCRUM-175](https://plataformahms.atlassian.net/browse/SCRUM-175) (CT-031):** Impedir que um intervalo contenha outro (ex: `09:00–18:00` e `10:00–11:00`).
- **[SCRUM-173](https://plataformahms.atlassian.net/browse/SCRUM-173) (CT-029):** Permitir múltiplos intervalos legítimos no mesmo dia (ex: `09:00–12:00` e `14:00–18:00`), garantindo que o intervalo de intervalo (ex: almoço 12:00–14:00) seja estritamente respeitado e nenhum horário indisponível seja ofertado nesse gap.

Adicionalmente, conforme alinhamento via `grill-me`:
1. Intervalos contíguos/adjacentes (`09:00–12:00` e `12:00–14:00`) devem ser **automaticamente mesclados** em `09:00–14:00` para otimização da agenda.
2. A validação deve ocorrer tanto no **Frontend** (modal com mensagem clara e bloqueio do botão salvar) quanto no **Backend/Core** (validação de schema Zod e use-case/entidade no endpoint `/schedules/availability`).
3. Intervalos com `endTime <= startTime` ou com duração total menor do que a duração da consulta configurada na agenda (ex: consulta de 45min, intervalo de 30min) devem ser rejeitados.

| Área | In scope | Out of scope |
| --- | --- | --- |
| Modal de Intervalos (Web) | Validação em tempo real, feedback visual inline de erro (*"Os horários não podem se sobrepor"*), bloqueio de submissão inválida, mesclagem automática de intervalos contíguos | Redesenho completo da tela de agenda |
| Schemas e Domínio | Validador Zod de disponibilidade semanal (`weeklyAvailabilitySchema`), função de normalização/mesclagem e checagem de sobreposição no Core | Alterações na tabela de banco de dados (`schedules.weekly_availability` já armazena JSONB) |
| API Server | Endpoint `PUT /schedules/availability` validando o payload contra o schema de disponibilidade e retornando erro estruturado 400 | Criação de novos endpoints de agendamento |

---

# 2. Implementation Contract

| ID | PRD/Jira Coverage | Required Behavior |
| --- | --- | --- |
| RF-01 | SCRUM-174 (CT-030) | O sistema deve rejeitar a adição de qualquer intervalo que possua sobreposição parcial com intervalos já cadastrados para o mesmo dia, exibindo no frontend a mensagem: `"Os horários não podem se sobrepor"`. |
| RF-02 | SCRUM-175 (CT-031) | O sistema deve rejeitar a adição de qualquer intervalo que contenha totalmente ou seja totalmente contido por outro intervalo já cadastrado no mesmo dia, exibindo no frontend a mensagem: `"Os horários não podem se sobrepor"`. |
| RF-03 | SCRUM-173 (CT-029) | O sistema deve persistir e organizar corretamente múltiplos intervalos sem sobreposição (ex: `09:00–12:00` e `14:00–18:00`). O gap entre os intervalos (ex: `12:00–14:00`) não deve ser considerado disponível para marcação de consultas. |
| RF-04 | Grill-me Alignment | Se o usuário adicionar um intervalo contíguo ao existente (`slot.end === newSlot.start` ou `newSlot.end === slot.start`), o sistema deve fundi-los em um único intervalo contínuo (ex: `09:00–12:00` + `12:00–14:00` = `09:00–14:00`). |
| RF-05 | Integridade Temporal | O sistema deve rejeitar intervalos cujo `fim <= início`, ou cuja duração total seja inferior à duração mínima de consulta configurada para a agenda do profissional. |
| RF-06 | Validação Server-side | A rota `PUT /schedules/availability` deve validar a consistência de todos os slots da semana via schema Zod com refine/superRefine antes de persistir no banco de dados. Em caso de inconsistência, rejeitar com `400 Bad Request` e mensagem descritiva. |

---

# 3. Acceptance Criteria (Critérios de Aceite)

| ID | RF Coverage | Cenário | Given | When | Then |
| --- | --- | --- | --- | --- | --- |
| CA-01 | RF-01 | Sobreposição Parcial (CT-030) | Segunda-feira possui intervalo `09:00–12:00` | Usuário tenta adicionar `11:00–13:00` | O modal exibe erro inline *"Os horários não podem se sobrepor"* e o botão "Adicionar intervalo" fica desabilitado ou impede a submissão. Nenhuma requisição inválida é gravada. |
| CA-02 | RF-02 | Intervalo Contido (CT-031) | Segunda-feira possui intervalo `09:00–18:00` | Usuário tenta adicionar `10:00–11:00` | O modal exibe erro inline *"Os horários não podem se sobrepor"* e o salvamento é bloqueado. |
| CA-03 | RF-02 | Intervalo Contendo Outro | Segunda-feira possui intervalo `10:00–11:00` | Usuário tenta adicionar `09:00–18:00` | O salvamento é bloqueado com erro *"Os horários não podem se sobrepor"*. |
| CA-04 | RF-03 | Múltiplos Intervalos Válidos (CT-029) | Segunda-feira sem intervalos | Usuário adiciona `09:00–12:00` e em seguida `14:00–18:00` | Ambos os intervalos são adicionados e renderizados como badges distintos. A API salva ambos os blocos. |
| CA-05 | RF-04 | Mesclagem de Intervalos Adjacentes | Terça-feira possui `09:00–12:00` | Usuário adiciona `12:00–14:00` | O sistema funde automaticamente os intervalos em uma única badge `09:00–14:00`. |
| CA-06 | RF-05 | Horário Inicial >= Final | Modal aberto | Início `15:00` e Fim `14:00` | Exibe erro indicando que o horário final deve ser posterior ao inicial e impede adição. |
| CA-07 | RF-06 | Rejeição Backend | Chamada direta da API `PUT /schedules/availability` com slots sobrepostos | Requisição recebida | Servidor retorna status 400 com payload de erro e não altera o registro de agendamento. |

---

# 4. Technical Architecture & Changes

### 4.1. Packages / Core & Validation
- **`packages/validation/src/scheduling/schemas/weekly-availability-schema.ts`**:
  - Definir o schema Zod para validação da disponibilidade semanal (`id`, `name`, `active`, `slots`: array de `{ start: string, end: string }`).
  - Implementar refinamento que valida formato HH:mm, ordem temporal (`start < end`), ausência de sobreposições e ordenação dos slots.
- **Função utilitária pura**: `mergeOrValidateSlots(existingSlots, newSlot)`:
  - Detecta sobreposição / contenção -> retorna erro se houver conflito.
  - Detecta contiguidade (`end === start` ou `start === end`) -> realiza o merge.
  - Insere ordenado cronologicamente.

### 4.2. Apps / Web
- **`apps/web/src/ui/identity/widgets/pages/lawyer-page/schedule.tsx`**:
  - Integrar a validação e verificação antes de chamar `handleAddSlot`.
  - Adicionar estado de erro visual no modal (`slotError: string | null`).
  - Exibir mensagem de erro destacada (`text-destructive text-sm font-medium flex items-center gap-1`).
  - Aplicar mesclagem automática ao salvar slot adjacente.

### 4.3. Apps / Server
- **`apps/server/src/scheduling/database/drizzle/repositories/rest/controllers/index.ts`**:
  - Utilizar o schema de validação no DTO do body de `PUT /schedules/availability`.
  - Impedir que payloads inválidos alcancem o banco.

---

# 5. Testing Plan

1. **Unit Tests (Validation)**:
   - Testar `weeklyAvailabilitySchema` com casos de sucesso, intervalos válidos com gap, rejeição de sobreposição parcial, rejeição de contenção e rejeição de horário invertido.
2. **Component Tests (Web Widget)**:
   - Em `apps/web/src/ui/identity/widgets/pages/lawyer-page/tests/schedule.test.tsx`:
     - Teste CT-030: simular adição de intervalo sobreposto e validar erro em tela.
     - Teste CT-031: simular adição de intervalo contido e validar erro em tela.
     - Teste CT-029: simular múltiplos intervalos válidos (`09:00–12:00` e `14:00–18:00`).
     - Teste de mesclagem automática: adicionar `09:00–12:00` e `12:00–14:00`, esperando `09:00–14:00`.
3. **Integration / API Test (Server)**:
   - Testar endpoint `PUT /schedules/availability` recusando payload inválido com 400.
