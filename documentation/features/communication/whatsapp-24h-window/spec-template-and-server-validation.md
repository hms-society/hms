---
title: Especificação Técnica - Resolução de Templates WhatsApp e Validações de Segurança no Servidor
status: open
revision: 1
source:
  type: code_review_remediation
scope:
  - apps/server/src/communication/rest/controllers
  - apps/server/src/communication/rest/dtos
  - apps/server/src/shared/communication
  - packages/core/src/communication/interfaces
last_updated_at: 2026-09-14
---

# Contexto e Objetivo

## Contexto
Revisões do Pull Request #147 apontaram inconsistências e vulnerabilidades no envio de mensagens do tipo `template` via WhatsApp:
1. O backend aceitava `type: 'template'` em requisições com `channel: 'email'` ou `'phone'`, registrando sucesso na base sem disparar mensagem para o cliente.
2. O conteúdo persistido em `private_messages` dependia da string livre enviada pelo frontend (`body.content`), permitindo registrar textos arbitrários ao invés do conteúdo oficial do template Meta.
3. Não havia verificação prévia de consentimento de comunicação ativada (`whatsapp_communication`), violando a regra de domínio de consentimento.
4. O `WhatsappProvider` lançava exceções brutas da Graph API contendo JSON interno de erro da Meta.
5. O contrato da interface `WhatsappProvider` em `@hms/core` definia `sendTemplateMessage?` como opcional, tornando o contrato inseguro em instâncias da interface.

## Objetivo
Padronizar a segurança e robustez do servidor para mensagens do tipo `template`:
1. Rejeitar `type: 'template'` quando `channel !== 'whatsapp'`.
2. Omitir `templateName` no frontend por padrão, deixando o servidor resolver via `WHATSAPP_START_WINDOW_TEMPLATE_NAME` da env, e derivar o texto oficial no backend.
3. Exigir verificação de consentimento ativo do WhatsApp (`whatsapp_communication`) antes do envio.
4. Mapear erros de requisição da Graph API para `AppError` seguro e manter os detalhes brutos restritos a logs.
5. Tornar o método `sendTemplateMessage` obrigatório no `@hms/core`.

---

# Escopo

## Incluído
- **`apps/server/src/communication/rest/controllers/send-communication.controller.ts`**:
  - Rejeitar `type: 'template'` quando `channel !== 'whatsapp'` com `BadRequestException`.
  - Derivar o conteúdo oficial do template no servidor quando `type === 'template'`.
  - Executar verificação de consentimento ativo de comunicação antes do disparo.
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

### RF-03 — Verificação Obrigatória de Consentimento Ativo
Antes de disparar mensagens ou templates via WhatsApp, o controller deve validar se o cliente possui consentimento ativo para o canal `whatsapp`. Caso o consentimento não esteja ativo, retornar `ActiveCommunicationConsentNotFoundError` / 400 Bad Request.

### RF-04 — Sanitização de Erros do Provedor Meta
Erros retornados pela API Graph do Meta não devem expor a mensagem JSON bruta para os clientes da API REST. Devem ser capturados no `WhatsappProvider`, registrados em log com nível de detalhamento interno, e lançar um `AppError` com mensagem amigável e código de erro conhecido.

---

## Critérios de Aceitação

| CA | RF | Dado | Quando | Então |
|---|---|---|---|---|
| CA-01 | RF-01 | Uma requisição com `type: 'template'` e `channel: 'email'` | Enviada ao `POST /communications/send` | Retorna erro HTTP 400 (Bad Request) informando que templates só são suportados para WhatsApp |
| CA-02 | RF-02 | Uma requisição com `type: 'template'` sem `templateName` | Processada pelo controller | O servidor utiliza o template resolvido pela env e grava o texto oficial do template na base |
| CA-03 | RF-03 | Um cliente com consentimento de WhatsApp revogado/inativo | Qualquer tentativa de envio para o cliente | O servidor bloqueia o envio e lança erro de consentimento ausente |
| CA-04 | RF-04 | A API do Meta responde com erro HTTP 400 ou token expirado | O `WhatsappProvider` executa | O erro é logado internamente e uma exceção `AppError` padronizada é lançada |
