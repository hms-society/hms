---
name: create-jira-ticket
description: Prompt para criar tickets Jira rastreáveis ao PRD e ao design do HMS.
---

# Prompt: Criar Ticket Jira

Use este prompt para criar um ticket no Jira seguindo o padrão do projeto HMS.

## Dados do ticket

- Projeto: `<PROJECT_KEY>`
- Tipo: `<História|Tarefa|Bug>`
- Resumo: `<título curto e objetivo>`
- Sprint: `<nome ou número da sprint>`
- Responsável: `<nome do usuário>`
- Labels: `<labels opcionais>`
- Prioridade: `<prioridade opcional>`

## Origem

- PRD: `<URL do PRD>`
- Pencil/Figma: `<caminho do arquivo, URL ou Node IDs, se houver>`
- Tickets relacionados: `<chaves Jira, se houver>`

Antes de criar:

1. Pesquise tickets semelhantes no Jira para evitar duplicidade.
2. Confirme o projeto, a sprint e o responsável.
3. Leia o PRD e extraia somente os requisitos aplicáveis ao ticket.
4. Inspecione os Nodes do Pencil quando eles forem informados.
5. Não invente requisitos, IDs, links ou referências.
6. Se houver ambiguidade que altere o escopo, peça esclarecimento antes de criar.

## Descrição do ticket

Escreva a descrição em Markdown usando somente esta estrutura:

### Objetivo

Explique o resultado esperado e o valor para o usuário.

### Requisitos do PRD

Liste os requisitos aplicáveis usando os IDs originais `REQ-*`.

- `REQ-001` — descrição objetiva do requisito;
- `REQ-002` — descrição objetiva do requisito.

### Referências

- PRD: `<URL>`
- Pencil/Figma: `<arquivo, URL ou Node IDs>`
- Tickets relacionados: `<chaves Jira>`

Não inclua as seções `Escopo funcional`, `Regras de negócio e integração`,
`Critérios de aceitação`, `Validação` ou outras seções adicionais.

## Depois de criar

1. Verifique o título, tipo, sprint, responsável, labels e status.
2. Confirme que a descrição contém apenas as três seções definidas.
3. Informe a chave e o link do ticket.
4. Informe qualquer campo que não pôde ser preenchido.
