---
description: Validar uma implementação do HMS, consolidar a documentação e preparar o resumo da spec.
---

# Prompt: Concluir Spec

**Objetivo:** verificar a implementação guiada por uma spec do HMS, corrigir
regressões dentro do escopo, consolidar os documentos afetados e produzir um
resumo claro para revisão.

## Entrada

- **Spec técnica:** `documentation/features/<modulo>/<feature>/specs/<nome>-spec.md`;
- **Plano, quando existir:** `documentation/features/<modulo>/<feature>/plans/<nome>-plan.md`;
- **Tickets Jira:** todos os tickets listados em `jira_tickets` na spec/plano;
  a lista pode conter uma ou mais chaves ou URLs;
- **Codebase e histórico da implementação.**

Se a spec ou o plano tiverem caminhos diferentes, use os caminhos fornecidos
explicitamente. Não assuma a existência de `documentation/plan.md`,
`documentation/features/**/prd.md` ou de um workspace `studio`.
Preserve todos os tickets Jira na conclusão. Quando a integração estiver
disponível, confira cada ticket e seus critérios de aceite; não altere o status,
comente ou feche tickets automaticamente sem instrução explícita.

## Leitura obrigatória

Antes de validar, leia `AGENTS.local.md`, a spec, o plano quando houver e:

- `documentation/modules.md`;
- `documentation/architecture.md`;
- `documentation/infrastructure.md`;
- `documentation/tooling.md`;
- `documentation/design.md`, se houver UI;
- `documentation/rules/core-package-rules.md`, se houver mudança em
  `packages/core`;
- `documentation/rules/commit-rules.md`, somente se o usuário solicitar commit.

Não cite nem procure rules de camadas que não existem no repositório. Avalie a
implementação pelos padrões atuais e pela documentação real do HMS.

## Fase 1 — Verificação

Conclua esta fase antes de fechar a spec.

### 1. Testes e cobertura

1. Verifique as tarefas de teste do plano, se houver: cada tarefa correspondente
   deve estar marcada como `[x]` e ter um arquivo de teste real.
2. Confirme que os cenários descritos nos resultados observáveis estão cobertos.
3. Para implementação direta sem plano, derive a cobertura da spec e dos
   comportamentos alterados.
4. Teste o comportamento público que consome repositories, providers, mappers e
   migrations; não crie testes artificiais para detalhes internos isolados.

Use os scripts reais:

```bash
pnpm test
```

Para feedback mais rápido, use os workspaces afetados:

```bash
pnpm --filter @hms/core test
pnpm --filter server test
pnpm --filter web test
```

No server, use `pnpm --filter server test:e2e` quando a spec exigir validação de
integração HTTP. Registre falhas pré-existentes separadamente, com evidência.

### 2. Lint, typecheck e build

Execute:

```bash
pnpm lint
pnpm check-types
pnpm build
```

Se a mudança tocar apenas um workspace, valide-o primeiro com os scripts
equivalentes documentados em `documentation/tooling.md`, mas faça a validação
final considerando os workspaces afetados. Não use `npm run codecheck`,
`npm run typecheck` ou `quality-gate`: esses scripts não existem no HMS.

Se a formatação estiver incorreta, use o Biome documentado (`pnpm format` ou o
formatter do workspace) e reexecute a validação. Não use `--no-verify`.

### 3. Requisitos e limites arquiteturais

Compare cada requisito da spec com o código e registre o resultado. Verifique
especialmente:

- responsabilidade correta do módulo em `documentation/modules.md`;
- `packages/core` sem dependência de framework ou infraestrutura;
- regras de `core-package-rules.md` respeitadas;
- controllers REST sem lógica de negócio indevida;
- UI consumindo o server por contrato, sem acesso direto a banco/provider;
- schemas de entrada sem campos controlados pelo server;
- auth, autorização e ownership na borda adequada;
- migrations Drizzle revisadas e com impacto documentado;
- jobs/integrações externas idempotentes quando aplicável;
- estados de UI, contraste, responsividade e dark mode conforme
  `documentation/design.md`.

Corrija violações introduzidas pela implementação e repita os checks afetados.
Não amplie o escopo para refatorações não necessárias.

### 4. Revisão de qualidade

Revise os arquivos alterados procurando nomeação inconsistente, duplicação,
imports desnecessários ou circulares, `any` em entradas públicas, logs de
debug, tratamento de erro ausente, contratos quebrados e arquivos gerados
editados manualmente. Em rotas web, nunca edite `src/routeTree.gen.ts` à mão;
gere-o com `pnpm --filter web generate-routes`.

## Fase 2 — Consolidação documental

Execute somente depois de a verificação estar concluída.

### 1. Spec

Atualize os metadados:

```yaml
status: closed
last_updated_at: <YYYY-MM-DD>
```

Não reescreva a spec. Registre alterações relevantes de comportamento,
contrato, decisão ou validação na seção apropriada, se ainda não estiverem
documentadas.

### 2. PRD no Confluence

O PRD do HMS vive na página do Confluence indicada pelo campo `prd` da spec.
Atualize essa página somente se a implementação alterar ou refinar
comportamento de produto, escopo, critério de aceite ou limitação conhecida.
Use a integração Atlassian disponível e linguagem de produto, não detalhes de
implementação.

Nunca crie ou trate `documentation/prds/<modulo>.md` como fonte de verdade. Se
a página do Confluence não estiver acessível, registre a pendência e não
invente uma atualização local.

Se a implementação apenas cumprir o PRD do Confluence, registre no resumo:
`PRD: sem alterações além da marcação de conclusão.`

### 3. Documentação estrutural

Verifique e atualize apenas quando aplicável:

- `documentation/architecture.md` — fluxo, fronteira, integração ou camada
  nova;
- `documentation/modules.md` — responsabilidade ou limite de módulo alterado;
- `documentation/design.md` — token ou padrão visual reutilizável novo;
- `documentation/infrastructure.md` — dependência ou integração nova;
- `documentation/tooling.md` — script, configuração, migration ou processo
  novo;
- `documentation/rules/` — convenção recorrente nova, principalmente no core.

Se não houver mudança necessária, registre explicitamente `sem alterações
necessárias` para cada documento avaliado.

## Fase 3 — Resumo para revisão

Produza o seguinte conteúdo em PT-BR:

```md
## O que foi feito

<mudanças objetivas e arquivos principais>

## Por que foi feito assim

<decisões técnicas e trade-offs relevantes>

## O que mudou em relação à spec original

<desvios; ou “Nenhum desvio em relação à spec original.”>

## Cobertura de testes

<testes executados, cenários cobertos e lacunas residuais>

## Validação

- `pnpm lint` — <resultado>
- `pnpm check-types` — <resultado>
- `pnpm test` — <resultado>
- `pnpm build` — <resultado>
- Browser/UI, quando aplicável — <rota, fluxo e resultado>

## Pontos de atenção para o revisor

<migrations, contratos, side effects, integrações externas, limitações>

## Documentação

- Spec: <atualizada ou sem alterações necessárias>
- PRD: <atualizado ou sem alterações necessárias>
- Arquitetura/módulos/design/infrastructure/tooling/rules: <resultado>

## Tickets Jira

- <PROJ-123> — <resultado, ou “não alterado”>
- <PROJ-456> — <resultado, ou “não alterado”>

## Checklist final

- [ ] Requisitos da spec conferidos
- [ ] Testes passando
- [ ] Lint passando
- [ ] Typecheck passando
- [ ] Build passando
- [ ] Spec fechada com `status: closed`
- [ ] Documentação afetada atualizada
- [ ] Pendências e falhas pré-existentes registradas
```

## Fase 4 — Commit e Pull Request

Esta fase é obrigatória depois que a Fase 3 estiver completa e o checklist não
tiver pendências bloqueadoras. O objetivo final do `conclude-spec` é deixar a
implementação commitada, publicada e com Pull Request aberto.

### 1. Preparar o commit

Use `documentation/prompts/commit-code-prompt.md` como instrução operacional.
Antes de criar o commit:

- inspecione `git status`, `git diff` e o diff staged;
- inclua somente arquivos pertencentes à spec atual;
- preserve alterações pré-existentes, arquivos `.env`, segredos e artefatos
  locais;
- agrupe as alterações de forma atômica quando houver intenções independentes;
- use Conventional Commits, conforme `documentation/rules/commit-rules.md`;
- nunca use `--no-verify`, `--amend` ou comandos destrutivos sem autorização.

Crie o(s) commit(s) com hooks habilitados e registre hash, mensagem e arquivos
incluídos. Se commitlint ou outro hook falhar, corrija a mensagem ou o conteúdo
e tente novamente; não contorne o hook.

### 2. Publicar a branch

Confirme que a branch é uma branch de trabalho válida, não `main` ou `develop`,
e que o alvo do PR será `develop`. Publique a branch:

```bash
git push -u origin <branch-name>
```

Se o push falhar, não abra um PR incompleto; registre o erro e pare nesta fase.

### 3. Criar o Pull Request

Use `documentation/prompts/create-pr-prompt.md` para gerar o título em PT-BR e
o corpo estruturado. Crie o PR exclusivamente com GitHub CLI, direcionado a
`develop`:

```bash
gh pr create \
  --base develop \
  --head <branch-name> \
  --title "<título em PT-BR>" \
  --body-file <arquivo-do-corpo>
```

Não use GitHub MCP nem invente número de PR. Após a criação, obtenha o número e
a URL reais:

```bash
gh pr view --json number,url
```

### 4. Solicitar revisão automatizada

Depois que o PR estiver publicado, solicite a revisão automatizada usando o
número real retornado pelo GitHub:

```bash
gh pr comment <numero-do-pr> --body "@codex review"
```

Se não for possível criar o PR ou publicar a branch, informe claramente a etapa
que falhou e não declare a conclusão da spec como completa.

### Saída adicional obrigatória

Ao final, informe:

- hashes e mensagens dos commits;
- branch publicada;
- URL e número do Pull Request;
- todas as chaves/URLs de `jira_tickets` associadas à spec;
- resultado da solicitação `@codex review`;
- quaisquer alterações locais preservadas, falhas ou pendências.
