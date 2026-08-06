---
name: implement-plan
description: Orquestrar um Plan de feature com Builders irmãos, sensores e um único Judge Implementation final na task atual.
---

# Implementar Plan

Leia Plan, Spec, Architecture, Rules e `documentation/tooling.md`. Use
`documentation/rules/rules.md` para descobrir as regras das camadas tocadas. O
Orchestrator mantém o Plan e todo o fluxo ocorre na task atual.

Se o Plan ou a Spec referenciar um arquivo `.pen`, `design/hms.pen` ou nodes
Pencil, a validação Pencil é obrigatória: antes de qualquer outra operação
Pencil, obtenha o estado do editor com schema; inspecione os nodes canônicos
referenciados e capture screenshot do Pencil e screenshot do Playwright para
cada tela/node/estado correspondente, usando viewport e estado equivalentes
quando possível. A comparação visual node a node é obrigatória; snapshot de
acessibilidade, DOM ou screenshot isolado do Playwright não a substitui.
Registre no `evaluation.md`, por node, as duas evidências e as divergências.
Se o arquivo ou node não existir, classifique a validação como
`visual_validation_blocked`/`limited`, registre o erro e não declare a
comparação concluída. Nunca leia `.pen` com shell, Read ou Grep; use somente as
operações Pencil.

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
9. registre o checkpoint de sensores da fase no Plan, sem criar Judge
   intermediário; em caso de falha, registre o finding, crie Builder Fix,
   reabra tarefas afetadas e repita somente os sensores invalidados;
10. avance entre fases somente com as tarefas e sensores aplicáveis verificados;
    não atribua veredito de Judge a uma fase intermediária.

Builders não criam subagentes nem editam Plan. Judges não editam arquivos. O
Orchestrator registra no Plan decisões, evidências resumidas, findings,
tentativas e próxima ação; registra as avaliações formais e evidências finais em
    `evaluation.md`, mantendo na Spec apenas o resumo e a referência para esse
    arquivo. Os checkpoints de fase registram sensores e findings; não registram
    vereditos de Judge.

Após todas as fases, execute sensores integrados. Quando a integração exigir
avaliação adicional, faça antes um preflight de banco, Auth, serviços locais,
credenciais de teste e Playwright. Então crie exatamente um único `Judge
Implementation Final` para a implementação inteira; o `build` roda somente no
Quality Gate final. Se falhar, corrija, repita os sensores invalidados e rode
novamente o mesmo Judge final somente após o diff/evidência mudar. Depois
encaminhe para `conclude-spec`.

Não crie outro papel de implementação ou Judge de conclusão separado, fork ou
nova thread.
