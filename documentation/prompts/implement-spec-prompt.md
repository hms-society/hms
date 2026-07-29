---
description: Implementar diretamente uma spec pequena do HMS sem plano formal.
---

# Prompt: Implementar Spec

**Objetivo:** implementar uma spec pequena ou uma correção pontual no HMS com a
menor mudança segura, sem criar um plano formal, respeitando os limites entre
`packages/core`, `apps/server` e `apps/web`.

Use este prompt somente quando a spec já definir o comportamento, os arquivos e
a ordem de implementação. Quando houver dependências relevantes, use
`create-plan` + `implement-plan`.

## Entrada

- **Spec:** `documentation/features/**/specs/*-spec.md`;
- **Tickets Jira:** os tickets listados em `jira_tickets` na spec, com uma ou
  mais chaves/URLs, quando houver;
- **Escopo opcional:** requisito, seção ou ticket Jira específico;
- **Contexto opcional:** arquivos já alterados, prioridade ou limite da entrega.

Se o caminho não for fornecido, procure nesta ordem: spec citada na conversa,
única spec relacionada ao domínio/feature e spec mais recentemente modificada.
Se houver mais de uma candidata plausível, peça confirmação antes de editar.
Preserve todos os `jira_tickets` da spec no reporte final. Quando a integração
Jira estiver disponível, consulte os tickets para confirmar escopo e critérios
de aceite; não altere o status deles automaticamente.

## Critério de elegibilidade

Classifique a tarefa antes de escrever código. Ela só é direta se:

- envolver um único workspace ou uma sequência curta entre camadas já
  existentes;
- tiver contratos e decisões definidos na spec;
- não exigir migration de dados/permissões relevante;
- não introduzir integração externa, fila, workflow de IA ou contrato novo
  entre múltiplas bordas;
- puder ser validada pelos scripts existentes de lint, typecheck e teste.

Se qualquer condição falhar, pare, explique o motivo e recomende
`create-plan` + `implement-plan`. Se faltar uma decisão de produto ou
arquitetura, pergunte ao usuário antes de editar.

## Leitura obrigatória

Antes de editar, leia `AGENTS.local.md`, a spec inteira e os documentos
aplicáveis:

- `documentation/modules.md` — módulo responsável;
- `documentation/architecture.md` — fronteiras e fluxo;
- `documentation/infrastructure.md` — stack e dependências;
- `documentation/tooling.md` — comandos e arquivos gerados;
- `documentation/design.md` — sempre que tocar UI, styling ou layout;
- `documentation/rules/core-package-rules.md` — sempre que tocar
  `packages/core`.

Use `rg --files` e `rg` para confirmar os caminhos citados e localizar
implementações similares. Não suponha que um arquivo, export ou assinatura
exista; a exceção é um arquivo marcado como **(novo arquivo)** na spec.

## Implementação

- Siga a spec como fonte de verdade e faça a menor alteração que entrega o
  comportamento.
- Preserve o módulo proprietário descrito em `documentation/modules.md`.
- Mantenha `packages/core` livre de frameworks, SDKs, banco e código de apps.
- Mantenha autenticação, autorização, ownership e adaptação HTTP na borda,
  conforme o padrão do fluxo existente.
- Em `apps/server`, use controllers REST NestJS e os providers/repositories
  existentes. Migrations devem ficar em
  `apps/server/src/shared/database/migrations/` e ser geradas pelo Drizzle.
- Em `apps/web`, use TanStack Router/Start, Query, React Hook Form, Zod e
  componentes shadcn existentes conforme a necessidade. Não edite
  `src/routeTree.gen.ts` manualmente; rode `pnpm --filter web generate-routes`.
- Para UI, use os tokens e a tipografia de `documentation/design.md`; implemente
  estados loading, error, empty e content quando forem aplicáveis.
- Antes de adicionar dependência ou mudar configuração, consulte
  `documentation/infrastructure.md` e `documentation/tooling.md`.
- Se encontrar uma divergência factual pequena na spec, faça uma correção
  cirúrgica documentada. Se a divergência exigir decisão, pare e registre a
  pendência em vez de adivinhar.

## Testes

Adicione ou atualize testes para o comportamento alterado, seguindo os padrões
existentes do workspace:

- `packages/core`: entidades, structures, use cases, erros, eventos e regras de
  domínio com Vitest;
- `apps/server`: controllers/rotas e contratos HTTP com Vitest e Supertest
  quando aplicável;
- `apps/web`: widgets, hooks e rotas com Vitest/Testing Library quando houver
  infraestrutura para o cenário.

Não crie testes para detalhes internos sem comportamento observável. Prefira
cobrir o componente público que consome repositories, providers ou mappers.

## Validação

Execute os comandos do workspace afetado:

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

Use apenas o bloco correspondente e repita a validação para cada workspace
afetado. Se uma rota web for criada ou removida, gere a árvore de rotas. Se a
mudança tocar UI e houver browser disponível, valide também a rota e o fluxo
principal; caso contrário, registre a validação visual como pendente.

Se algum comando falhar por causa da mudança, corrija antes de concluir. Falhas
pré-existentes devem ser reportadas com comando e erro, sem serem mascaradas.

## Encerramento

Ao final:

- atualize a spec de forma cirúrgica se comportamento, contrato, decisão,
  persistência ou critério de validação tiver mudado;
- atualize `documentation/architecture.md`, `modules.md`, `design.md`,
  `infrastructure.md`, `tooling.md` ou `rules/` somente quando a implementação
  realmente introduzir algo que esses documentos precisem registrar;
- informe o resumo, arquivos principais, validações, pendências e divergências.
- inclua todas as chaves/URLs de `jira_tickets` associadas à spec.

Não crie plano formal, não use transporte ou biblioteca não documentados e não
faça commit, push ou PR sem solicitação explícita.
