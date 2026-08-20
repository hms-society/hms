---
name: create-pr
description: Criar Pull Requests do HMS via gh, com rastreabilidade, evidências e validação.
---

# Criar PR

Prepare, publique e acompanhe um Pull Request do HMS somente depois de confirmar
o escopo da entrega, a integridade da branch e as validações necessárias. O PR
deve ser rastreável à Spec, aos requisitos `REQ-*`, ao PRD e aos tickets Jira
relacionados, quando existirem.

Não transforme registros do Jira ou Confluence em Issues, milestones ou alterações
externas sem autorização explícita.

## Entrada

- Spec ou Bug Report implementado;
- branch de trabalho;
- link do PRD no Confluence, quando aplicável;
- chaves e URLs dos tickets Jira, quando aplicável;
- autorização para criar commits, fazer push, criar ou atualizar o PR e solicitar revisão.

## Regras de segurança e escopo

- Preserve alterações staged, unstaged e untracked que não pertençam à entrega.
- Não use `git reset --hard`, `git checkout --`, rebase destrutivo, `git add .`,
  `git add -A`, `--no-verify` ou `--amend`.
- Não inclua secrets, `.env`, chaves privadas, tokens ou artefatos locais.
- Não crie branches, commits, pushes ou comentários externos sem a autorização
  correspondente.
- Não invente tickets, links de PRD, requisitos `REQ-*`, resultados de testes ou
  alinhamentos humanos.
- Se a relação entre arquivos e a entrega permanecer ambígua, pare e reporte a
  ambiguidade em vez de incluir arquivos especulativamente.

## 1. Inspecionar a entrega

Leia antes de publicar:

- `documentation/github-flow.md`;
- `documentation/rules/commit-rules.md`;
- `documentation/rules/rules.md` e as Rules aplicáveis ao diff;
- `documentation/prompts/commit-code-prompt.md`;
- a Spec, o Bug Report, o PRD e os tickets relacionados, quando acessíveis.

Inspecione o estado completo:

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git log -10 --format='%h %s'
```

Identifique:

- arquivos staged, unstaged e untracked;
- arquivos gerados, migrations, seeds e configurações;
- workspaces afetados (`apps/web`, `apps/server`, `packages/core` e outros);
- alterações fora do escopo;
- segredos ou dados locais que devem ser excluídos.

## 2. Confirmar branch e topologia

Atualize somente as referências remotas, sem alterar a worktree:

```bash
git fetch origin develop --prune
gh pr list --state all --search "<termos da Spec>"
```

Registre base, head, SHA, estado e merge de PRs relacionados. Verifique
ancestralidade com `git merge-base --is-ancestor`; nomes de branches não provam
que uma alteração foi incorporada.

Use esta decisão:

- PR único: branch baseada em `origin/develop`;
- PR existente para a mesma entrega: atualizar o PR existente;
- PRs separados: somente quando houver fronteiras semânticas ou dependências
  reais, declarando base, head e dependências;
- branch de integração: somente depois que PRs dependentes forem aceitos, baseada
  no `develop` atualizado e comparada novamente com `origin/develop`.

Não crie branches intermediárias somente para dividir linhas. Se a worktree
principal estiver suja e a integração exigir estado limpo, use uma worktree
temporária preservando os arquivos locais ignorados; não copie arquivos tracked
como `.env.example`.

## 3. Preflight e validação

Escolha a validação proporcional ao diff. Use os filtros de workspace quando
forem suficientes e registre cada comando executado:

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Validações mínimas por escopo:

- Web: testes web, typecheck e validação manual/visual quando houver UI;
- Server: testes server, typecheck e integração quando houver endpoint, job ou
  persistência;
- Core: testes e typecheck do pacote quando houver domínio, contrato ou evento;
- Banco: migration, seed e testes específicos quando houver alteração de schema;
- Integração: Playwright ou outro teste de fluxo quando a mudança exigir
  navegador autenticado ou serviços reais.

Registre falhas pré-existentes, limitações de ambiente, comandos não executados
e o motivo. Nunca declare uma validação como aprovada sem evidência.

## 4. Tamanho do PR

Leia `.github/workflows/check-pr-size.yml` antes de decidir a topologia. Não
duplique o limite no prompt: reproduza o valor e o escopo configurados no
workflow.

Calcule o diff real contra a base do PR:

```bash
git diff --stat origin/develop...HEAD
git diff --name-status origin/develop...HEAD
git diff --numstat origin/develop...HEAD
```

Considere exatamente as extensões e regras do workflow. Se o limite for
excedido, proponha divisão por fronteiras semânticas e dependências reais. Não
reduza a contagem com alterações cosméticas, não esconda arquivos e não burle o
check. Se houver uma exceção autorizada, registre o limite, a contagem e a
consequência para o merge.

Se o workflow estiver configurado apenas para `workflow_dispatch`, não trate o
check como obrigatório no PR sem evidência de que ele foi executado.

## 5. Migrations e arquivos gerados

Antes de publicar uma entrega que toca o banco:

- compare migrations e `meta/_journal.json` com `develop`;
- resolva colisões de numeração explicitamente;
- atualize snapshot, journal, testes e referências correspondentes;
- execute a geração/verificação de migration disponível;
- confirme que os testes usam o nome final da migration;
- registre limitações de Docker/Testcontainers sem convertê-las em aprovação.

## 6. Commits

Se houver alterações pendentes e a criação de commits estiver autorizada:

1. agrupe mudanças por responsabilidade semântica;
2. proponha o plano com tipo, escopo, propósito e arquivos/hunks;
3. inclua os testes, migrations e arquivos gerados necessários;
4. faça staging apenas por caminhos explícitos;
5. inspecione o diff staged antes de cada commit;
6. use Conventional Commits:

```text
<type>(<scope>): <subject>
```

Não crie micro-commits artificiais nem deixe a branch em estado quebrado. Não
faça push até que o usuário autorize essa ação.

## 7. Corpo do PR

Use Markdown sem título principal (`#`) e siga exatamente estas seções. Não use
uma seção chamada `Changelog`, `Impacto e compatibilidade` ou `Observações`.

### Objetivo

Descreva o problema ou necessidade, o resultado esperado, o escopo e, quando
útil, o que está fora do escopo.

### Tickets relacionados

Liste somente tickets realmente relacionados, com link e relação:

```md
- [PROJ-123](link) — implementação principal
- Nenhum ticket Jira associado.
```

Não use palavras-chave de fechamento do GitHub.

### PRDs relacionados

Liste os PRDs aplicáveis e os requisitos cobertos:

```md
- [PRD de Consultas](link)
  - `REQ-101` — finalização da ficha
  - `REQ-102` — liberação da aba de documentos
- Nenhum PRD relacionado.
```

Descreva divergências entre PRD e implementação quando existirem.

### Causa do bug

Inclua somente em correções:

- sintoma;
- causa técnica raiz;
- por que o problema não era detectado;
- correção aplicada.

Não deixe a seção vazia em features novas.

### Implementação técnica

Descreva tudo o que foi implementado em nível de código, organizado por tópicos:

#### Frontend

- componentes, widgets, páginas, rotas e nested routes;
- hooks de query/action e estados de loading, erro e readonly;
- validações e interações;
- arquivos principais alterados.

#### Backend

- controllers, endpoints e DTOs;
- schemas Zod, autorizações e casos de uso;
- jobs, eventos e handlers;
- arquivos principais alterados.

#### Domínio

- entidades, estruturas e contratos;
- eventos de domínio e transições de estado;
- arquivos principais alterados.

#### Persistência

- migrations, repositories, mappers e seeds;
- arquivos gerados ou metadados atualizados.

#### Testes

- testes criados ou atualizados;
- cenários de negócio cobertos.

Liste caminhos completos no menor nível útil, sem transformar o corpo em uma
cópia integral de `git diff --name-status`.

### Mudanças nas regras de negócio

Inclua somente quando houver alteração de comportamento, requisito, validação,
autorização, status, fluxo ou transição de domínio.

Cada requisito alterado, removido ou adicionado deve ser linkado e classificado:

```md
| Requisito | Tipo | Alteração | Implementação | Evidência |
|---|---|---|---|---|
| [REQ-123](link) | Alterado | Nova condição de finalização | `UseCase` | Teste X |
| [REQ-124](link) | Adicionado | Novo fluxo de encerramento | Dialog + endpoint | Teste manual |
| [REQ-125](link) | Removido | Opção retirada do fluxo | Frontend + schema | Teste Y |
```

Para cada mudança, informe o comportamento anterior, o novo comportamento e o
motivo. Requisitos removidos exigem justificativa. Nunca invente uma chave
`REQ-*`; se ela não puder ser identificada, pare e reporte a pendência antes de
publicar.

Se não houver mudança de negócio, informe:

```md
> Não aplicável — este PR não altera regras de negócio.
```

Quando esta seção for aplicável, o PRD correspondente deve ser atualizado ou a
divergência deve ser explicitamente registrada.

### Evidências visuais

Inclua prints, GIFs ou vídeos curtos quando houver alteração de interface. Use
legendas explicando o comportamento demonstrado e remova dados sensíveis.

Para mudanças sem interface, informe:

```md
> Não aplicável — alteração sem interface visual.
```

### Como testar manualmente

Descreva o fluxo em etapas reproduzíveis:

```md
### Pré-requisitos

- usuário/perfil necessário;
- seed ou dados necessários;
- serviços e URL/rota.

### Fluxo principal

1. Acesse ...
2. Execute ...
3. Confirme ...

**Resultado esperado:** ...

### Fluxos de erro e regras

1. Execute ...

**Resultado esperado:** ...
```

Cada etapa deve ter resultado esperado quando houver decisão, validação,
permissão, erro ou mudança de estado.

### Validação automatizada

Informe comandos, escopo e resultado real:

```md
| Comando | Resultado |
|---|---|
| `pnpm --filter web test` | 269 testes aprovados |
| `pnpm --filter server check:types` | Aprovado |
```

Inclua falhas pré-existentes, limitações e comandos omitidos, sem afirmar que
foram executados quando não foram.

## 8. Criar ou atualizar o PR

Somente com autorização de publicação:

```bash
git push -u origin <branch>
gh pr create \
  --base develop \
  --head <branch> \
  --title "<título curto em PT-BR>" \
  --body-file <arquivo-do-corpo>
```

O título deve ser uma frase nominal curta em PT-BR, sem prefixo Conventional
Commit, chave Jira ou nome da branch.

Se já existir um PR para a mesma entrega, atualize-o em vez de criar outro.
Depois, obtenha os dados reais:

```bash
gh pr view <numero> --json number,url,headRefName,baseRefName,commits
```

As revisões Codex por workspace são disparadas automaticamente pela workflow do
repositório. Não publique comentários manuais para acioná-las e não aguarde seus
comentários para concluir o fluxo do agente de criação do PR.

## 9. Acompanhar os validadores mecânicos

O agente de criação do PR acompanha somente os validadores mecânicos necessários
para a entrega, como lint, typecheck, testes, build, migrations e `check-size`.
As revisões Codex e os comentários humanos são assíncronos, informativos e não
fazem parte do caminho de correção do agente.

Valide o SHA atual do PR e consulte os checks:

```bash
gh pr view <numero> --json commits,statusCheckRollup,mergeable
gh pr checks <numero>
```

Não declare a entrega pronta enquanto validadores mecânicos obrigatórios
estiverem pendentes. Use `gh run watch <run-id> --exit-status` quando necessário.
Não espere que workflows de revisão Codex ou revisores humanos terminem.

Se um validador mecânico falhar:

1. leia o log do job;
2. classifique a falha como implementação, teste desatualizado, ambiente,
   infraestrutura ou política;
3. corrija somente o que estiver no escopo;
4. execute as validações locais aplicáveis;
5. crie commit e faça push somente com autorização;
6. confirme o novo SHA;
7. acompanhe novamente somente os validadores mecânicos do novo SHA.

Checks de um commit anterior não validam o commit atual. Checks `skipped` devem
ser explicados. Não corrija achados de revisão Codex automaticamente nesta etapa.
Não execute merge, feche o PR ou altere a branch de destino.

## Entrega final ao usuário

Informe:

- título, número e URL do PR;
- branch base e head;
- commits criados;
- arquivos e módulos incluídos;
- validações executadas e resultados;
- tickets, PRDs e requisitos `REQ-*` relacionados;
- validadores mecânicos acompanhados e respectivos resultados;
- revisão Codex assíncrona iniciada pela workflow, sem aguardar comentários;
- pendências, limitações ou bloqueios preservados.
