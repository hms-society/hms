---
name: create-pr
description: Criar Pull Requests do HMS via gh, com commits, rastreabilidade Jira/Confluence e checklist de validação.
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

---

## Execution Guidelines

### 1. Context Analysis

- Review the implemented Spec and the changelog of the changes made.
- Identify:
  - Technical impact (which of `web` / `server` / `core` is affected)
  - Design decisions taken
  - Risks and side effects
  - **Exact modified paths:** Retrieve the complete, lowest-level file paths of all files created or altered (using `git status` or `git diff`).
  - **Dynamic Codeowners:** For any modified files, run a command like `git log -n 1 --pretty=format:"%ae" -- <file>` or check git history to identify the last author/owner of the modified files, so they can be listed under the alignment section.

---

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

The PR body must follow the structure defined in `.github/pull_request_template.md`.

**Formatting rules:**
- Use Markdown
- List the exact, full paths of the modified files (at the lowest level possible) under the respective module sections.
- Identify and list the original authors/codeowners of each modified file using `git log` or `git blame` history, under the alignment section.
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

## 📝 Descrição das Alterações (obrigatório)
Explique por que este PR foi criado, qual é seu propósito principal e quais problemas ele resolve.

## 🛠️ Módulos e Caminhos Específicos Afetados (Obrigatório)
Enumere os módulos afetados e liste os caminhos de todos os arquivos ou pastas específicas criados/modificados:
- [ ] `apps/web` (Frontend / Interface)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)
- [ ] `apps/server` (Backend / API)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)
- [ ] `packages/core` (Regras de Domínio)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)
- [ ] `supabase` (Banco de dados / Migrations / Seeders)
  *Arquivos alterados:* 
  - (Caminho completo de cada arquivo...)

## ⚠️ Alinhamento com Codeowners / Autores Original dos Módulos (Obrigatório)
Identifique e liste os autores originais de cada arquivo que você alterou (consulte o histórico do Git):
- [ ] Identifiquei os autores originais dos arquivos alterados:
  * `caminho/do/arquivo` -> Autor/Codeowner
- [ ] Eu alinhei/conversei com os criadores/autores antes de realizar e submeter estas alterações.
  - *Detalhes do alinhamento:* ...



---

## Como testar (obrigatório)

Passo a passo claro para o revisor validar as mudanças. Referencie os comandos
relevantes, ex.:

```
pnpm install
pnpm --filter web dev        # frontend em http://localhost:3000
pnpm --filter server start:dev
pnpm --filter <pkg> check-types
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
