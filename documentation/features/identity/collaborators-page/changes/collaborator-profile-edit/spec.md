---
title: Edição de perfil do colaborador
status: completed
revision: 1
source:
  type: direct-request
  ref: codex-task
parent_spec: ../../spec.md
scope:
  - packages/core/src/identity
  - packages/validation/src/identity
  - apps/server/src/identity
  - apps/web/src/rest/services/identity-service.ts
  - apps/web/src/ui/identity/widgets
evaluation: ./evaluation.md
last_updated_at: 2026-07-31
---

# Contexto

A página de colaboradores já permite cadastrar, convidar, reenviar convite e
inativar colaboradores. O item `Editar` permanece desabilitado, embora a gestão
administrativa precise corrigir dados profissionais sem criar uma nova conta.

Esta change implementa a edição dos dados locais do colaborador. O e-mail não é
editável: ele identifica a conta de autenticação e continua sendo administrado
pelo fluxo próprio de identidade.

# Escopo

## Incluído

- editar nome profissional;
- editar cargo/função opcional;
- editar perfil;
- substituir áreas e temas jurídicos de perfis jurídicos;
- remover especialidades ao trocar para perfil administrativo, com confirmação;
- atualizar a ação pela página de listagem e pela ficha de detalhes;
- proteger a operação para administradores ativos e persistir a alteração em uma
  transação única.

## Fora de escopo

- alterar e-mail, senha ou dados diretamente no Supabase Auth;
- reativar, excluir ou cancelar convite;
- editar áreas e temas do catálogo;
- editar dados de contato ainda não existentes no domínio.

# Contract

## RF-01 — Atualizar dados profissionais

Um administrador ativo pode atualizar `professionalName`, `jobTitle`, `profile`
e `legalExpertises` de um colaborador. O e-mail e o status da conta permanecem
inalterados.

## RF-02 — Validar perfil e especialidades

Perfis administrativos não aceitam especialidades. Perfis jurídicos exigem ao
menos uma área com ao menos um tema, sem áreas ou temas repetidos, e todas as
referências precisam estar ativas e pertencer à área selecionada.

## RF-03 — Persistir atomicamente

A alteração dos dados do colaborador e a substituição das associações de áreas e
temas devem confirmar ou falhar juntas. Uma falha não pode deixar especialidades
parcialmente substituídas.

## RF-04 — Expor edição protegida

`PATCH /collaborators/:collaboratorId` exige autenticação e administrador ativo,
valida o payload e retorna o `CollaboratorSummary` atualizado.

## RF-05 — Editar pela interface

O menu `Editar` abre o formulário preenchido com os dados atuais. O mesmo fluxo
deve ser acessível pelo botão `Editar perfil` da ficha. Após sucesso, o modal
fecha, a tabela/ficha é invalidada e a interface informa a conclusão. Enquanto a
operação estiver pendente, o formulário não pode ser submetido novamente.

# Critérios de aceitação

| CA | RF | Dado | Quando | Então | Evidência esperada |
|---|---|---|---|---|---|
| CA-01 | RF-01 | colaborador existente e dados válidos | administrador confirma a edição | resumo retorna os novos dados e e-mail/status permanecem iguais | teste de use case + integração REST |
| CA-02 | RF-02 | perfil administrativo com especialidades | payload é validado | operação é rejeitada sem persistência parcial | teste de schema + use case |
| CA-03 | RF-02 | perfil jurídico com referência inativa, área repetida ou tema incompatível | administrador confirma | operação é rejeitada | teste de use case + integração REST |
| CA-04 | RF-03 | falha ao substituir dados ou associações | transação termina | nenhum dado intermediário permanece | teste de use case/repositório integrado |
| CA-05 | RF-04 | sessão ausente ou ator não administrador ativo | endpoint é chamado | API responde `401`/`403` sem alterar dados | teste de controller |
| CA-06 | RF-05 | linha ou ficha de colaborador | usuário aciona `Editar` | modal abre preenchido e permite salvar alterações | teste de widget + navegador |
| CA-07 | RF-05 | edição concluída | resposta retorna sucesso | modal fecha, consultas são invalidadas e mensagem é exibida | teste de widget/hook |
| CA-08 | RF-05 | formulário com envio pendente | usuário tenta reenviar | controles ficam desabilitados até a resposta | teste de widget |

# Validação

- Biome nos arquivos alterados;
- `check:code` e `check:types` nos workspaces core, server e web;
- testes focados de schema, use case, controller, serviço, hook e widget;
- validação autenticada no navegador para abertura, preenchimento e conclusão;
- build permanece gate do CI e não será executado localmente nesta change.

# Avaliação

As evidências finais serão registradas em
[`evaluation.md`](./evaluation.md) após os sensores e o Judge Implementation.
