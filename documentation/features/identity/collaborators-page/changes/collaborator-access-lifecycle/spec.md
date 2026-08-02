---
title: Ciclo de acesso e detalhes do colaborador
status: completed
revision: 1
sources:
  - type: direct-request
    ref: codex-task
    role: delivery_scope
parent_spec: ../../spec.md
parent_plan: ../../plan.md
evaluation: ./evaluation.md
last_updated_at: 2026-07-31
---

# Contexto e objetivo

O menu de ações da tabela deve permitir consultar os detalhes e administrar o
ciclo de acesso do colaborador, incluindo reativação, cancelamento de convite e
remoção segura de convites cancelados.

# Contract

- `Ver detalhes` deve permanecer disponível para colaboradores ativos,
  convidados e desabilitados e abrir `/colaboradores/:collaboratorId`.
- `POST /collaborators/:collaboratorId/reactivate` deve reativar somente uma conta
  `disabled` que já tenha acessado a plataforma, retornando-a para `active`.
- `POST /collaborators/:collaboratorId/invitation/cancel` deve aceitar somente
  `invited`, bloquear o acesso e manter o colaborador para auditoria operacional.
- `DELETE /collaborators/:collaboratorId` deve remover somente um convite
  cancelado, identificado por `disabled` sem `lastAccessAt`; deve remover a conta
  Auth, a tentativa de cadastro, o colaborador e suas associações locais.
- Cada operação deve exigir um administrador ativo e ter dialog de confirmação
  quando alterar ou remover o estado.

# Estados da UI

| Estado | Ações disponíveis |
|---|---|
| `active` | Ver detalhes, Editar, Inativar |
| `invited` | Ver detalhes, Editar, Reenviar convite, Cancelar convite |
| `disabled` com `lastAccessAt` | Ver detalhes, Editar, Reativar |
| `disabled` sem `lastAccessAt` | Ver detalhes, Editar, Remover colaborador |

# Validação

- testes de use case, REST, serviço e widget;
- typecheck e Biome de Core, Server e Web;
- nenhuma alteração de senha ou acesso direto do navegador ao service role;
- build local não executado por decisão explícita da task; Quality Gate e build
  permanecem gates do CI.
