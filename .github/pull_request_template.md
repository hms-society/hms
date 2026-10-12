## Objetivo

Descreva o problema e o comportamento resultante, com exclusões de escopo relevantes.

## Rastreabilidade

- Tickets Jira (chaves e links, ou nenhum):
- PRD Confluence (quando aplicável):
- Spec e revisão (ou manutenção direta):
- Evaluation / resultados dos checks:
- Critérios cobertos (`RF-*`, `CA-*`):
- PR predecessor / `stacked-pr` (quando aplicável):

## Escopo técnico

| Ação (Create / Modify / Delete) | Boundary | Caminhos / alteração |
| --- | --- | --- |
| | Core / Validation / Server / Web / documentação | |

Descreva mudanças de regra de negócio, permissão, interface pública ou persistência;
declare nenhuma quando não houver.

## Verificação

Use os comandos reais dos workspaces afetados, conforme Tooling. Não marque checks
não executados como aprovados. Evidência reutilizada deve identificar candidato,
limites e por que permanece aplicável; CI deve referir-se ao head atual de cada PR.

| Check | Tipo (Automated / Manual / Visual) | Comando / procedimento | Resultado | Artefatos / limites |
| --- | --- | --- | --- | --- |
| | | | | |

Inclua lint/formatação, tipos, arquitetura, complexidade, testes/coverage,
integration/build e mutation quando exigidos pelo contrato e Rules. Registre
mutation bloqueado se ainda não houver tooling. Para Manual, descreva apenas
cenários concisos executáveis por Playwright CLI/terminal com ambiente e resultado
observado. Para UI, inclua os viewports/teclado e comparações visuais exigidos.
Identifique transporte mocked e fluxos reais REST/Auth separadamente.

## Documentação e limitações

Informe o alinhamento documental, achados abertos, checks pendentes/bloqueados,
falhas históricas relevantes e qualquer entrega parcial ou dispensa explícita.
