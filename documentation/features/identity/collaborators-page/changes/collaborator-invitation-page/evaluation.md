---
title: Avaliação — tela dedicada de convite do colaborador
spec: ./spec.md
parent_spec: ../../spec.md
status: completed
spec_revision: 1
last_updated_at: 2026-07-31
---

# Evidências

| Área | Sensor | Resultado |
|---|---|---|
| Rota | `pnpm --filter web generate-routes` | `/convite` gerada no route tree |
| Core | `pnpm --filter @hms/core check-types` | passou |
| Server | `pnpm --filter server check:types` | passou |
| Web | `pnpm --filter web check:types` | passou |
| Playwright | `http://localhost:3000/convite` em 1440×900 | tela `DlEfU` renderizada sem 404 |
| Playwright | `/convite` sem sessão | alerta `Link de convite inválido ou expirado.` e formulário bloqueado |
| Redirect | controllers de cadastro e reenvio | apontam para `${HMS_WEB_APP_URL}/convite` |

# Limitações

- O fluxo completo de atualização da senha ainda depende de um link real emitido
  pelo Supabase local.
- Build local não foi executado, conforme decisão explícita da task; Quality Gate
  e build do CI permanecem necessários antes de marcar a mudança como concluída.

# Veredito

`accepted` — a rota e a tela estão implementadas; sensores, Quality Gate e build
do CI passaram no HEAD `16c2a3b`. O link real de e-mail continua dependente da
infraestrutura de entrega do ambiente, conforme limitação registrada.
