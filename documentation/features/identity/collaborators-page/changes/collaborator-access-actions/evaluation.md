---
title: Avaliação — ações administrativas de acesso do colaborador
spec: ./spec.md
parent_spec: ../../spec.md
status: completed
spec_revision: 3
last_updated_at: 2026-07-31
---

# Escopo avaliado

Menu condicional de ações, incluindo detalhes e edição habilitados, reenvio de
convite pendente, inativação de colaborador, bloqueio imediato de autenticação,
integração server-side, mutações REST e dialogs de confirmação.

# Evidências executadas

| Área | Comando/sensor | Resultado |
|---|---|---|
| Core | `pnpm --filter @hms/core check-types` | passou |
| Core | teste focado de ações com banimento/desbanimento | 1 arquivo, 6 testes passaram |
| Server | `pnpm --filter server check:types` | passou |
| Server | `pnpm --filter server check:code` | passou |
| Server | teste focado do provider Supabase Auth | 1 arquivo, 11 testes passaram |
| Server | teste focado do `AuthGuard` | 1 arquivo, 2 testes passaram |
| Web | `pnpm --filter web check:types` | passou |
| Web | teste focado de `identity-service` | 1 arquivo, 6 testes passaram |
| Web | teste focado de `CollaboratorsPage` | 1 arquivo, 2 testes passaram |
| Web | Biome nos arquivos alterados | passou |
| Web | Playwright de rotas Identity com transporte mockado | 13 testes passaram; listagem e detalhe separados por rota |
| Web | Playwright após renomear `$collaboratorId` para `$colaboradorId` | 2 testes focados passaram |
| Pencil | modal de colaborador `R1af6` alinhado ao `SNI0s`, menu `M6VHEL`, modal de reenvio e dialog `RRD4Z` | composição validada sem problemas de layout |

# Matriz de critérios

| Critério | Veredito | Evidência |
|---|---|---|
| CA-01 | `implemented` | botão `…`, itens `Ver detalhes`/`Editar` habilitados conforme `M6VHEL` e ações funcionais condicionais no widget |
| CA-02 | `implemented` | use case, provider explícito, endpoint e mutação REST |
| CA-03 | `implemented` | guarda de status no use case e autorização server-side |
| CA-04 | `implemented` | use case de atualização local, banimento no Supabase Auth, `AuthGuard`, endpoint e invalidação web |
| CA-05 | `implemented` | ramo idempotente sem `updateStatus` quando já `disabled` |
| CA-06 | `implemented` | dialogs controlados, estado pending e erro associado |

# Quality Gate e build

Os sensores focados locais passaram. O Quality Gate e o build do CI passaram no
HEAD `16c2a3b`, incluindo Server/Web/Core e imagens Docker.

# Findings e limitações

1. As respostas `401`/`403`/`409` completas ainda devem ser cobertas no CI de
   integração REST.
2. A sessão administrativa local validou inativação e reativação pelo navegador;
   o acesso de um segundo navegador autenticado como colaborador desabilitado
   ainda deve ser validado no CI.
3. O check global da Web mantém avisos preexistentes fora dos arquivos alterados.
4. Os redirects de rota ainda emitem hydration mismatch preexistente; o warning
   de atualização de estado antes da montagem também aparece no fluxo de edição.
5. A validação Playwright usa `page.route` e não substitui os testes de
   autorização, controller e persistência do Server/Core.

# Decisão

A mudança está concluída e aceita; warnings preexistentes de hydration e estado
pré-mount permanecem não bloqueantes.
