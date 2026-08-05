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

Informe título, URL, número, branch, commits, validações, referências Jira e
Confluence, resultado da revisão e quaisquer pendências preservadas.
