---
name: create-pr
description: Criar Pull Requests do HMS via gh, com rastreabilidade, limite de tamanho e validação reproduzível.
---

# Criar PR

Prepare e publique Pull Requests do HMS usando a GitHub CLI (`gh`). O resultado
deve ser pequeno o suficiente para revisão, rastreável à Spec/PRD/ticket e
acompanhado de instruções de teste que outra pessoa consiga executar.

## Regras obrigatórias

- Escreva título, corpo, comentários de acompanhamento e respostas de review em
  português do Brasil. O comando literal `@codex review` é uma exceção técnica.
- Cada PR pode conter no máximo **5.000 linhas alteradas**. Conte adições e
  remoções antes de publicar e confirme o número no GitHub depois da criação.
- Não misture camadas ou responsabilidades sem explicar a dependência no corpo
  do PR.
- Não inclua `.env`, credenciais, artefatos locais ou alterações preexistentes
  do usuário.
- Não declare um teste como aprovado se ele não foi executado; registre o
  comando, o resultado e qualquer limitação de ambiente.
- Não use palavras-chave de fechamento automático para Jira ou GitHub Issues.

## Entrada

- Spec ou Bug Report implementado e validado;
- branch de trabalho baseada em `develop`, ou branch de um PR pai quando a
  entrega for empilhada;
- links do PRD no Confluence e chaves Jira, quando existirem;
- alterações commitadas de forma atômica e sem arquivos da entrega pendentes.

## Fluxo

### 1. Inspecionar contexto e escopo

Leia antes de criar commits ou abrir o PR:

- `documentation/github-flow.md`;
- `documentation/rules/commit-rules.md`;
- `documentation/rules/rules.md` e todas as Rules aplicáveis ao diff;
- `documentation/prompts/commit-code-prompt.md`;
- `.github/pull_request_template.md`;
- a Spec, o Plan e `evaluation.md`, quando existirem.

Consulte o PRD no Confluence e os tickets Jira associados quando a integração
estiver disponível. Preserve as referências; não altere status, comentários ou
critérios de aceite externos sem autorização explícita.

Defina `PR_BASE` como `origin/develop` ou como a branch remota do PR pai quando
esta for uma entrega empilhada. Liste o escopo real com:

```bash
PR_BASE=origin/develop
git status --short
git diff --stat "$PR_BASE"...HEAD
git diff --name-status "$PR_BASE"...HEAD
```

Identifique impacto em `apps/web`, `apps/server`, `packages/core`, banco,
documentação e tooling. Para cada arquivo alterado, consulte o histórico para
registrar autores/codeowners relevantes na seção de alinhamento.

### 2. Verificar o limite de 5.000 linhas

Calcule adições e remoções da branch em relação à base:

```bash
PR_BASE=origin/develop
git diff --numstat "$PR_BASE"...HEAD
git diff --shortstat "$PR_BASE"...HEAD
git diff --numstat "$PR_BASE"...HEAD | awk '{ additions += $1; deletions += $2 } END { print additions + deletions, "linhas alteradas" }'
```

Se o total ultrapassar 5.000 linhas, **não abra um PR único**. Divida a entrega
por responsabilidade semântica. A divisão preferencial é:

1. PR base em `develop` com contratos/core, backend, migrations/seeders e testes
   necessários para expor a capacidade;
2. PR frontend empilhado sobre a branch do primeiro PR, com adapter web, rotas,
   UI, testes de navegador e documentação específica da interface.

Use outras divisões somente quando a arquitetura exigir. Para PRs empilhados:

- o PR filho deve declarar `Depende de #<número>` e usar a branch do PR pai como
  base;
- não crie dependência circular;
- mantenha cada PR com no máximo 5.000 linhas alteradas;
- descreva a ordem de merge e o ajuste da base do PR filho após o merge do pai;
- publique e valide cada branch separadamente.

Depois de criar o PR, confira `additions`, `deletions` e `changedFiles` com:

```bash
gh pr view <numero> --json additions,deletions,changedFiles,url
```

### 3. Validar antes de publicar

Execute o preflight suficiente para o escopo, preferindo os filtros do
workspace quando forem adequados:

```bash
pnpm format
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Para UI, valide também fluxo autenticado real com Playwright quando aplicável:
login, rota protegida, estados principais, viewport estreita, teclado,
console e rede. Para backend/REST, valide health checks, autenticação,
contratos HTTP e integração com banco real quando a suíte exigir.

Registre no PR:

- comandos executados e resultados;
- testes omitidos e motivo;
- warnings preexistentes;
- falhas de infraestrutura separadas de falhas da feature;
- evidências manuais e URLs/rotas exercitadas.

### 4. Preparar commits

Se houver alterações pendentes:

1. inspecione `git status --short`, `git diff` e `git diff --cached`;
2. preserve staged changes e alterações fora do escopo;
3. agrupe por responsabilidade semântica;
4. crie commits atômicos conforme `commit-rules.md`;
5. não use `git add .`, `--no-verify`, `--amend`, rebase ou comandos destrutivos.

Só publique quando os arquivos da entrega estiverem commitados e a branch
estiver limpa quanto ao escopo do PR.

## Corpo do PR

Siga `.github/pull_request_template.md`, sem adicionar um título Markdown de
nível 1. O corpo deve conter, nesta ordem:

### Descrição e objetivo

Explique o problema, o resultado entregue e por que o PR existe.

### Dependências e tamanho

Informe a branch base, PR pai/filho quando houver, ordem de merge e total de
linhas alteradas. Se for um PR independente, declare isso.

### Módulos e caminhos específicos afetados

Marque os módulos e liste todos os caminhos completos no menor nível possível:

- `apps/web`;
- `apps/server`;
- `packages/core`;
- `supabase`/banco/migrations/seeders;
- documentação e tooling, quando relevantes.

Não substitua a lista por apenas nomes de pastas.

### Alinhamento com autores/codeowners

Para cada arquivo existente relevante, informe o autor encontrado no histórico
ou o codeowner aplicável. Registre o alinhamento realizado. Se não houve
alinhamento externo, diga isso explicitamente em vez de marcar a caixa sem
evidência.

### Changelog

Liste comportamento, contratos, regras, migrations, seeds, testes e refactors
importantes.

### Como testar

Escreva um roteiro reproduzível e detalhado:

1. pré-requisitos e serviços locais;
2. instalação e comandos para iniciar server/web;
3. sensores automatizados por workspace;
4. credenciais seed obtidas do código e ambiente local, sem expor segredos;
5. fluxo manual autenticado, incluindo rota, dados esperados e estados de
   erro/vazio/carregamento;
6. viewport estreita, teclado e acessibilidade quando houver UI;
7. console, rede e respostas 4xx/5xx;
8. limitações e resultados observados.

### Jira, PRD e observações

Liste todas as chaves/URLs Jira e o link do Confluence, descrevendo divergências
ou decisões. Se não houver, escreva `Nenhum ticket Jira associado` ou `PRD não
aplicável`. Inclua causa raiz somente em correções de bug.

## Publicar e revisar

Publique a branch e crie o PR com título nominal curto em PT-BR, sem prefixo de
Conventional Commit e sem chave Jira:

```bash
git push -u origin <branch>
gh pr create \
  --base <base> \
  --head <branch> \
  --title "<título em PT-BR>" \
  --body-file <arquivo-do-corpo>
gh pr view --json number,url,baseRefName,headRefName,additions,deletions,changedFiles
```

Após o PR estar publicado, solicite a revisão automatizada:

```bash
gh pr comment <numero-do-pr> --body "@codex review"
```

Para comentários inline ou conversas, busque o estado thread-aware com a rotina
de `gh-address-comments`/GraphQL. Separe comentários informativos de pedidos
acionáveis. Para cada pedido acionável:

1. corrija o código/documentação ou registre a decisão de não alterar;
2. execute os sensores afetados;
3. responda em português citando o commit e a evidência;
4. resolva a thread somente depois da resposta;
5. confirme que não restam threads acionáveis abertas.

Não declare o PR concluído enquanto houver conflito com a base, check relevante
pendente/falho ou conversa bloqueante não tratada.

## Entrega ao usuário

Informe título, número, URL, branch, base, commits, tamanho do PR, validações,
referências Jira/Confluence, conversas resolvidas e pendências preservadas.
