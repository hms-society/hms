---
name: implement-spec
description: Orquestrar a implementação direta de uma Spec pequena com Builder Direct, sensores e Judge Implementation na task atual.
---

# Implementar Spec diretamente

Use para uma Spec `open`, pequena e coesa:

```text
Orchestrator → Builder Direct → sensores → Judge Implementation Direct
```

Antes de implementar, o Orchestrator deve localizar o Plan da Spec. Se a Spec
não possuir um Plan, crie um Plan mínimo de implementação com a referência
para a Spec e `evaluation.md`; o fluxo direto não dispensa o ledger.

Após **cada mudança de implementação**, o Orchestrator deve atualizar
imediatamente o Plan e `evaluation.md` antes de iniciar a próxima ação. Isso
inclui alterações feitas pelo Builder Direct e Builder Fix, correções de retry,
mudanças em seed ou ambiente, artefatos gerados, arquivos de configuração,
testes adicionados ou alterados e qualquer reversão parcial. Nunca acumule
mudanças para registrá-las somente no final. Cada checkpoint deve registrar
resumo da mudança, paths afetados, impacto sobre os critérios/evidências e os
sensores que precisam ser reexecutados.

1. Leia Spec, Architecture, Rules e `documentation/tooling.md`. Preserve o link
   do PRD no Confluence e todas as chaves de `jira_tickets`; consulte-os quando
   a integração estiver disponível, sem alterar seus estados automaticamente.
2. Congele a revisão e o commit-base.
3. Crie `Builder Direct` como subagente e envie Contract, resultado observável,
   paths, Rules, Architecture e MCPs aplicáveis.
4. Inspecione o diff; o Builder não atualiza Spec, Plan ou estado.
5. Execute os comandos reais de validação do workspace descritos em
   `documentation/tooling.md` (`lint`/`check:code`, `check-types`/`check:types`
   e `test`); execute integração ou e2e quando aplicável.
   Não execute `build` em cada retry; reserve-o para o Quality Gate final,
   exceto quando a alteração tocar bundler, exports, ambiente, Docker,
   workflows ou artefatos gerados.
6. Crie `Judge Implementation` read-only irmão do Builder. Envie Spec, revisão,
   diff, critérios, Rules, Architecture e evidências oficiais.
7. Se `failed`, registre imediatamente o finding em `evaluation.md`, crie
   `Builder Fix QG-<n>`, reexecute somente os sensores invalidados e acione novo
   Judge apenas quando o diff ou a evidência mudar. Após três falhas iguais,
   escale ao usuário.
8. Se `accepted`, registre a avaliação e as evidências em `evaluation.md` e
   encaminhe para `conclude-spec`.

O registro pós-mudança é obrigatório mesmo quando a mudança não altera código
de produção: seed, variáveis de ambiente, configuração de execução, artefato
gerado e teste são mudanças de implementação para esta finalidade. Atualize o
Plan com o estado operacional e `evaluation.md` com a evidência/limitação
correspondente no mesmo checkpoint.

Não crie outro papel de implementação ou Judge de conclusão separado, fork ou
nova task.
