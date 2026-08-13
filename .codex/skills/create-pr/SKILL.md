---
name: create-pr
description: >
  Criar Pull Requests do HMS via gh, com commits, rastreabilidade Jira/Confluence e checklist de validação.
---


# Criar PR

O Orchestrator prepara e publica o Pull Request usando exclusivamente a GitHub
CLI (`gh`). O PR deve manter a rastreabilidade da Spec, do PRD no Confluence e
dos tickets Jira, sem transformar esses registros em GitHub Issues ou
milestones.

## Entrada

- Spec ou Bug Report implementado e validado;
- branch de trabalho baseada em `develop`;
- link do PRD no Confluence, quando houver;
- todas as chaves/URLs de `jira_tickets`, quando houver.

## Regra de integração e topologia de branches

Antes de criar ou atualizar um PR, descubra a topologia real da entrega. Não
assuma que branches com nomes semelhantes contêm conjuntos cumulativos de
alterações.

1. Atualize as referências remotas sem alterar a worktree do usuário:

   ```bash
   git fetch origin develop --prune
   gh pr list --state all --search "<termos da Spec>"
   ```

2. Para cada PR ou branch relacionado, registre base, head, SHA, estado e
   merge. Verifique a ancestralidade com `git merge-base --is-ancestor`; o nome
   da branch ou a ordem visual dos PRs não prova que uma alteração foi
   incorporada.
3. O padrão é uma branch de entrega baseada em `origin/develop`. Não crie
   branches intermediárias apenas para repartir linhas, nem crie uma cadeia de
   worktrees em que um PR dependa acidentalmente de outro PR ainda não aceito.
4. Se a entrega precisar de vários PRs por fronteira semântica ou dependência
   real, cada PR deve declarar sua base e dependências. Depois que os PRs forem
   aceitos, crie ou atualize uma branch de integração baseada no `develop` atual
   e incorpore explicitamente todos os heads aceitos, na ordem de dependência.
   O PR final deve ser comparado com `origin/develop` e conter o conjunto
   completo aceito — nunca apenas o último branch intermediário.
5. Se já existir um PR de entrega, atualize o head desse PR em vez de abrir
   outro PR para a mesma Spec. Antes do push, confirme que a branch contém os
   commits e arquivos de todos os PRs aceitos.

Use uma worktree temporária limpa para a integração quando a worktree principal
estiver suja. Preserve as alterações do usuário e copie somente arquivos de
ambiente ignorados e locais; não copie `.env.example` ou qualquer arquivo
`tracked`. Não use `reset --hard`, `checkout --` ou rebase para apagar trabalho.

## Leitura e preflight

Antes de criar commits ou abrir o PR, leia:

- `documentation/github-flow.md`;
- `documentation/rules/commit-rules.md`;
- `documentation/rules/rules.md` e as Rules aplicáveis ao diff;
- `documentation/prompts/commit-code-prompt.md`.

Consulte a Spec, o PRD no Confluence e todos os tickets Jira associados quando
a integração estiver disponível. Preserve as referências e não altere status,
comentários ou critérios de aceite automaticamente.

Execute o preflight documentado pelo projeto:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Use filtros de workspace quando forem suficientes e registre comandos
omitidos, falhas pré-existentes e validações adicionais de integração/e2e.

Para uma entrega composta, valide o estado integrado, não cada branch isolada.
Calcule e registre o diff real contra a base do PR:

```bash
git diff --stat origin/develop...HEAD
git diff --name-status origin/develop...HEAD
```

Não aplique um limite artificial de 5.000 linhas e não divida um PR apenas para
contornar o workflow `check-pr-size`. Se o usuário autorizar uma entrega maior,
publique um único PR coerente, informe a quantidade real de linhas e registre o
`check-size` como uma pendência de política. Não declare o Quality Gate
completamente verde enquanto esse check estiver vermelho; se a proteção da
branch impedir o merge, reporte o bloqueio ao usuário em vez de alterar ou
burlar o workflow sem autorização.

### Migrações e arquivos gerados

Antes de publicar uma integração que toca o banco:

- compare os números das migrações e o `meta/_journal.json` entre `develop` e
  cada branch aceita;
- resolva colisões de numeração explicitamente, renumerando a migração nova e
  atualizando snapshot, journal, testes e referências correspondentes;
- nunca aceite cegamente `ours`/`theirs` para uma migração ou seu metadata;
- execute a geração/verificação de migration e os testes específicos disponíveis;
- confirme que cada teste lê o nome final do arquivo de migration.

Se o teste local exigir Docker/Testcontainers indisponível, registre isso como
limitação; não transforme uma falha de ambiente em aprovação da implementação.

## Título

Use um título curto, em PT-BR, como frase nominal, sem prefixo Conventional
Commit e sem chave Jira. Exemplos: `Correção do carregamento de clientes` ou
`Configuração do cadastro de colaboradores`.

## Commits pendentes

Se houver alterações não commitadas:

1. inspecione `git status --short`, `git diff` e `git diff --cached`;
2. preserve arquivos staged e alterações fora do escopo;
3. agrupe por responsabilidade semântica;
4. crie commits atômicos usando Conventional Commits, conforme
   `commit-rules.md` e `commit-code-prompt.md`;
5. não use `git add .`, `--no-verify`, `--amend`, rebase ou comandos destrutivos;
6. só abra o PR quando a branch estiver limpa quanto aos arquivos da entrega.

Formato:

```text
<type>(<scope>): <subject>
```

## Corpo do PR

Use Markdown sem título principal (`#`) e inclua:

### Objetivo

Explique o propósito central da alteração.

### Tickets Jira relacionados

Liste todas as chaves ou URLs, sem usar palavras-chave de fechamento do GitHub:

```md
- PROJ-123 — <relação com a alteração>
- PROJ-456 — <relação com a alteração>
```

Se não houver ticket, informe `Nenhum ticket Jira associado.` Não crie um
ticket ou GitHub Issue automaticamente.

### PRD no Confluence

Inclua o link da página quando houver e descreva divergências de produto ou
limitações conhecidas. Se o PRD não for aplicável, informe isso explicitamente.

### Causa do bug

Inclua somente para correções: descreva a causa técnica raiz.

### Changelog

Liste arquivos, comportamento alterado, contratos, regras e refatorações
relevantes.

### Como testar

Descreva passos reproduzíveis e os comandos executados, incluindo fluxo de
integração/e2e quando aplicável.

### Observações

Registre decisões arquiteturais, migrations, efeitos colaterais, limitações,
trade-offs e próximos passos.

## Criação e revisão

Crie o PR para `develop`:

```bash
gh pr create \
  --base develop \
  --head <branch> \
  --title "<título em PT-BR>" \
  --body-file <arquivo-do-corpo>
```

Após a criação, obtenha o número e a URL reais:

```bash
gh pr view --json number,url
```

Solicite a revisão automatizada apenas depois de o PR estar publicado:

```bash
gh pr comment <numero-do-pr> --body "@codex review"
```

Execute o mesmo comentário depois de cada push que altere o PR, sempre usando o
número real do PR.

## Loop pós-publicação do PR

Depois de solicitar a revisão, aguarde e acompanhe o Quality Gate do `HEAD`
atual. O ciclo só termina quando todos os checks funcionais obrigatórios
estiverem verdes, as exceções de política autorizadas estiverem documentadas, o
PR estiver mergeable e não houver conversa bloqueante pendente.

1. Consulte os checks e o SHA do `HEAD` do PR:

   ```bash
   gh pr view <numero-do-pr> --json commits,mergeable,statusCheckRollup,reviews,comments
   ```

   Use the last commit SHA from `.commits[-1].oid` as the `HEAD` being
   validated.

2. Aguarde os workflows oficiais do commit publicado. Use `gh run watch
   <run-id> --exit-status` ou equivalente e registre o resultado de cada
   workflow.
3. Se um check funcional falhar, leia os logs, corrija somente problemas dentro
   do escopo, execute os sensores locais aplicáveis, crie um novo commit e faça
   push. Depois reinicie o loop a partir do novo SHA; checks de um HEAD anterior
   não validam o commit corrigido.
4. Se o único check vermelho for `check-size` e a entrega acima de 5.000 linhas
   tiver sido autorizada, não crie branches artificiais nem faça alterações
   cosméticas para reduzir a contagem. Registre o valor e a consequência para
   merge.
5. Após cada novo push, aguarde novamente Core, Server, Web e quaisquer outros
   checks obrigatórios antes de concluir.
6. Confirme que o PR continua mergeable e que reviews/conversas bloqueantes
   foram resolvidas. Registre checks ignorados ou não aplicáveis como
   limitações explícitas.

Este prompt publica, valida e acompanha o PR, mas nunca executa merge, fecha o
PR ou altera a branch de destino automaticamente. A decisão de merge permanece
com o usuário/revisor autorizado.

Informe título, URL, número, branch, commits, validações, referências Jira e
Confluence, resultado da revisão e quaisquer pendências preservadas.
