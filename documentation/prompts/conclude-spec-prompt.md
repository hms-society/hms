---
name: conclude-spec
description: Fechar uma Spec de feature com evidências finais, CI Quality Gate e build, usando Judge Implementation final quando necessário.
---

# Concluir Spec

O Orchestrator conduz o fechamento na task atual. Não crie nova thread.

## Pré-condições

- Spec `in_progress`;
- implementação direta aceita ou todas as fases aceitas;
- nenhuma tarefa ou finding bloqueante pendente;
- revisão da Spec correspondente ao diff atual.

## Validação final

1. Execute `pnpm format` se ainda houver alterações.
2. Execute `pnpm lint`, `pnpm check-types` e `pnpm test` no escopo integrado.
3. Execute a revisão arquitetural documentada em `documentation/rules/rules.md`
   quando fronteiras ou dependências mudarem.
4. Execute integração/e2e conforme declarado pela Spec ou aplicável.
5. Classifique todas as mudanças e findings descobertos e confirme que cada um
   está registrado na Spec, no Plan, em `evaluation.md` ou em uma
   Rule/Architecture/tooling apropriada.
6. Atualize `evaluation.md` com a matriz de evidências reais, os vereditos dos
   Judges, o resultado do Quality Gate/build e os findings remanescentes.
7. Crie `Judge Implementation Final` quando houver Plan, múltiplas fases, alto
   risco ou mudança após o último veredito.
8. Registre na Spec apenas o status, o veredito resumido, o commit avaliado e o
   link para `evaluation.md`.

Em uma Spec pequena, o `Judge Implementation Direct` pode ser o veredito final
e não há segundo Judge.

## Documentação e entrega

Verifique o PRD na página do Confluence, as Rules, Architecture, modules,
tooling e overview conforme os fatos. Quando houver autorização para atualizar
fontes externas, altere o PRD no Confluence e preserve todas as chaves Jira da
Spec/Plan. Não crie ou atualize milestones/GitHub Issues e não altere status de
tickets Jira sem instrução explícita.
Atualizações normativas que alteram produto, Contract, Rules globais ou
fronteiras arquiteturais exigem decisão do usuário.

Antes de criar cada PR, calcule o diff completo contra a branch base e some as
linhas adicionadas e removidas (`git diff --numstat`). Nenhum PR pode exceder
5.000 linhas alteradas. O limite vale para o PR inteiro, não para commits
individuais, e não pode ser contornado repartindo a mesma entrega apenas em
commits.

Se o diff exceder 5.000 linhas, divida a entrega em PRs menores e coesos, com
responsabilidades claras, dependências explícitas e validação própria. Prefira
dividir por fatias verticais ou por etapas de dependência que possam ser
revisadas e integradas com segurança; não faça cortes arbitrários por arquivo
ou por quantidade de linhas. Cada PR deve ter objetivo, escopo, testes,
rastreabilidade e revisão próprios. Registre na Spec e em `evaluation.md` a
ordem dos PRs, seus limites de escopo e os links correspondentes. Só conclua a
Spec depois que todos os PRs necessários tiverem passado pelo Quality Gate e
estiverem mergeable.

Crie cada commit e PR, solicite Codex Review e aguarde Quality Gate e build do
`HEAD` correspondente. O Quality Gate repete os sensores oficiais; build é a
validação final do artefato no CI.

Se Quality Gate ou build falhar, mantenha a Spec `in_progress`, registre a
falha em `evaluation.md`; crie `Builder Fix QG-<n>` quando a correção estiver no
escopo, reexecute sensores invalidados e reavalie se o diff mudar.

Somente depois de CI verde, conversas bloqueantes resolvidas e PR mergeable:

- preencha as evidências finais em `evaluation.md`;
- registre alinhamento documental;
- atualize a Spec para `completed` e aponte para `evaluation.md`;
- conclua o Plan, quando existir.
