---
title: Tela dedicada de convite do colaborador
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

O link enviado pelo Supabase para um colaborador convidado deve abrir uma tela
própria, separada da recuperação de senha, conforme o frame `DlEfU` do Pencil.

# Contract

- O redirect de convite deve usar a rota pública `/convite`.
- A rota `/convite` deve renderizar a tela dedicada de definição de senha, com a
  composição visual de `DlEfU`.
- A pessoa convidada deve informar e confirmar a senha; o fluxo deve atualizar a
  senha no Supabase e concluir o primeiro sign-in local da conta convidada.
- Sem sessão válida no link, a tela deve informar que o convite está inválido ou
  expirado e não deve permitir o envio do formulário.
- A recuperação de senha permanece em `/redefinir-senha` e não deve ser
  redirecionada para a tela de convite.

# Validação

- typecheck de Core, Server e Web;
- rota gerada pelo TanStack Router;
- validação Playwright da composição e do estado sem sessão;
- build local não executado por decisão explícita da task; Quality Gate e build
  permanecem gates do CI.

# Fora de escopo

- alteração do template de e-mail do Supabase;
- envio de e-mail fora do Auth administrativo;
- redefinição de senha iniciada pela tela de recuperação.
