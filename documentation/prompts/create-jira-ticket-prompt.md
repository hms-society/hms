# Prompt para criação padronizada de ticket Jira

Use este prompt para criar tickets no Jira seguindo o padrão do projeto:

```text
/create-jira-ticket

Crie um ticket no Jira seguindo estas regras.

## Dados do ticket

- Projeto: <PROJECT_KEY>
- Tipo: <Tarefa|História|Bug>
- Resumo: <título curto e objetivo>
- Sprint: <nome ou número da sprint>
- Responsável: <nome do usuário>
- Labels: <labels opcionais>
- Prioridade: <prioridade opcional>

## Origem

- PRD: <URL do PRD>
- Design/Figma/Pencil: <URL ou Node ID, se houver>
- Tickets relacionados: <chaves Jira, se houver>

Antes de criar:

1. Pesquise tickets semelhantes no Jira para evitar duplicidade.
2. Confirme o usuário responsável e a sprint.
3. Leia a origem completa e extraia apenas os requisitos aplicáveis ao escopo.
4. Não invente requisitos, IDs, links ou critérios.
5. Se houver ambiguidade que altere o escopo, peça esclarecimento antes de criar.

## Descrição

Escreva a descrição em Markdown com esta estrutura:

### Objetivo

Explique o resultado esperado e o valor para o usuário.

### Rastreabilidade

Liste os requisitos da origem usando IDs `REQ-*`.

Exemplo:

- `REQ-003` — criação em etapas;
- `REQ-005` — vínculo com Cliente;
- `REQ-006` — decisão inicial.

### Escopo funcional

Liste os comportamentos que devem ser implementados.

### Fora do escopo

Liste explicitamente o que não será implementado neste ticket.

### Regras de negócio e integração

Descreva permissões, idempotência, estados, dependências e fronteiras entre módulos.

### Critérios de aceitação

Use critérios verificáveis numerados como `CA-*`.

Exemplo:

- [ ] `CA-001` — O usuário consegue concluir o fluxo com dados válidos.
- [ ] `CA-002` — Campos obrigatórios exibem validação inline.
- [ ] `CA-003` — Falhas preservam os dados preenchidos.
- [ ] `CA-004` — A operação não cria registros duplicados.

### Validação

Inclua testes automatizados, lint, typecheck, integração/e2e ou validação visual aplicável.

### Referências

Inclua os links do PRD, design e tickets relacionados.

Depois de criar:

1. Verifique se o ticket foi criado corretamente.
2. Confirme título, tipo, sprint, responsável, labels e status.
3. Informe a chave e o link do ticket.
4. Informe qualquer limitação ou campo que não pôde ser preenchido.
```

## Convenção de IDs

- `REQ-*` identifica requisitos extraídos da origem.
- `CA-*` identifica critérios de aceitação verificáveis do ticket.
- Não use `RF-*`, `RQ-*` ou `INT-*` como IDs normativos neste fluxo.
