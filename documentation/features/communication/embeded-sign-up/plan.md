---
title: Meta Embedded Signup para Advogados — implementation plan
status: completed
spec: ./spec.md
spec_revision: 2
evaluation: ./evaluation.md
updated_at: 2026-09-22
---

# Execution Status

- **Spec Path**: `documentation/features/communication/embeded-sign-up/spec.md` (Revisão 2, `open`)
- **Estratégia**: Plan-backed execution (múltiplas camadas afetadas: `core`, `validation`, `server`, `web`).
- **Fase Atual**: F1 — Core & Validation
- **Próxima Ação**: Iniciar implementação TDD do pacote `packages/core` e `packages/validation`.
- **Bloqueios Ativos**: Nenhum.
- **Builders Ativos**: `builder_core`, `builder_validation`, `builder_server`, `builder_web`.

---

# Execution Ledger

| Wave | Builder | Phase | Name | Depends on | Parallel with | Status | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `builder_core` | F1 | Core Domain & Use Cases | — | `builder_validation` | `pending` | Testes unitários do Core passando (`pnpm --filter core test`) |
| 1 | `builder_validation` | F1 | Validation Schemas | — | `builder_core` | `pending` | Testes de Schema Zod passando (`pnpm --filter validation test`) |
| 2 | `builder_server` | F2 | Server Provision, Persistence & REST | F1 | — | `pending` | Testes de Controller NestJS e Drizzle ORM passando (`pnpm --filter server test`) |
| 3 | `builder_web` | F3 | Web UI & Integration | F2 | — | `pending` | Testes de componentes Web e rotas passando (`pnpm --filter web test`) |

---

### F1 — Core & Validation

#### F1-T1 — Entidade e Estrutura WhatsappChannel
- **Status/owner:** `pending` — `builder_core`
- **Depends/parallel:** N/A
- **Paths:** `packages/core/src/communication/domain/entities/whatsapp-channel.ts`
- **Contract:** `RF-03`, `CA-02`
- **Outcome:** Entidade `WhatsappChannel` criada com suporte a vínculo 1:1 com Advogado (`assignedLawyerId`).
- **Rules:** `core-package-rules.md`
- **Exit:** `pnpm --filter core test`

#### F1-T2 — Caso de Uso RegisterWabaAccountUseCase
- **Status/owner:** `pending` — `builder_core`
- **Depends/parallel:** F1-T1
- **Paths:** `packages/core/src/communication/use-cases/register-waba-account-use-case.ts`
- **Contract:** `RF-03`, `RF-04`, `CA-02`, `CA-03`
- **Outcome:** Caso de uso orquestrando a troca OAuth Meta, inativação do canal legado do advogado e ativação atômica do novo canal WABA.
- **Rules:** `core-package-rules.md`, `use-case-testing-rules.md`
- **Exit:** Teste de unidade `register-waba-account-use-case.test.ts` com 100% de aprovação.

#### F1-T3 — Schemas Zod de Validação
- **Status/owner:** `pending` — `builder_validation`
- **Depends/parallel:** F1-T1
- **Paths:** `packages/validation/src/communication/waba-embedded-signup.schema.ts`
- **Contract:** `RF-02`, `RF-03`
- **Outcome:** Schemas `registerWabaAccountSchema` exportados no barrel de `@hms/validation`.
- **Rules:** `validation-package-rules.md`
- **Exit:** Teste de unidade `waba-embedded-signup.schema.test.ts` passando.

---

### F2 — Server Application & Provision

#### F2-T1 — Modelos Drizzle e Migração
- **Status/owner:** `pending` — `builder_server`
- **Depends/parallel:** F1
- **Paths:** `apps/server/src/communication/database/drizzle/models/waba-account-model.ts`
- **Contract:** `RF-03`, `CA-02`
- **Outcome:** Tabelas `waba_accounts` e `whatsapp_channels` criadas com FKs e índices.
- **Rules:** `database-layer-rules.md`
- **Exit:** Compilação do servidor sem erros de tipo Drizzle.

#### F2-T2 — Provider MetaCloudApiProvider
- **Status/owner:** `pending` — `builder_server`
- **Depends/parallel:** F2-T1
- **Paths:** `apps/server/src/shared/provision/meta-cloud-api.provider.ts`
- **Contract:** `RF-03`, `CA-02`
- **Outcome:** Provider NestJS que realiza chamadas REST HTTPS para `/v25.0/oauth/access_token` e `/v25.0/{phone_number_id}`.
- **Rules:** `provision-layer-rules.md`
- **Exit:** Testes unitários do provider cobrindo sucesso e erro da Meta Graph API.

#### F2-T3 — RegisterWabaAccountController & Rest Routes
- **Status/owner:** `pending` — `builder_server`
- **Depends/parallel:** F2-T2
- **Paths:** `apps/server/src/communication/rest/controllers/register-waba-account.controller.ts`
- **Contract:** `RF-03`, `RF-05`, `CA-02`, `CA-04`
- **Outcome:** Controller REST exposto em `POST /api/v1/communication/waba/embedded-signup/exchange` com verificação de autorização `Administrador`.
- **Rules:** `rest-layer-rules.md`, `controllers-testing-rules.md`
- **Exit:** Teste de integração HTTP com Supertest validando 201 Created para Admin e 403 Forbidden para não-Admin.

---

### F3 — Web Application

#### F3-T1 — Atualização do CollaboratorRegisterDialog
- **Status/owner:** `pending` — `builder_web`
- **Depends/parallel:** F2
- **Paths:** `apps/web/src/ui/identity/widgets/components/collaborator-register-dialog/index.tsx`
- **Contract:** `RF-01`, `CA-01`
- **Outcome:** Adicionar o campo Celular/WhatsApp com obrigatoriedade quando o perfil for `Advogado`, e botão para Meta Embedded Signup popup.
- **Rules:** `ui-layer-rules.md`, `widget-testing-rules.md`
- **Exit:** Teste de widget validando presença e obrigatoriedade do campo no perfil Advogado.

#### F3-T2 — Seção WhatsApp WABA no CollaboratorDetailsPage
- **Status/owner:** `pending` — `builder_web`
- **Depends/parallel:** F3-T1
- **Paths:** `apps/web/src/ui/identity/widgets/pages/collaborator-details-page/index.tsx`
- **Contract:** `RF-02`, `RF-04`, `CA-03`
- **Outcome:** Exibir os dados do canal WABA do advogado com badge de status, qualidade e botão de reconexão.
- **Rules:** `ui-layer-rules.md`, `widget-testing-rules.md`
- **Exit:** Teste de widget validando exibição e ações da seção de WhatsApp do Advogado.

---

# Validation and Handoff

| Type | Scenario/surface | Criteria | Reference | Evidence target | Status |
| --- | --- | --- | --- | --- | --- |
| Manual | MV-01 | CA-01, CA-02 | Spec MV-01 | `./evaluation.md` | `pending` |
| Manual | MV-02 | CA-03 | Spec MV-02 | `./evaluation.md` | `pending` |
| Runtime | Integration Test | CA-02, CA-04 | REST Contract | `./evaluation.md` | `pending` |

---

# Execution Log

- **2026-09-22 — Plano Criado**
  - **Resultado:** `plan.md` materializado para o escopo reconciliado de Advogados (Meta WABA).
  - **Próxima ação:** Inicializar `evaluation.md` e iniciar Fase F1 (Core & Validation) via TDD.
