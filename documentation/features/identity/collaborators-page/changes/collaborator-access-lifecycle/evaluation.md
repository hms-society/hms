---
title: Avaliação — ciclo de acesso e detalhes do colaborador
spec: ./spec.md
parent_spec: ../../spec.md
status: completed
spec_revision: 1
last_updated_at: 2026-07-31
---

# Evidências

| Área | Sensor | Resultado |
|---|---|---|
| Core | `pnpm --filter @hms/core check-types` | passou |
| Core | teste focado de ciclo de acesso | 1 arquivo, 6 testes passaram |
| Server | `pnpm --filter server check:code` | passou |
| Server | `pnpm --filter server check:types` | passou |
| Web | `pnpm --filter web check:types` | passou |
| Web | testes focados de menu/ações/REST | 3 arquivos, 15 testes passaram |
| Seed | limpeza de identidade | especialidades, tentativas, colaboradores e usuários são removidos em ordem segura |

# Veredito

`accepted` — implementação, integração HTTP/Auth aplicável, Quality Gate e build
do CI passaram no HEAD `16c2a3b`.
