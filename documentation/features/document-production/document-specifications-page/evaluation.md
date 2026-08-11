---
spec: ./spec.md
spec_revision: 7
status: in_progress
commit: working tree (uncommitted)
---

# Evaluation — Página de modelos de documentos

## Veredito atual

Implementação aceita pelos Judges e sensores específicos da feature. A Spec
permanece `in_progress` porque ainda não há Quality Gate/PR CI verde registrado
para o HEAD atual. O Quality Gate local, o teste de Intake e o Playwright
mockado passaram. Não há finding de produto ou arquitetura bloqueante na
feature.

## Matriz de evidências reais

| Requisitos / critérios | Evidência | Veredito |
|---|---|---|
| SR-001 / CA-01–02 | Controller REST com `AuthGuard` + `ActiveAdminGuard`; teste REST dedicado 7/7; login real do administrador e rota protegida | aceito |
| SR-002 / CA-03–04 | Projeção core, DTO, componente de tabela e teste web; resposta real contém `isRequired`/`status`; DOM real contém `Obrigatório`/`Opcional` e `Disponível`; headers são `Modelo`, `Aplicação`, `Obrigatoriedade`, `Estado`, `Ação`, sem `Atualizado` | aceito |
| SR-003 / CA-05 | Caso de uso, repository com busca por nome/descrição e fluxo real `Contrato` com request 200 | aceito |
| SR-004 / CA-06–09 | Schema Zod, filtros REST combinados, correlação área/tema no teste 7/7 e filtro real por área; tema dependente é habilitado após selecionar área | aceito |
| SR-005 / CA-10–12 | Repository com contagem separada, ordenação estável e paginação; teste REST cobre filtros/paginação/ordenação | aceito |
| SR-006 / CA-13–14 | Rota real sincroniza `search`, `legalAreaId`, `page` e `pageSize`; alteração de busca e área reinicia a página | aceito |
| SR-007 / CA-15–17 | Estados loading/error/empty-base/empty-filtered/content no componente e testes web; retry coberto no teste de página | aceito |
| SR-008 / CA-18 | IDs jurídicos persistidos como referências; resolução por `LegalExpertiseCatalogProvider`; revisão de imports e FKs sem acesso à persistência do Catálogo | aceito |
| SR-009 / CA-19–21 | Testes de composição, rota e layout; login/consulta reais, filtro e viewport 390×844; foco e nomes acessíveis presentes no snapshot; DOM confirma textos omitidos pela serialização do snapshot | aceito com observação de ferramenta |
| SR-010 / CA-22–23 | `Documentos` somente no array administrativo, rota canônica e testes de `useAppLayout`; fluxo real alcança a rota protegida | aceito |

## Sensores executados

| Comando / evidência | Resultado |
|---|---|
| `pnpm format` | passou; formatou 1.348 arquivos e corrigiu 8 arquivos |
| `pnpm lint` | passou; core e validation sem erros |
| `pnpm check-types` | passou nos packages roteados pelo script raiz; `server check:types` e `web check:types` também passaram |
| `pnpm --filter server check:code` | passou, 262 arquivos |
| `pnpm --filter web generate-routes` | passou com aviso não bloqueante sobre `routes/modelos-de-documentos/index.test.ts` |
| `pnpm --filter web check:code` | passou com 6 warnings preexistentes fora da feature |
| `pnpm --filter server exec vitest run src/document-production/rest/controllers/tests/list-document-specifications.controller.test.ts` | passou, 7/7 |
| `pnpm --filter server exec vitest run src/intake/rest/controllers/tests/list-intakes.controller.test.ts --reporter=verbose` | passou, 2/2; o resultado anterior `total: 3` não foi reproduzido |
| `pnpm test` | passou nos 4 workspaces: Core 25 arquivos/110 testes, Validation 7/19, Server 30/90 e Web 39/164 |
| `pnpm --filter web exec playwright test` | passou, 38/38; o teste mockado da feature alcançou a rota protegida e validou a query `search` |
| `pnpm build` | passou; server webpack e web Vite/Nitro concluídos; repetiu apenas o aviso do arquivo de teste na árvore de rotas |
| Browser real, sem `page.route` | preflight Docker/Auth/Server saudável; login fresco; rota, busca, filtro, URL, API 200 e viewport estreito validados |

## Juízes

### Judge Plan

`accepted` na segunda tentativa. JP-01–JP-04 foram resolvidos no Plan,
incluindo separação entre Playwright mockado e fluxo real, dependências das
fases, contratos/fixture e recuperação de migration.

### Judge Implementation

`accepted` na segunda tentativa, sem findings bloqueantes. A primeira tentativa
falhou com JI-01–JI-04; Builder Fix corrigiu ordenação normalizada, UUIDs,
momento global e chaves/representação da persistência. Os sensores REST e o
preflight posteriores passaram.

## Findings e limitações

| ID | Estado | Classificação | Evidência / ação |
|---|---|---|---|
| R-009 / R-011 | resolvido | suíte global | `pnpm test` integrado passou nos 4 workspaces; a falha anterior de Intake não foi reproduzida |
| R-010 | resolvido | harness Playwright mockado | `pnpm --filter web exec playwright test` passou 38/38 com o `webServer` oficial e as variáveis isoladas do Playwright |
| R-012 | resolvido como limitação de ferramenta | transporte Playwright | MCP real funcionou nesta validação após login fresco; não é falha de produto |
| R-013 | não bloqueante | configuração de geração de rotas | `index.test.ts` dentro de `routes/` gera aviso; build e geração passam; deve ser renomeado/excluído em manutenção futura |
| R-014 | não bloqueante | serialização do snapshot | Snapshot omitiu conteúdo de duas células, mas API, `innerText`, estilos computados e DOM real confirmam os valores |
| R-015 | classificado, não bloqueante | ambiente/sessão | Refresh token stale retornou 400 antes do login fresco; após autenticar novamente, requests da feature foram 200. Warning de state update aponta para `RootLayout`, fora do escopo |
| R-006 | ativo, não bloqueante | worktree | Alterações de Intake e documentação global permanecem fora do commit desta Spec e não serão revertidas nem incluídas especulativamente |

## Alinhamento documental e arquitetural

- O PRD canônico Confluence 2588673, versão 6, e o Jira SCRUM-134 foram lidos;
  confirmam busca, filtros por área/tema/momento/estado, paginação, estados,
  ações e ausência da coluna `Atualizado`.
- `documentation/modules.md`, `documentation/design.md`,
  `documentation/infrastructure.md`, `documentation/tooling.md` e as Rules
  roteadas permanecem alinhados ao diff.
- Produção Documental mantém ownership dos modelos e consulta somente o
  provider público do Catálogo Jurídico; não houve alteração de fronteira,
  Contract global ou regra normativa.
- Jira/Confluence não foram alterados e o status de SCRUM-134 não foi mudado.

## Handoff

Antes de marcar a Spec como `completed`, é necessário obter CI verde no PR,
resolver os checks bloqueantes do branch e registrar o hash do commit avaliado
neste arquivo e na Spec. Até lá, o veredito operacional permanece
`in_progress`, com a implementação da feature aceita e os findings acima
classificados.
