---
description: Criar uma especificação técnica do HMS a partir de um PRD e da codebase.
---

# Prompt: Criar Spec

**Objetivo:** transformar um requisito de produto em uma especificação técnica
implementável, coerente com a arquitetura do HMS e precisa o bastante para que
outro agente execute a mudança sem inventar contratos ou caminhos.

## Entrada

- **PRD:** página do Confluence, fornecida por URL ou ID. O PRD deve estar
  definido e ser a fonte de verdade do comportamento de produto.
- **Tickets Jira:** uma ou mais chaves ou URLs de tickets relacionados, quando
  a demanda estiver vinculada ao Jira. Trate cada ticket como fonte de contexto
  e preserve todos na spec.
- **Demanda:** descrição da feature, correção ou refatoração.
- **Bug report (quando aplicável):**
  `documentation/features/<modulo>/reports/<nome>-bug-report.md`.
- **Codebase:** acesso ao repositório atual.

Leia o PRD diretamente no Confluence usando a integração Atlassian disponível.
Se não houver acesso à página, peça a URL/ID ou o conteúdo ao usuário. Se o PRD
ou uma decisão de produto necessária estiver ausente, não invente a resposta.
Registre a pendência e peça confirmação antes de finalizar a spec.
Se houver mais de um ticket Jira, leia todos, separe requisitos por ticket e
resolva conflitos explicitamente; nunca descarte tickets secundários.

## Contexto obrigatório do HMS

O projeto é um monorepo pnpm + Turborepo:

- `packages/core` — entidades, structures, erros, eventos e contratos de
  domínio compartilhados.
- `apps/server` — NestJS, controllers REST, Drizzle/PostgreSQL, Supabase,
  providers e integrações de backend.
- `apps/web` — TanStack Start + React, TanStack Router/Query, Tailwind v4,
  shadcn/ui e Testing Library.

Os módulos de negócio estão descritos em `documentation/modules.md`. Respeite a
responsabilidade do módulo proprietário; módulos não devem acessar a
implementação interna uns dos outros. Use contratos, referências compartilhadas
ou eventos quando esse for o padrão adequado.

## Leitura obrigatória antes da pesquisa

Leia `AGENTS.local.md` (quando existir) e, conforme o escopo:

- `documentation/modules.md` — módulo responsável e limites de domínio;
- `documentation/architecture.md` — fluxos e fronteiras existentes;
- `documentation/infrastructure.md` — stack aprovada e integrações;
- `documentation/design.md` — se houver UI, estilo ou fluxo visual;
- `documentation/tooling.md` — comandos, monorepo e arquivos gerados;
- `documentation/rules/core-package-rules.md` — se tocar `packages/core`;
- `documentation/rules/commit-rules.md` — somente se a entrega incluir commit.

Não cite `documentation/rules/rules.md` nem rules de camadas que não existem no
repositório. Se uma nova convenção for necessária, registre-a como decisão e
indique qual documentação deverá ser atualizada.

## Princípios invioláveis

1. Cite caminhos reais. Marque explicitamente cada arquivo ainda inexistente
   como **(novo arquivo)**.
2. Não invente métodos, schemas, módulos, integrações ou dependências sem
   evidência no PRD, na documentação ou na codebase.
3. A spec define contratos e responsabilidades, não implementação detalhada.
   Use assinaturas TypeScript quando isso remover ambiguidade.
4. `packages/core` permanece agnóstico a NestJS, React, Supabase, Drizzle e
   SDKs externos.
5. Regras de negócio do domínio ficam em use cases do módulo proprietário;
   entidades e structures representam estado e dados válidos. Aplique as regras
   de `core-package-rules.md`.
6. Auth, autorização, ownership e adaptação HTTP permanecem na borda quando
   esse for o padrão do fluxo existente.
7. Migrations só entram na spec quando houver mudança real de schema. No HMS,
   ficam em `apps/server/src/shared/database/migrations/` e são geradas pelo
   Drizzle.
8. Antes de adicionar uma dependência ou alterar tooling, consulte
   `documentation/infrastructure.md` e `documentation/tooling.md`.
9. Se a demanda tocar UI, use os tokens e padrões de `documentation/design.md`;
   não defina cores, fontes, raios ou sombras arbitrários.
10. Se uma decisão arquitetural ou de produto não puder ser deduzida com
    segurança, pergunte ao usuário antes de concluir o documento.

## Processo

### 1. Pesquisa

1. Leia o PRD e extraia apenas os requisitos que afetam a implementação.
2. Leia todos os tickets Jira fornecidos, incluindo descrição, critérios de
   aceite, dependências e links relevantes. Use a integração Jira quando
   disponível; caso contrário, use o conteúdo fornecido no contexto.
3. Identifique o módulo proprietário em `documentation/modules.md`.
4. Determine os workspaces tocados: `core`, `server`, `web`.
5. Pesquise implementações similares com `rg --files`, `rg` e leitura dos
   arquivos vizinhos. Confirme os caminhos e assinaturas antes de usá-los como
   referência.
6. Mapeie o fluxo atual e os pontos de alteração. Para mudanças entre apps,
   descreva claramente quem expõe e quem consome o contrato REST, evento ou
   referência compartilhada.

Se o escopo tiver partes independentes e houver suporte de orquestração, a
pesquisa pode ser dividida por workspace. Cada pesquisa deve devolver apenas
evidências: arquivos relacionados, fluxo de dados, padrões encontrados, riscos
e lacunas. As decisões continuam sendo consolidadas pelo agente principal.

### 2. Clarificação

Antes de redigir a spec, transforme decisões sem evidência única em perguntas
objetivas ao usuário. Inclua alternativas quando houver mais de uma escolha
razoável. Não esconda uma decisão relevante em **Pendências**.

### 3. Redação

Use a estrutura abaixo. Quando uma seção não se aplicar, escreva **Não
aplicável**; não mantenha referências a camadas inexistentes.

## Estrutura da spec de saída

Salve em:

`documentation/features/<modulo>/<feature>/specs/<nome>-spec.md`

Preserve subdiretórios adicionais já usados pela feature. Use o frontmatter:

```md
---
title: <título claro>
prd: <URL ou ID da página do Confluence>
jira_tickets:
  - PROJ-123
  - PROJ-456
workspaces: core, server, web
status: open
last_updated_at: <YYYY-MM-DD>
---
```

`jira_tickets` deve ser sempre uma lista: contenha uma ou mais chaves/URLs
quando a demanda estiver vinculada ao Jira, ou `[]` quando não houver ticket.
Inclua somente os workspaces efetivamente tocados.

### 1. Objetivo

Descreva em um parágrafo o comportamento entregue e o resultado técnico
esperado.

### 2. Escopo

- **In scope:** requisitos e fluxos incluídos.
- **Out of scope:** limites explícitos, incluindo responsabilidades de outros
  módulos.

### 3. Requisitos

- **Funcionais:** regras observáveis derivadas do PRD.
- **Não funcionais:** somente critérios verificáveis de segurança, desempenho,
  consistência, observabilidade ou acessibilidade.

### 4. Estado atual

Agrupe por `packages/core`, `apps/server` e `apps/web`. Para cada item, use:

`**Nome** (caminho relativo) — responsabilidade atual e relação com a mudança.`

### 5. Artefatos a criar

Inclua somente arquivos necessários e marque novos arquivos. Cubra apenas as
seções aplicáveis:

#### Core — `packages/core`

- módulo e caminho;
- entidade/structure/erro/evento/contrato ou use case;
- propriedades e invariantes;
- assinaturas de entrada e saída;
- eventos publicados e referências a outros módulos.

#### Server — `apps/server`

- controller REST NestJS e rota HTTP;
- schemas/DTOs e validação com Zod, se aplicável;
- service/use case adapter, quando o padrão existente exigir;
- repository, mapper, provider ou gateway;
- migration Drizzle em `src/shared/database/migrations/`, incluindo schema,
  índices, grants/RLS e impacto nos consumidores;
- jobs/workflows ou integrações externas, somente se previstos e suportados
  pela infraestrutura documentada.

#### Web — `apps/web`

- rota TanStack Router (não editar `src/routeTree.gen.ts` manualmente);
- page/widget/hook/context/store;
- chamadas em `src/ui/shared/api` ou cliente HTTP;
- estados Loading, Error, Empty e Content;
- acessibilidade, responsividade e comportamento visual conforme
  `documentation/design.md`.

### 6. Artefatos a modificar

Para cada arquivo: caminho, mudança e justificativa. Se não houver, escreva
**Não aplicável**.

### 7. Artefatos a remover

Para cada remoção: caminho, motivo e impacto. Se não houver, escreva
**Não aplicável**.

### 8. Decisões técnicas

Para cada decisão relevante, registre escolha, alternativas consideradas,
evidência, motivo e trade-offs. Inclua decisões sobre módulo, transporte,
persistência, validação, autenticação, UI e testes quando aplicável.

### 9. Fluxos e referências

- diagrama Mermaid do fluxo entre domínio, server, banco, integrações e web;
- fluxo cross-workspace, quando houver;
- hierarquia visual ASCII, quando houver UI;
- arquivos similares usados como referência.

### 10. Pendências

Liste apenas o que permaneceu aberto após a clarificação. Para cada item,
descreva impacto e ação necessária. Se não houver, escreva **Sem pendências**.

### 11. Execução recomendada

Recomende:

- **`implement-spec`** para uma mudança pequena, com poucos arquivos, sem
  dependências complexas e ordem de execução evidente;
- **`create-plan` + `implement-plan`** para múltiplos workspaces, migration,
  contrato novo entre camadas, integração externa, paralelização ou risco
  relevante de regressão.

Justifique a escolha em uma frase.
