---
name: conclude-spec
description: Fechar uma Spec com evidências finais, Quality Gate, build, PRs revisados e limite de tamanho respeitado.
---

# Concluir Spec

Conduza o fechamento da Spec na task atual. Não crie nova thread. O fechamento
somente pode ocorrer quando a implementação, a documentação, a validação e a
entrega em PR estiverem coerentes entre si.

## Pré-condições

- Spec em `in_progress` ou pronta para conclusão conforme o fluxo do projeto;
- implementação direta ou todas as fases do Plan aceitas;
- nenhum finding bloqueante pendente;
- Spec, Plan e `evaluation.md` compatíveis com o diff atual;
- alterações da entrega identificadas e separadas de mudanças locais do usuário.

Se a Spec já estiver `completed`, audite o diff e os registros antes de alterar
qualquer coisa. Não reabra ou reescreva evidências sem motivo documentado.

## Quality Gate final

### 1. Descobrir o contexto

Leia `AGENTS.local.md`, `documentation/rules/rules.md`, as Rules aplicáveis,
`documentation/tooling.md`, `documentation/modules.md`, a Spec, o Plan e o
PRD/Confluence quando disponíveis. Refaça a descoberta se a validação alcançar
outra camada.

Defina `PR_BASE` como a base real de cada branch avaliada. Para um PR
independente, normalmente é `origin/develop`; para um PR empilhado, é a branch
remota do PR pai. Confirme a base e o commit avaliado:

```bash
PR_BASE=origin/develop
git status --short
git log -1 --oneline
git diff --stat "$PR_BASE"...HEAD
```

### 2. Verificar o limite de PR

Cada PR da entrega deve ter no máximo **5.000 linhas alteradas**, somando
adições e remoções. Verifique antes de publicar:

```bash
PR_BASE=origin/develop
git diff --numstat "$PR_BASE"...HEAD
git diff --shortstat "$PR_BASE"...HEAD
git diff --numstat "$PR_BASE"...HEAD | awk '{ additions += $1; deletions += $2 } END { print additions + deletions, "linhas alteradas" }'
```

Se ultrapassar o limite, não conclua com um PR monolítico. Divida por
responsabilidade, preferencialmente em PR de backend/core baseado em `develop` e
PR de frontend empilhado sobre ele. Registre na Spec/evaluation:

- a justificativa da divisão;
- branch base e branch head de cada PR;
- ordem de merge;
- commit avaliado de cada PR;
- evidências próprias de cada camada.

Após publicar, confirme no GitHub:

```bash
gh pr view <numero> --json additions,deletions,changedFiles,baseRefName,headRefName,url
```

### 3. Executar sensores

Execute os comandos oficiais no escopo integrado, usando filtros apenas quando
eles preservarem cobertura suficiente:

```bash
pnpm format
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Quando aplicável, execute também:

- `pnpm --filter web generate-routes`;
- testes REST com banco/Testcontainers;
- health checks de Auth e server;
- Playwright autenticado contra serviços reais;
- viewport estreita, teclado, acessibilidade, console e rede para UI.

Para cada comando, registre `passou`, `falhou`, `omitido` ou `bloqueado`, com
causa e impacto. Nunca transforme falha de infraestrutura em aprovação da
feature. Warnings conhecidos devem ser classificados como preexistentes,
corrigidos ou bloqueantes.

### 4. Revisar comportamento e arquitetura

Confirme a matriz de aceite da Spec, incluindo:

- estados de sucesso, vazio, carregamento e erro;
- autenticação e respostas 401/403 quando aplicável;
- contratos REST e serialização de parâmetros;
- fronteiras de módulos e ausência de imports/persistência indevidos;
- migrations, seeders e compatibilidade de dados;
- responsividade, teclado e acessibilidade;
- efeitos colaterais e regressões em fluxos existentes.

Faça a revisão arquitetural documentada nas Rules quando houver mudança de
fronteira ou dependência. Não invente uma convenção global para uma decisão
local; registre lacunas e peça decisão quando a mudança realmente exigir nova
Rule.

### 5. Atualizar evidências

Atualize `evaluation.md` com:

- matriz `CA -> evidência` real;
- sensores e seus resultados;
- validação de navegador/integrada;
- revisão arquitetural e fronteiras;
- findings corrigidos, aceitos, preexistentes e remanescentes;
- resultado do Quality Gate e build do CI;
- links dos PRs, tamanho de cada PR e commits avaliados.

Se houver Plan, crie `Judge Implementation Final` quando houver múltiplas fases,
risco alto, mudança após o último veredito ou divisão em PRs. Em Spec pequena,
o `Judge Implementation Direct` pode ser o veredito final.

Registre na Spec somente o resumo operacional: status, veredito, commit ou
commits avaliados e link para `evaluation.md`. Não duplique a matriz inteira.

## PR e revisão

Crie ou atualize o(s) PR(s) conforme `documentation/prompts/create-pr-prompt.md`:

- título, corpo e respostas em português;
- limite de 5.000 linhas por PR;
- PRs empilhados com dependência e ordem de merge explícitas;
- instruções de teste detalhadas;
- `@codex review` solicitado somente após publicação;
- todas as conversas acionáveis respondidas e resolvidas por thread;
- nenhuma alteração externa em Jira/Confluence sem autorização.

Se o review gerar uma correção, reexecute os sensores invalidados, atualize a
avaliação e troque o commit avaliado. Não finalize com evidência de um HEAD
anterior.

## Critérios de conclusão

Só marque a Spec como `completed` quando todos forem verdadeiros:

- Quality Gate e build do HEAD/PR final passaram;
- cada PR respeita o limite de 5.000 linhas;
- não há conflito com a base;
- o campo técnico `mergeable` está `MERGEABLE`;
- não há conversa acionável aberta ou review bloqueante não respondido;
- `evaluation.md`, Spec e Plan refletem o mesmo estado;
- divergências, riscos aceitos e limitações estão explicitamente registrados.

`REVIEW_REQUIRED` por proteção de branch não é uma falha técnica do Quality
Gate, mas deve ser reportado como pendência de aprovação. Checks em execução,
conflitos, falhas ou threads abertas impedem a conclusão.

Se Quality Gate ou build falhar, mantenha a Spec em `in_progress`, registre a
falha em `evaluation.md`, crie `Builder Fix QG-<n>` quando a correção estiver no
escopo, reexecute sensores invalidados e reavalie o diff. Não marque como
`blocked` apenas porque o trabalho é grande ou CI está demorando.

Depois da conclusão, atualize o Plan quando existir e entregue um resumo com
PRs, commits, evidências, tamanho, estado do CI, conversas resolvidas e
pendências que dependam de aprovação externa.
