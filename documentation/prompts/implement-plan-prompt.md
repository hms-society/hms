---
name: implement-plan
description: Orquestrar um Plan de feature com Builders irmãos, sensores e Judges independentes na task atual.
---

# Implementar Plan

Leia Plan, Spec, Architecture, Rules e `documentation/tooling.md`. Use
`documentation/rules/rules.md` para descobrir as regras das camadas tocadas. O
Orchestrator mantém o Plan e todo o fluxo ocorre na task atual.

Preserve no Plan o link do PRD no Confluence e todas as chaves de
`jira_tickets` da Spec. Consulte esses registros quando a integração estiver
disponível, mas não altere status, comentários ou critérios de aceite no Jira
ou no Confluence automaticamente.

Para cada fase:

1. confirme revisão da Spec, dependências, critérios, paths e evidências;
2. marque fase/tarefa como `in_progress`/`implementing`;
3. crie `Builder F<n>` para o escopo principal;
4. identifique tarefas prontas, independentes e sem paths sobrepostos;
5. quando houver paralelismo real, crie até dois `Builder F<n>-T<m>` irmãos;
6. aguarde os Builders, inspecione e integre o diff;
7. execute os comandos reais de validação do workspace descritos em
   `documentation/tooling.md` (`lint`/`check:code`, `check-types`/`check:types`
   e `test`); execute integração ou e2e quando a fase exigir;
   não execute `build` por fase ou por retry, salvo alteração em bundler,
   exports, ambiente, Docker, workflows ou artefatos gerados;
8. marque tarefas `verified` somente após os sensores aplicáveis;
9. crie exatamente um `Judge Implementation` `Phase F<n>` read-only irmão dos
   Builders, após os sensores;
10. em `failed`, registre imediatamente o finding no Plan e em `evaluation.md`,
    crie Builder Fix, reabra tarefas afetadas e repita somente os
    sensores invalidados; crie novo Judge apenas quando o diff ou a evidência
    tiver mudado; em `accepted`, aceite a fase e avance.

Builders não criam subagentes nem editam Plan. Judges não editam arquivos. O
Orchestrator registra no Plan decisões, evidências resumidas, findings,
tentativas e próxima ação; registra as avaliações formais e evidências finais em
`evaluation.md`, mantendo na Spec apenas o resumo e a referência para esse
arquivo. Cada Judge deve deixar sua evidência e decisão persistidas antes de
avançar para a próxima fase.

Após todas as fases aceitas, execute sensores integrados. Quando a integração
exigir avaliação adicional, faça antes um preflight de banco, Auth, serviços
locais, credenciais de teste e Playwright. Então crie um único `Judge
Implementation Final`; o `build` roda somente no Quality Gate final. Depois
encaminhe para `conclude-spec`.

Não crie outro papel de implementação ou Judge de conclusão separado, fork ou
nova thread.
