---
description: Implementar um plano do HMS com validação incremental e respeito à arquitetura do monorepo.
---

# Prompt: Implementar Plano

**Objetivo:** executar um plano de implementação do HMS de forma incremental,
atualizando o checklist, preservando os limites entre `packages/core`,
`apps/server` e `apps/web`, e validando cada unidade antes de avançar.

## Entrada

- Plano fornecido explicitamente; ou
- um único plano em `documentation/features/**/plans/*-plan.md`.

Se houver mais de um plano plausível, peça o caminho correto. Não use
`documentation/plan.md` como convenção automática: o plano fica ao lado da spec
que o originou.
Leia e preserve a lista `jira_tickets` da spec/plano. Ela pode conter uma ou
mais chaves ou URLs; use-a para manter rastreabilidade, sem alterar o status dos
tickets automaticamente.

## Pré-check obrigatório

Leia `AGENTS.local.md`, o plano inteiro e a spec referenciada. Consulte antes de
editar:

- `documentation/modules.md` — módulo proprietário e limites;
- `documentation/architecture.md` — fluxo atual;
- `documentation/infrastructure.md` — bibliotecas e integrações aprovadas;
- `documentation/tooling.md` — comandos pnpm, Turborepo, migrations e arquivos
  gerados;
- `documentation/design.md` — sempre que tocar UI, estilo ou comportamento
  visual;
- `documentation/rules/core-package-rules.md` — sempre que tocar
  `packages/core`;
- `documentation/rules/commit-rules.md` — somente se houver commit solicitado.

Quando houver `jira_tickets`, leia todos os tickets associados se a integração
Jira estiver disponível e confirme que o plano cobre os critérios de aceite de
cada um. Se algum ticket não puder ser consultado, registre a limitação sem
descartar sua chave.

Pesquise a codebase com `rg --files` e `rg` antes de criar ou alterar arquivos.
Confirme caminhos, exports, assinaturas e implementações similares. O plano é
a fonte da ordem de execução, mas a codebase é a fonte da verdade sobre o que
existe.

## Regra de camada

Antes de cada tarefa:

1. identifique o workspace e a camada da tarefa;
2. leia as regras e a documentação aplicáveis;
3. confirme as dependências e o resultado observável;
4. só então edite os arquivos.

Não invente uma rule inexistente. Quando não houver uma regra específica para a
camada, siga os padrões dos arquivos vizinhos e registre a lacuna se uma nova
convenção for necessária.

## Ordem de implementação

Respeite as dependências do plano e, quando houver dependência entre camadas,
use esta ordem:

1. `packages/core`: entidades, structures, erros, eventos, interfaces e use
   cases, mantendo o core agnóstico de framework e infraestrutura;
2. `apps/server`: schema/migration, repositories, providers e adaptadores;
3. `apps/server`: controllers REST NestJS, validação de entrada e respostas;
4. `apps/web`: cliente da API, rotas TanStack Router, widgets, hooks e estados
   de interface.

Uma tarefa consumidora nunca deve ser implementada antes do contrato que ela
consome. Tarefas declaradas como paralelas só podem ser executadas em paralelo
quando não compartilharem arquivos ou dependências; se não houver suporte de
orquestração, execute-as sequencialmente mantendo a mesma ordem lógica.

## Ciclo por tarefa

Para cada tarefa pendente:

1. leia o resultado observável e os caminhos reais;
2. localize um padrão semelhante;
3. implemente somente o escopo da tarefa;
4. para tarefas de teste (`t`), cubra os cenários descritos e o comportamento
   de erro relevante;
5. execute a validação do workspace afetado;
6. corrija falhas antes de avançar;
7. marque a tarefa como `[x]` no plano e registre arquivos alterados.

Não marque uma tarefa como concluída apenas porque o código compila. O resultado
observável e os testes previstos também precisam estar atendidos.

## Regras específicas do HMS

- Em `packages/core`, respeite `core-package-rules.md`: um tipo exportado por
  arquivo, contracts em `interfaces`, regras de negócio em use cases e `id`
  somente em entities.
- Em `apps/server`, use NestJS e REST. Não introduza Hono, RPC ou outro
  transporte sem uma decisão documentada e aprovada.
- Migrations Drizzle ficam em `apps/server/src/shared/database/migrations/`.
  Após mudanças de schema, gere a migration com
  `pnpm --filter server db:generate`, revise o SQL e aplique-a apenas no
  ambiente local apropriado com `pnpm --filter server db:migrate`.
- Não edite `apps/web/src/routeTree.gen.ts` manualmente. Depois de criar ou
  remover uma rota, execute `pnpm --filter web generate-routes`.
- UI deve usar os tokens e padrões de `documentation/design.md`, incluindo
  light/dark, tipografia, contraste, responsividade e estados de carregamento,
  erro e vazio.
- Antes de adicionar dependências, consulte `documentation/infrastructure.md`.
  Antes de alterar scripts, configs ou arquivos gerados, consulte
  `documentation/tooling.md`.
- Não acesse banco ou providers externos diretamente pela UI; passe pelo
  contrato exposto pelo server.

## Validação

Use os scripts existentes. Para uma tarefa em um workspace, rode pelo menos:

```bash
pnpm --filter @hms/core lint
pnpm --filter @hms/core check-types
pnpm --filter @hms/core test
```

```bash
pnpm --filter server lint
pnpm --filter server check-types
pnpm --filter server test
```

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
```

Substitua o bloco pelo workspace afetado; não execute scripts que não existem
no `package.json`. Ao terminar a fase, valide as dependências acumuladas. Ao
terminar o plano, execute:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Se a mudança tocar a formatação, use `pnpm format` ou o formatter Biome
documentado. Não use outro formatter e não ignore hooks.

Para UI, se houver ambiente browser disponível, valide a rota principal, estados
de loading/error/empty/content, console e responsividade. Se não houver browser
disponível, execute os testes existentes e registre a validação visual como
pendente; não alegue que ela foi feita.

## Atualização documental

Ao concluir todas as tarefas, verifique se a implementação exige atualização:

- **Spec:** comportamento, contrato, persistência, decisão técnica ou critério
  de validação divergente;
- **`documentation/architecture.md`:** novo fluxo, fronteira, módulo,
  integração ou responsabilidade entre workspaces;
- **`documentation/modules.md`:** mudança de responsabilidade de domínio;
- **`documentation/design.md`:** novo token ou padrão visual reutilizável;
- **`documentation/infrastructure.md`:** nova integração, biblioteca ou
  decisão de stack;
- **`documentation/tooling.md`:** novo script, processo, arquivo gerado ou
  comando de desenvolvimento;
- **`documentation/rules/`:** nova regra recorrente, especialmente para o core.

Faça alterações cirúrgicas. Se nada se aplicar, registre explicitamente:
`Spec: sem alterações necessárias.` e o mesmo formato para cada documento
avaliado.

## Saída esperada

Entregue:

- plano com checkboxes atualizados;
- lista completa de `jira_tickets` preservada no reporte;
- resumo por fase, incluindo arquivos criados/alterados;
- comandos de validação executados e resultados;
- spec e documentação estrutural atualizadas, ou justificativa de que não eram
  necessárias;
- pendências, falhas pré-existentes e próximos passos.

Não faça commit, push ou abra PR automaticamente. Só execute essas ações se o
usuário solicitar; quando solicitado, siga `documentation/rules/commit-rules.md`
e os prompts de commit/PR do repositório.
