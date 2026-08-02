# Spec-Driven Development (SDD) no HMS

## Objetivo

O SDD transforma uma demanda de feature em uma entrega verificável. Todo o
fluxo ocorre na mesma task/thread. O Orchestrator coordena Builders, Judges e
sensores como subagentes da task atual; nenhuma fase cria nova thread.

```text
PRD no Confluence, ticket Jira, report ou demanda direta
→ Spec (Contract + solução técnica)
→ Judge Spec
→ Plan opcional
→ Judge Plan, quando houver Plan
→ Builders
→ sensores aplicáveis
→ Judge Implementation
→ preflight local
→ evaluation.md
→ PR + Quality Gate + build no CI
→ Spec completed
```

Specs são usadas para entregas relacionadas a uma feature: novas features,
alterações de comportamento, correções e mudanças técnicas necessárias para
uma feature. Manutenções transversais sem Contract de feature seguem fluxo
direto.

## Organização dos artefatos

Cada feature mantém seus artefatos no próprio diretório:

```text
documentation/features/<domínio>/<feature>/
├── spec.md
├── plan.md          # opcional para implementações maiores
└── evaluation.md    # obrigatório após implementação/julgamento
```

Qualquer alteração posterior em feature já implementada pode usar
`changes/<nome-da-mudanca>/spec.md` dentro da feature. Use nomes curtos em
kebab-case; crie `plan.md` somente quando o tamanho ou risco exigir fases e
ledger. `evaluation.md` é obrigatório após implementação ou julgamento, mesmo
sem Plan; Specs abandonadas antes da implementação são a única exceção. O ticket
permanece no frontmatter. Para
bugs ou security, o relatório completo permanece no Jira; para evolução de
produto, o ticket ou demanda é a origem da mudança. A Spec contém o Contract da
alteração e referencia a origem por URL direta quando o controle de acesso for
compatível.

## Origem e estrutura da Spec

Uma Spec pode ter uma ou mais fontes, como PRD no Confluence, ticket Jira,
report, design ou demanda direta. O PRD não é obrigatório para correções ou
tarefas técnicas, mas toda Spec possui Contract. Quando houver rastreabilidade
de trabalho, a demanda é representada por um ticket Jira; GitHub Issues e
milestones não são fontes de verdade do produto ou da execução.

```yaml
---
title: <título>
status: draft
revision: 1

sources:
  - type: <prd|jira-ticket|report|direct-request|design>
    ref: <confluence-url|jira-url|report-url|path|codex-task|design-ref>
    role: <product_requirements|delivery_scope|technical_context|visual_reference>

prd: <confluence-url, opcional>
jira_tickets:
  - <PROJ-123>
plan: <opcional>

scope:
  - <workspace|diretório|arquivo>

last_updated_at: YYYY-MM-DD
---
```

Valores de `status`: `draft`, `open`, `in_progress`, `completed` e
`cancelled`. O arquivo da Spec é a sua identidade; não é necessário um campo
`id` separado.

A estrutura do corpo da Spec é:

1. contexto e objetivo;
2. escopo e fora de escopo;
3. Contract;
4. estado atual;
5. solução técnica;
6. plano de validação;
7. plano de validação;
8. estado e referência para `evaluation.md`;
9. alinhamento documental;
10. amendments.

O Contract vem antes da solução técnica. Use somente `REQ-*` e `CA-*` como IDs
obrigatórios:

- `REQ-*`: requisito do produto ou da solução;
- `CA-*`: critério de aceitação verificável.

Segurança, performance e arquitetura entram como critérios de aceitação ou
restrições técnicas específicas. Não use `RN-*`, `RNF-*` ou `RA-*` como IDs
obrigatórios.

Cada Spec deve declarar premissas e questões pendentes. Antes de `open`, toda
questão pendente deve estar resolvida e toda premissa crítica deve estar
confirmada ou explicitamente aceita com risco e validação.

## Rastreabilidade

```text
PRD do Confluence/ticket Jira/report
→ REQ
→ CA
→ tarefa do Plan, quando existir
→ código e testes
→ evidência
→ Judge
```

A matriz de validação da Spec deve relacionar cada `CA-*` à evidência esperada.
Na conclusão, `evaluation.md` relaciona os critérios à evidência real, registra
os vereditos dos Judges, o Quality Gate, o build e os findings remanescentes.
A Spec mantém o Contract, o status e o link para a avaliação. O Plan registra
fases, tarefas, tentativas, findings e próxima ação.

## Ciclo de vida

```text
draft
  → Judge Spec: accepted
open
  → implementação iniciada
in_progress
  → fases + sensores
  → Judge Implementation único da entrega integrada
  → CI/build
completed
```

`cancelled` encerra uma Spec abandonada com motivo registrado. `failed` é
veredito de Judge; `blocked` é estado operacional de Plan ou tarefa.

Se o Contract mudar depois de `open`, pause, atualize o PRD no Confluence quando
aplicável, incremente `revision`, registre amendment e execute novamente o Judge
Spec. Não altere o status do ticket Jira automaticamente.
Uma alteração técnica pode atualizar a solução e revalidar apenas os critérios
afetados. Uma alteração editorial não exige nova avaliação.

## Onde e quando registrar mudanças

O Orchestrator deve classificar cada mudança, finding e lição no momento em que
for identificado e persistir no artefato correto, sem esperar uma solicitação
posterior:

| Tipo de mudança | Onde registrar | Quando |
|---|---|---|
| Contract, REQ/CA, regra de produto ou escopo | `spec.md` e PRD quando aplicável | Antes do próximo Builder; incremente `revision`, registre amendment e execute novamente o `Judge Spec`. |
| Fase, tarefa, finding, tentativa ou próxima ação operacional | `plan.md`, quando existir | Durante a implementação, imediatamente após a descoberta ou sensor/Judge. |
| Evidência, veredito, decisão de implementação ou lição específica da feature | `evaluation.md` | Após o Judge correspondente e novamente no `conclude-spec`. |
| Regra, arquitetura ou convenção de tooling reutilizável | `documentation/rules/*.md`, Architecture, tooling ou este SDD | Na conclusão, após decisão do usuário quando for mudança normativa. |
| Contexto temporário, credenciais, logs ou detalhes sensíveis | task/sessão atual ou Jira, conforme a política | Não persistir na pasta da feature nem copiar conteúdo sensível para o repositório. |

A Spec deve apontar para `plan.md` e `evaluation.md` quando existirem. Um
finding só está tratado quando a correção/evidência e o destino documental foram
atualizados.

## Orquestração de agentes

Todos os subagentes são criados diretamente pelo Orchestrator e são irmãos:

```text
Orchestrator
├── Builder Direct | Builder F<n>
├── Builder F<n>-T<m>, quando houver paralelismo real
├── Builder Fix QG-<n>, para correções
├── Judge Spec | Judge Plan
└── Judge Implementation único da entrega
```

Builder é o único papel de implementação. O contexto do nome indica o escopo:

- `Builder Direct`: Spec pequena;
- `Builder F<n>`: escopo principal de uma fase;
- `Builder F<n>-T<m>`: tarefa atômica independente;
- `Builder Fix QG-<n>`: correção de finding ou Quality Gate.

O Orchestrator decide se há paralelismo real, garante paths sem sobreposição e
integra o diff. Nenhum Builder cria subagentes. Judges são read-only e irmãos
dos Builders.

Quando existir `plan.md`, o Orchestrator aciona um único `Judge Plan` antes do
primeiro Builder. O Judge valida a necessidade, a decomposição, as dependências,
os paths, as fronteiras dos módulos e as evidências previstas; não avalia
código. Um veredito `failed` exige ajuste do Plan e nova avaliação. Somente um
Plan `accepted` pode avançar para `implement-plan`.

Para uma Spec pequena, use `implement-spec` com um `Builder Direct`. Para uma
Spec com fases dependentes, use `create-plan` e `implement-plan`. O Plan é
opcional.

## Sensores e execução

Validações oficiais:

| Script | Uso |
| --- | --- |
| `pnpm format` | aplicar formatação; não é gate |
| `pnpm lint` | lint e consistência estática |
| `pnpm check-types` | contratos TypeScript |
| `pnpm test` | comportamento automatizado |
| integração/e2e do workspace | APIs, banco, rotas e fluxos integrados, quando aplicável |

Revisão arquitetural é evidência da avaliação quando fronteiras ou dependências
mudam. Build não é sensor SDD; é validação final do artefato no CI.

Durante o ciclo curto:

```text
format → lint → check-types → test
```

O ciclo curto é o sensor padrão de cada fase. Não execute `build` a cada fase ou
a cada retry: o build é um gate caro do artefato integrado e deve rodar uma vez
no Quality Gate final, salvo mudança explícita em bundler, exports, ambiente,
Docker, workflows ou artefatos gerados.

Antes do Judge e do PR, execute os sensores aplicáveis no escopo integrado.
Faça revisão arquitetural quando imports, módulos ou fronteiras mudarem e
execute a integração/e2e do workspace quando contratos ou fluxos reais mudarem.

Antes do PR, faça um preflight local. O Quality Gate do CI repete os checks e
permanece a fonte oficial. O build roda depois do Quality Gate no CI. Build
local é recomendado quando houver mudanças em bundler, rotas, exports,
ambiente, Docker, workflows ou artefatos gerados.

Se o Quality Gate falhar, a Spec permanece `in_progress`. O Orchestrator
aciona `Builder Fix QG-<n>` quando a correção estiver no escopo e reexecuta
somente os sensores afetados. Não crie um Judge por fase, retry ou nova
execução dos mesmos comandos.

Depois de todas as fases concluídas e dos sensores integrados, acione no máximo
um `Judge Implementation` para a entrega completa. Se um finding exigir
correção, registre-o, aplique o Builder Fix, reexecute os sensores invalidados e
somente então repita o Judge final.

Antes de iniciar a fase final, faça um preflight dos pré-requisitos externos:
serviços locais, banco, Auth/Mailpit, credenciais de teste e Playwright. Se um
pré-requisito estiver indisponível, registre o bloqueio antes do Judge final em
vez de repetir julgamentos sem evidência nova.

## Avaliação

O `Judge Spec` avalia se o Contract e a solução são claros, rastreáveis e
implementáveis. O `Judge Implementation` avalia uma única implementação
integrada — direta ou resultante de um Plan — contra o Contract, Rules,
Architecture, testes, sensores e segurança proporcional ao risco.

Não existe um papel separado obrigatório de `Judge Conclusion`. O workflow
`conclude-spec` executa o fechamento; o único `Judge Implementation` da entrega
é o veredito de conclusão técnica. O Orchestrator só o repete após uma mudança
que invalide o diff ou as evidências.

As avaliações e evidências finais são registradas em `evaluation.md`. A Spec
mantém apenas o resumo de estado, o veredito final e o link para a avaliação;
pareceres extensos permanecem no contexto da task, e o Plan conserva o histórico
operacional necessário.

## Atualização documental

Qualquer agente pode identificar uma lacuna documental e reportar documento,
evidência, tipo e ação sugerida. Em workflows SDD, o Orchestrator controla as
fontes de verdade; fora deles, essa responsabilidade pertence ao agente
principal da task.

Bug Reports e Security Reports individuais pertencem ao Jira, não ao
repositório. O repositório mantém o prompt de criação, Specs derivadas, código,
testes de regressão e documentação técnica sanitizada. Não persista exploits,
credenciais, PII, logs de produção ou detalhes operacionais sensíveis.

Atualizações normativas necessárias para orientar a implementação acontecem
antes do Builder. Sincronizações factuais e aprendizados generalizáveis são
resolvidos em `conclude-spec`, que também audita se cada mudança foi registrada
no artefato correto. O PRD deve ser atualizado na página do Confluence
correspondente; não crie `prd.md`, milestone ou GitHub Issue como substituto.
Mudanças em PRD, novas Rules globais, fronteiras arquiteturais ou expansão de
escopo exigem decisão do usuário.

## MCPs

MCPs são ferramentas de contexto, não sensores. Use-os conforme o escopo:

- Context7: consultar documentação atualizada;
- Pencil: consultar e validar design;
- Playwright: inspecionar fluxos reais no navegador;

Playwright MCP não substitui `test:integration` quando o comportamento precisa
ser protegido por teste automatizado.

## Fontes de verdade

1. revisão humana explícita;
2. PRD no Confluence ou origem declarada da demanda;
3. Contract da Spec;
4. Architecture e Rules;
5. solução técnica da Spec;
6. Plan;
7. implementação atual.

Conflitos materiais devem ser resolvidos antes de continuar.
