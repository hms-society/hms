---
spec: ./spec.md
plan: ./plan.md
spec_revision: 3
status: completed
prd: https://plataformahms.atlassian.net/wiki/spaces/~712020e69febeaca304dffb2d8d156ea17d2c4/pages/2719765/PRD+M+dulo+de+Intake
jira_tickets:
  - SCRUM-133
---

# Evaluation — Listagem operacional de Intakes

## Estado

Implementação concluída. F1–F5 e RF-17–RF-19 estão verificadas; Judge
Implementation Final aceito na tentativa 2.

Após a revisão 3, o acesso foi simplificado para exigir somente autenticação.
Foram removidos o guard, use case, middleware e testes exclusivos de atendente;
administração, advogado e atendente autenticados usam a mesma política de leitura.

## Evidências por fase

F1 — 2026-08-03: `@hms/core` lint, check-types e test passaram; 20 arquivos e
91 testes, incluindo os use cases de listagem e responsáveis.
F2 — 2026-08-03: core lint/check-types/test passaram (19/97); server
check:code/check:types/test passaram (22/69). Dois findings de fixture foram
corrigidos por Builder Fixes; o reader e a matriz de autorização passaram.
F3 — 2026-08-03: use cases foram movidos para `packages/core/src/intake/use-cases/`
com testes unitários; server check:code/check:types/test passaram (21/60) e os
testes HTTP focados passaram (3/3). Findings F3-01 e F3-02 resolvidos.
F4 — 2026-08-03: route generation passou; web suite 29/125; index integration
6/6; detail integration 4/4 via `--grep`; check:code/types verdes.
Seis warnings Biome e hydration mismatch no redirect para login foram
classificados como preexistentes/fora da feature.

## Findings de implementação

- F2-01 (2026-08-03): fixture do caso `lawyer` exige referência de área
  jurídica válida; Builder Fix acionado. Não é falha do guard em produção.
- F2-02 (2026-08-03): fixture de Intake deixou campos de encerramento
  aleatórios em status não encerrado; teste do reader falhou na constraint do
  banco. Builder Fix acionado para o setup.
- F2-01 e F2-02 resolvidos em 2026-08-03; nenhum finding aberto de F2.
- F3-01 (2026-08-03): fixture HTTP não forneceu o token de
  `CollaboratorsRepository` exigido pela política anterior de atendente; o
  guard exclusivo foi removido conforme decisão do usuário e a composição foi
  revalidada somente com `AuthGuard`.
- F3-02 (2026-08-03): `IdentityModule` exportou diretamente um token provido
  pelo `IdentityDatabaseModule`; Nest falhou no bootstrap. Builder Fix
  acionado.
- F3-01 e F3-02 resolvidos em 2026-08-03; nenhum finding aberto de F3.
- F4-01 a F4-07 resolvidos em 2026-08-03; hydration mismatch permanece como
  observação não bloqueante para o Quality Gate.
- F4-01 (2026-08-03): implementação web parcial sem RF-15/RF-16 e sem
  sensores concluídos; Builder Fix/sensores acionados.
- F4-02 (2026-08-03): web check:types falhou em `initialFocus` do calendário e
  no tipo de label de opção de filtro; Builder Fix acionado.
- F4-03 (2026-08-03): testes RF-15/RF-16 criados, mas check:types/code falhou
  nos próprios fixtures/assertions; Builder Fix acionado.
- F4-04 (2026-08-03): integração do índice 1/4 passou; 3 casos falharam em
  clipboard/estado de erro/vazio. O comando do detalhe não encontrou o arquivo
  com `$` literal; Builder Fix acionado.
- F4-05 (2026-08-03): instrumentação mostrou nulos serializados pelo adapter e
  mock 500 durante retries; Builder Fix acionado. Hydration mismatch no
  redirect permanece observado e deve ser classificado no navegador final.
- F4-06 (2026-08-03): índice passou após retry manual; detalhe ainda tinha
  retry automático no erro. Builder Fix acionado; hydration mismatch permanece
finding de navegador.
- F5-01 (2026-08-03): navegador real autenticado revelou que `Limpar filtros`
  não altera a URL/consulta; Builder Fix acionado. REST/Auth e preflight
  estavam verdes. Hydration mismatch permanece observado.
- F5-01 e F5-02 resolvidos em 2026-08-03; a validação real confirmou a
  limpeza sem filtro após a correção. RF-19 ficou verde após o Quality Gate.
- RF-19 — 2026-08-03: core 20/91, server 21/60 e web 29/125 passaram em
  lint/types/test; route generation passou; integração do índice passou 6/6;
  detalhe passou 4/4 via `--grep`; `pnpm build` passou para server e web. O
  check de código web reportou apenas seis warnings já
  existentes em arquivos fora da feature.

## Judge Implementation Final

Tentativa 1 — `failed`: JI-02 (linha não operável), JI-03 (Link fora do
wrapper Anchor) e JI-04 (escopo de middleware) foram corrigidos pelo Builder
Fix. JI-01 foi falso positivo: `.codex/skills/create-pr/SKILL.md` já estava
alterado antes da feature e permaneceu intocado, conforme FND-05. Após a
correção: web 124 testes, índice 6/6, detalhe 3/3, build verde; navegador real
confirmou `/intakes` autenticado e `/intakes/novo` preservado.

Tentativa 2 — `accepted`: nenhum finding bloqueante; CA-01–CA-20 aceitos.
O middleware preserva `/intakes/novo`, a linha é operável por clique/teclado,
a navegação interna usa `Anchor` e o Quality Gate/build permanecem verdes.

Revisão 3 — 2026-08-03: controllers de listagem, responsáveis e detalhe usam
somente `AuthGuard`; `/intakes` e o detalhe usam `requireAuthMiddleware`.
Core passou com 20 arquivos/91 testes; server code/types passaram; server
integração de controllers passou 3 testes focados e a suíte completa passou
21 arquivos/60 testes; web index passou 6/6 e detalhe 4/4. O build de server
e web passou. Nenhuma referência aos artefatos de autenticação exclusiva de
atendente permanece no código.

## Quality Gate final — 2026-08-03

Validação executada no worktree atual após `pnpm format` (1193 arquivos, sem
alterações de formatação):

| Sensor | Resultado |
|---|---|
| `pnpm lint` | passou; core e validation sem findings novos |
| `pnpm check-types` | passou em core, validation, server e web |
| `pnpm test` | passou; core 20/91, web 29/125, server 21/60 |
| `pnpm --filter web generate-routes` | passou |
| `pnpm build` | passou para server e web |
| `git diff --check` | passou |

### Browser integration final

Com Docker/Auth/banco saudáveis e sessão seed `admin@hmsadvogados.com.br`, a
validação autenticada em `http://localhost:3000` confirmou login, `/intakes`
com dados reais (25 registros), tabs e contagens, busca com URL
`?search=INT-0046`, cópia acessível de `INT-0046`, navegação para o boundary
`/intakes/1015e034-d01f-4dca-9baa-841802dae318`, viewport de 640px e foco por
teclado. As requisições reais de `/intakes`, `/intakes/responsibles` e
`/collaborators/me` retornaram `200`.

O primeiro ensaio em `3002` foi descartado como falha de ambiente: `3000` e
`3333` já estavam ocupados, o servidor novo terminou com `EADDRINUSE` e o
CORS rejeitou a origem `3002`. Os erros desse ensaio e o `400` de refresh token
da sessão anterior permanecem classificados como artefatos de sessão, não como
falha da feature. No ensaio válido, não houve erro de console novo; permanece
apenas o mismatch de hydration já classificado como preexistente na revisão.

### Veredito final

Quality Gate e build do estado atual passaram. Judge Implementation Final da
tentativa 2 permanece aceito; CA-01–CA-20 estão cobertos e não há finding
bloqueante aberto. A arquitetura permanece alinhada: a consulta composta usa
ports read-only e não duplica dados entre Intake e Identidade; nenhuma migration
foi criada. O PRD canônico de Intake (Confluence, página 2719765, versão 2)
foi verificado e não exige atualização externa.

Commit avaliado: será preenchido após a criação do commit desta entrega.
PR: inexistente no momento da avaliação; revisão automatizada não foi solicitada.
