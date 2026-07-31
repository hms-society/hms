---
title: Ações administrativas de acesso do colaborador
status: in_progress
revision: 3
source:
  type: direct-request
  ref: codex-task
parent_spec: ../../spec.md
parent_plan: ../../plan.md
evaluation: ./evaluation.md
jira_tickets:
  - SCRUM-132
scope:
  - packages/core/src/identity
  - apps/server/src/identity
  - apps/web/src/rest/services/identity-service.ts
  - apps/web/src/ui/identity
  - apps/web/src/ui/shadcn/dropdown-menu.tsx
  - apps/web/src/ui/shared/widgets/components/icon
  - design/hms.pen
last_updated_at: 2026-07-30
---

# Contexto e objetivo

A página de colaboradores já lista contas convidadas, ativas e desabilitadas,
mas ainda não possuía operações de linha com efeito real. Esta mudança adiciona
o menu `…`, o reenvio de convite pendente e a inativação confirmada, preservando
a autorização server-side, o bloqueio local imediato e o fluxo de senha definido
pelo Supabase Auth.

# Escopo

## Incluído

- botão e menu de ações por colaborador;
- reenvio somente para status `invited`;
- inativação para status `active` ou `invited`, idempotente para `disabled`;
- dialogs de confirmação, estados de envio, erro e sucesso;
- bloqueio imediato de contas desabilitadas no `AuthGuard` e no Supabase Auth;
- use cases, provider, endpoints protegidos, serviço REST, hooks e testes focados.

## Fora de escopo

- a definição detalhada de reativação, remoção e consulta fica em
  `changes/collaborator-access-lifecycle/`; o menu agora expõe essas operações;
- alteração do fluxo de definição de senha;
- acesso do navegador ao Supabase service role;
- build local nesta task; o build permanece gate do CI.

# Contract

## RF-01 — Menu condicional de ações

Cada linha exibe o botão `…` seguindo o frame `M6VHEL`. O menu mantém `Ver detalhes`
e `Editar` disponíveis. Para `invited`, oferece `Reenviar convite` e `Cancelar
convite`; para `active`, oferece `Inativar`; para `disabled`, oferece `Reativar`
quando há `lastAccessAt` e `Remover colaborador` quando o convite foi cancelado.

## RF-02 — Reenviar convite pendente

`POST /collaborators/:collaboratorId/invitation/resend` exige administrador ativo,
confirma o vínculo e o status local `invited`, e chama o
`AuthAdministrationProvider`. O provider delega ao Supabase Auth o disparo de um
novo e-mail com redirect para `/convite`. O status local continua `invited`.

## RF-03 — Inativar colaborador

`POST /collaborators/:collaboratorId/deactivate` exige administrador ativo e
altera a conta local para `disabled`, bane a identidade no Supabase Auth e não
remove colaborador, especialidades ou histórico. O `AuthGuard` também consulta o
status local em toda requisição protegida, impedindo o uso de tokens já emitidos.
Repetir a operação em conta `disabled` mantém o estado banido e retorna seu
resumo atual sem nova escrita local.

## Critérios de aceitação

| CA | RF | Dado | Quando | Então | Evidência esperada |
|---|---|---|---|---|---|
| CA-01 | RF-01 | linhas com os três status | abre o menu `…` | `Ver detalhes` e `Editar` aparecem desabilitados; as ações funcionais correspondem ao status e contas desabilitadas não executam ação | teste de widget |
| CA-02 | RF-02 | colaborador `invited` e administrador ativo | confirma reenvio | Auth administrativo é chamado, status permanece `invited` e a lista é invalidada | teste de use case/provider, serviço e integração |
| CA-03 | RF-02 | colaborador `active`/`disabled` ou ator não autorizado | chama a ação | nenhum e-mail é enviado e a API responde conflito/`403` | teste de use case e integração |
| CA-04 | RF-03 | colaborador `active`/`invited` e administrador ativo | confirma inativação | status local torna-se `disabled`, dados permanecem e a UI atualiza a lista | teste de use case, integração e widget |
| CA-05 | RF-03 | colaborador já `disabled` | repete a chamada | resumo atual é retornado sem nova escrita | teste de use case e integração |
| CA-06 | RF-02, RF-03 | ação pendente ou falha REST | confirma no dialog | botão fica pendente, erro é associado ao dialog e o usuário pode tentar novamente | teste de widget |

# Solução técnica

- Core mantém autorização por `AuthorizeAdminUseCase`, consulta o status local e
  coordena o banimento/desbanimento pelo `AuthAdministrationProvider`.
- Server compõe controllers protegidos por `AuthGuard` e `ActiveAdminGuard`; o
  `AuthGuard` resolve a conta local antes de aceitar a sessão e a chave
  administrativa fica somente no provider.
- Web usa TanStack Query para mutações e invalidação de `collaboratorQueryKeys.all`.
  O menu é portaled pelo primitive Radix para não ser cortado pela tabela.
- A inativação não apaga dados nem tenta criar uma jornada paralela de senha; o
  status local continua sendo a autoridade para acesso à HMS.

# Validação

- Core: typecheck, lint e testes dos use cases de ação.
- Server: typecheck, check de código e testes do provider/guard/REST aplicáveis.
- Web: typecheck, check de código e testes do serviço/widget.
- CI: Quality Gate e build do workspace antes de marcar esta mudança como concluída.

# Avaliação

As evidências desta mudança ficam em [`evaluation.md`](./evaluation.md). Esta Spec
permanece `in_progress` até a validação integrada e o Quality Gate do CI.

# Amendments

- 2026-07-31 — a inativação passou a banir a identidade no Supabase Auth e o
  `AuthGuard` passou a validar o status local em todas as rotas protegidas, para
  bloquear também sessões emitidas antes da inativação.
