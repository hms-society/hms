---
title: Especificação Técnica - Resolução de Templates WhatsApp e Validações de Segurança no Servidor
status: open
revision: 2
source:
  type: code_review_remediation
scope:
  - apps/server/src/communication/rest/controllers
  - apps/server/src/communication/rest/dtos
  - apps/server/src/shared/communication
  - packages/core/src/communication/interfaces
last_updated_at: 2026-09-15
---

# Contexto e Objetivo

## Contexto
Revisões do Pull Request #147 apontaram inconsistências e vulnerabilidades no envio de mensagens do tipo `template` via WhatsApp:
1. O backend aceitava `type: 'template'` em requisições com `channel: 'email'` ou `'phone'`, registrando sucesso na base sem disparar mensagem para o cliente.
2. O conteúdo persistido em `private_messages` dependia da string livre enviada pelo frontend (`body.content`), permitindo registrar textos arbitrários ao invés do conteúdo oficial do template Meta.
3. Não há necessidade de travamento prévio por consentimento de comunicação ativada (`whatsapp_communication`) para o disparo de mensagens para clientes que possuem telefone cadastrado.
4. O `WhatsappProvider` lançava exceções brutas da Graph API contendo JSON interno de erro da Meta.
5. O contrato da interface `WhatsappProvider` em `@hms/core` definia `sendTemplateMessage?` como opcional, tornando o contrato inseguro em instâncias da interface.

## Objetivo
Padronizar a segurança e robustez do servidor para mensagens do tipo `template`:
1. Rejeitar `type: 'template'` quando `channel !== 'whatsapp'`.
2. Omitir `templateName` no frontend por padrão, deixando o servidor resolver via `WHATSAPP_START_WINDOW_TEMPLATE_NAME` da env, e derivar o texto oficial no backend.
3. Permitir o envio de comunicações via WhatsApp bastando que o cliente possua número de telefone válido cadastrado.
4. Mapear erros de requisição da Graph API para `AppError` seguro e manter os detalhes brutos restritos a logs.
5. Tornar o método `sendTemplateMessage` obrigatório no `@hms/core`.

---

# Escopo

## Incluído
- **`apps/server/src/communication/rest/controllers/send-communication.controller.ts`**:
  - Rejeitar `type: 'template'` quando `channel !== 'whatsapp'` com `BadRequestException`.
  - Derivar o conteúdo oficial do template no servidor quando `type === 'template'`.
  - Validar presença do número de telefone do cliente sem bloquear por registro de consentimento prévio.
- **`apps/server/src/shared/communication/whatsapp.provider.ts`**:
  - Envelopar falhas HTTP/API em `AppError` da aplicação, mascarando detalhes sensíveis do provedor.
- **`packages/core/src/communication/interfaces/whatsapp-provider.ts`**:
  - Tornar `sendTemplateMessage` método obrigatório da interface.

---

# Requisitos Funcionais e Critérios de Aceitação

## Requisitos Funcionais

### RF-01 — Restrição de Templates para o Canal WhatsApp
Requisições que especificarem `type: 'template'` devem ser obrigatoriamente vinculadas ao `channel: 'whatsapp'`. Qualquer tentativa de enviar template para outros canais deve falhar imediatamente com status HTTP 400.

### RF-02 — Resolução do Nome e Derivação do Conteúdo do Template
Se `templateName` não for informado no corpo da requisição, o servidor deve utilizar o valor padrão configurado em `WHATSAPP_START_WINDOW_TEMPLATE_NAME`. O texto persistido em `private_messages` deve ser derivado e padronizado do lado do servidor (ex: `"Olá. Podemos conversar sobre o caso?"`).

### RF-03 — Envio via WhatsApp Independente de Consentimento Prévio
O envio de mensagens ou templates via WhatsApp não exige consentimento registrado em `client_consents`. Basta que o cliente possua número de telefone cadastrado no seu perfil (`client.phone`). Se o cliente não possuir número de telefone cadastrado, retornar erro HTTP 400 Bad Request.

### RF-04 — Sanitização de Erros do Provedor Meta
Erros retornados pela API Graph do Meta não devem expor a mensagem JSON bruta para os clientes da API REST. Devem ser capturados no `WhatsappProvider`, registrados em log com nível de detalhamento interno, e lançar um `AppError` com mensagem amigável e código de erro conhecido.

---

## Critérios de Aceitação

| CA | RF | Dado | Quando | Então |
|---|---|---|---|---|
| CA-01 | RF-01 | Uma requisição com `type: 'template'` e `channel: 'email'` | Enviada ao `POST /communications/send` | Retorna erro HTTP 400 (Bad Request) informando que templates só são suportados para WhatsApp |
| CA-02 | RF-02 | Uma requisição com `type: 'template'` sem `templateName` | Processada pelo controller | O servidor utiliza o template resolvido pela env e grava o texto oficial do template na base |
| CA-03 | RF-03 | Um cliente com telefone cadastrado, mas sem registro de consentimento prévio de WhatsApp | Qualquer tentativa de envio para o cliente | O servidor aceita a requisição e envia a mensagem normalmente |
| CA-04 | RF-04 | A API do Meta responde com erro HTTP 400 ou token expirado | O `WhatsappProvider` executa | O erro é logado internamente e uma exceção `AppError` padronizada é lançada |
