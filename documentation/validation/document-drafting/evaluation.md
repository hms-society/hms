# Avaliação da entrega de redação e revisão documental

Entrega baseada nas solicitações diretas desta conversa. A Spec histórica
`documentation/features/document-production/consultation-document-production-ui/spec.md`
(revisão 24, concluída) permanece preservada; não representa o contrato das mudanças
posteriores desta entrega. Não foram criados tickets ou critérios SDD retroativos.

## Evidências automatizadas

| ID | Comando | Resultado |
| --- | --- | --- |
| EV-01 | `pnpm --filter web test -- src/ui/shared/widgets/layouts/app-layout/tests src/ui/document-production/widgets/pages/consultation-document-review-page/tests src/ui/document-production/widgets/pages/consultation-documents-page/tests` | 61 testes aprovados antes da correção responsiva abaixo; cobertura do diálogo será renovada. |
| EV-02 | `pnpm --filter server test -- src/shared/ai/mastra src/document-production/ai src/shared/provision/env/env-provider.test.ts` | 48 testes aprovados após combinar o seletor OpenAI/Gemini do develop com os fallbacks OpenRouter da redação. Transporte dos modelos e persistência da observabilidade simulados. |
| EV-03 | `pnpm --filter server test -- src/consultation/rest/controllers/tests/review-consultation-document-version.controller.test.ts src/consultation/rest/controllers/tests/list-consultation-documents.controller.test.ts` | 5 testes aprovados com PostgreSQL isolado via Testcontainers, incluindo bloqueio 409 de aprovação com pendências. |
| EV-04 | `pnpm --filter @hms/core test -- src/consultation/use-cases/tests/review-consultation-document-version-use-case.test.ts src/consultation/use-cases/tests/list-consultation-documents-use-case.test.ts` | 6 testes aprovados. |
| EV-05 | `pnpm --filter web exec playwright test tests/routes/document-production/consultation-document-version.test.tsx tests/routes/document-production/consultation-documents.index.test.tsx --reporter=line --trace=on` | 11 testes aprovados; REST/Auth simulados. Inclui geração imediata, abertura da nova versão, link do modelo, visualização durante geração e teclado em 390 × 844. |
| EV-06 | `pnpm --filter server check:types`, `pnpm --filter web check:types`, `pnpm --filter @hms/core check-types` | Aprovados. |
| EV-07 | `pnpm --filter server check:architecture`, `pnpm --filter web check:architecture` | Aprovados; Server integrado: 764 módulos/3549 dependências; Web: 651/2713. |
| EV-08 | `pnpm --filter server check:lint`, `pnpm --filter web check:lint` | Aprovados. Server possui três avisos anteriores fora desta entrega em register-waba-account e check-health; Web sem avisos. |
| EV-09 | `pnpm --filter web build` | Aprovado antes da correção responsiva; avisos anteriores sobre arquivos de testes no diretório de rotas e tamanho de chunks. |

## Evidências manuais e visuais

Pré-requisitos em 2026-10-02: PostgreSQL/Auth saudáveis; Auth `/auth/v1/health`
200; Server iniciado via `pnpm --filter server dev` (sessão 29538), bootstrap
Nest concluído sem UnknownDependenciesException e `/health` na porta local 5555
200; Web `pnpm --filter web dev` (sessão 27606), porta 3000. Storage local
unhealthy e Documenso parado são condições anteriores, sem falha nos requests
exercitados. Credencial resolvida do seeder Identity e `HMS_USER_SEED_PASSWORD`,
sem exportar senha ou token. Não foi executado reset/seed da base local.

| ID | Cenário / referência | Resultado / artefato |
| --- | --- | --- |
| MV-01 | Login real `/login` com administrador, submissão por Enter, destino `/home` e navegação autenticada | Aprovado; sem erro de console, pageerror, requestfailed ou HTTP 4xx/5xx. Script temporário `/tmp/hms-pr-browser.cjs`; trace `/tmp/hms-pr-browser-trace.zip`. |
| VIS-01 | Sidebar, desktop 1440 × 1000; referência do usuário `codex-clipboard-6de72166-7345-41e2-a7b6-e8e90b443bd0.png` | `/tmp/hms-pr-sidebar.png`: width 288 px, todos os itens em uma linha, nomes solicitados preservados. Comparação: mesma hierarquia, ícones, cores e estrutura; largura ampliada conforme solicitação. Verificação DOM sem overflow e altura de texto menor que 30 px. |
| VIS-02 | Diálogo de pendências, desktop 1440 × 1000; referência `codex-clipboard-2b8d7197-9a3d-4a05-b2df-aeef4136af53.png` | `/tmp/hms-pr-pending-desktop.png`: lista/ações anteriores preservadas, ação Preencher e formulário acrescentados conforme solicitação. Campo acessível e Salvar valor habilitado após digitar. |
| VIS-03 | Diálogo de pendências, estado Preencher, viewport suplementar 390 × 844 | `/tmp/hms-pr-pending-mobile.png` captura renovada: modal integralmente dentro da viewport, lista rolável, campo largo, ações empilhadas. A captura anterior foi invalidada (FND-01). |

Abertura realizada na consulta `00000000-0000-4000-8000-000000000102`, documento
`00000000-0000-4000-8000-000000000204`, versão
`00000000-0000-4000-8000-000000000504`. O fluxo manual digitou valor e cancelou,
sem persistir nova versão nem solicitar IA. Persistência/imutabilidade cobertas
pelos testes de hook e REST, não alegadas como fluxo manual completo.

## Achados

| ID | Estado | Disposição |
| --- | --- | --- |
| FND-01 | Resolvido | Modal limitado à altura disponível com rolagem; campo e botões em linhas no viewport estreito. Capturas renovadas e inspecionadas; DOM confirma limites dentro de 390 × 844 e campo com largura maior que 250 px. |
| FND-02 | Resolvido | Estado e handlers movidos para use-pending-markers-dialog conforme ui-layer-rules; testes de componente com hook mockado e testes de hook reais separados. Correção de manutenção direta, sem reabrir a Spec histórica concluída. |
| FND-03 | Limitação do ambiente | Grafana MCP retornou Internal error (-32603) na etapa anterior; ingestão real no Grafana Cloud ainda não verificada. Testes locais com SDK OTel/Mastra reais e exportadores em memória aprovados. |

## CI do PR

Será registrado após a publicação; nenhuma execução remota alegada nesta etapa.

## Renovação após correção

- `pnpm --filter web test -- src/ui/document-production/widgets/pages/consultation-document-review-page/tests`: 31 testes aprovados em 4 arquivos.
- `pnpm --filter web check:types`: aprovado.
- `pnpm exec biome check --write apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/pending-markers-dialog apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/pending-markers-dialog.test.tsx apps/web/src/ui/document-production/widgets/pages/consultation-document-review-page/tests/use-pending-markers-dialog.test.ts`: aprovado.
- `pnpm --filter server build`: aprovado após integração com develop.
- Fluxo real `/tmp/hms-pr-browser.cjs` repetido após correção: aprovado, zero erros de console/rede; screenshots e trace renovados. Enter abre Preencher, Cancelar desfaz o formulário e Fechar encerra o diálogo.
- PRD Produção Documental confirmado via Atlassian HMS: página 2588673, versão 16, parent 2523137; seção 12.5 contém o bloqueio aprovado pelo usuário nesta sessão.
- `pnpm --filter web build`: aprovado novamente após a correção responsiva; log temporário `/tmp/hms-pr-web-build.log`.
