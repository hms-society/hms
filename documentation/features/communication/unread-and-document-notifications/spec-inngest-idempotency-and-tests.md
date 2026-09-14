---
title: Especificação Técnica - Idempotência no Webhook Inngest, Testes de Integração e Limpeza de Links
status: open
revision: 1
source:
  type: code_review_remediation
scope:
  - apps/server/src/communication/messaging/inngest/jobs
  - apps/server/src/communication/rest/controllers
  - documentation/features/communication
last_updated_at: 2026-09-14
---

# Contexto e Objetivo

## Contexto
A revisão final do PR #147 levantou pontos críticos de concorrência, idempotência e cobertura de testes:
1. O job de processamento de eventos do WhatsApp (`process-whatsapp-event-job.ts`) grava registros de mensagens privadas sem validar a chave de mensagem do Meta (`wamid`). Em retentativas do Inngest ou webhooks duplicados, o sistema cria múltiplas mensagens e notificações de documento duplicadas.
2. Faltavam testes de integração via Supertest no `SendCommunicationController` cobrindo requisições com templates, fallbacks de env, rejeições de canais inválidos e consentimento.
3. Especificações técnicas continham links locais absolutos (`file:///home/kauan/...`), que quebram a navegação em outros ambientes e no CI.

## Objetivo
1. Implementar verificação de idempotência baseada no `wamid` do Meta no `ProcessWhatsappEventJob`.
2. Adicionar suíte de testes de integração para o controller de comunicação.
3. Atualizar os links da documentação para caminhos relativos do repositório.

---

# Escopo

## Incluído
- **`apps/server/src/communication/messaging/inngest/jobs/process-whatsapp-event-job.ts`**:
  - Verificar a existência do `wamid` (ou ID da mensagem do Meta) na base antes de inserir novos registros de documento ou mensagem inbound.
- **`apps/server/src/communication/rest/controllers/send-communication.controller.spec.ts`**:
  - Implementar testes de integração cobrindo fluxos de sucesso e falha (templates, fallbacks, validação de canais e consentimento).
- **Documentação do repositório**:
  - Substituir links absolutos por links relativos em `documentation/features/communication/`.

---

# Requisitos Funcionais e Critérios de Aceitação

## Requisitos Funcionais

### RF-01 — Idempotência em Webhooks de Entrada
O job Inngest `ProcessWhatsappEventJob` deve checar se a mensagem referente ao `wamid` recebido da Meta já foi persistida em `private_messages`. Se já existir, a execução deve ser encerrada silenciosamente sem duplicar registros ou notificações.

### RF-02 — Testes de Integração de Comunicação
O controller `SendCommunicationController` deve possuir testes cobrindo:
- Envio com `type: 'template'` para `channel: 'whatsapp'` (sucesso e fallback de env).
- Rejeição de `type: 'template'` para `channel: 'email'` ou `'phone'` (HTTP 400).
- Rejeição por ausência de consentimento ativo de comunicação.

### RF-03 — Portabilidade das Especificações
Todos os arquivos de documentação markdown em `documentation/features/` devem utilizar exclusivamente caminhos relativos do repositório.

---

## Critérios de Aceitação

| CA | RF | Dado | Quando | Então |
|---|---|---|---|---|
| CA-01 | RF-01 | O webhook do WhatsApp reenvia o mesmo evento com `wamid` idêntico | O Inngest reprocessa o evento | Nenhum novo registro é duplicado no banco de dados |
| CA-02 | RF-02 | A suíte de testes `pnpm test` é executada no servidor | O arquivo de teste do `SendCommunicationController` roda | Todos os testes de integração do controller passam 100% |
| CA-03 | RF-03 | Um desenvolvedor visualiza as especificações em outro ambiente | Abre os links da documentação | Os links navegam corretamente sem erros de caminho não encontrado |
