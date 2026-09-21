---
title: Suporte a Janela de Atendimento de 24 Horas da Meta no WhatsApp
status: open
revision: 1
source:
  type: user_request
scope:
  - apps/server/src/communication/rest/dtos
  - apps/server/src/communication/rest/controllers
  - apps/server/src/shared/communication
  - apps/web/src/rest/services
  - apps/web/src/ui/identity/widgets/pages/lawyer-page
last_updated_at: 2026-09-14
---

# Contexto e Objetivo

## Contexto

As diretrizes da Meta para o WhatsApp Business API determinam que o envio de mensagens de texto livre (*freeform text*) para um cliente só é permitido dentro de uma **janela de atendimento de 24 horas**. Essa janela é iniciada ou renovada a cada nova mensagem recebida do cliente ou a cada mensagem de template enviada pelo escritório.

Se mais de 24 horas se passarem desde a última mensagem trocada (ou caso não exista mensagem prévia), a janela de conversa estará **FECHADA**. Nesses casos, o envio de mensagens de texto livre falha na API da Meta. Para reabrir a janela, o advogado deve iniciar o contato utilizando um template de mensagem pré-aprovado pela Meta (ex: `inicio_atendimento_ola`).

## Objetivo

Implementar a regra de controle da janela de conversa de 24 horas no módulo de comunicação da plataforma HMS:
1. Identificar se a janela de atendimento com o cliente está **aberta** ou **fechada** com base no horário da mensagem mais recente (enviada ou recebida).
2. Na interface do advogado (`ChatViewPanel`), quando a janela estiver **fechada**:
   - Exibir um banner explicativo sobre a restrição de 24 horas da Meta.
   - Fornecer o botão **"Iniciar janela de conversa"**.
   - Ocultar/substituir o campo de mensagem de texto livre para evitar envios que seriam rejeitados pela Meta.
3. Ao acionar o botão de iniciar janela, disparar a mensagem de template `inicio_atendimento_ola` (configurável via `WHATSAPP_START_WINDOW_TEMPLATE_NAME`) para o cliente, registrar o texto do template no histórico (`private_messages`) e reabrir a janela por 24 horas.

---

# Escopo

## Incluído

- **Servidor (`apps/server`)**:
  - Parametrizar a variável de ambiente `WHATSAPP_START_WINDOW_TEMPLATE_NAME` no `EnvProvider` (com fallback para `'inicio_atendimento_ola'`).
  - Atualizar o DTO `SendCommunicationDto` para aceitar envio do tipo `template` (`type?: 'text' | 'template'`, `templateName?: string`).
  - Atualizar `WhatsappProvider.sendTextMessage` / `sendTemplateMessage` para suportar disparos de templates registrados na Meta API.
  - Atualizar o `SendCommunicationController` para tratar mensagens de template, persistindo o texto oficial do template ("Olá! Gostaria de falar sobre o seu caso. Podemos conversar?") na tabela `private_messages`.
- **Web (`apps/web`)**:
  - Atualizar o `CommunicationService` e os hooks de comunicação para enviar payloads com tipo `template`.
  - Calcular o estado da janela (`isWindowClosed`) no `ChatViewPanel` verificando se a última mensagem (seja `inbound` ou `outbound`) possui timestamp há mais de 24 horas ou se a conversa não possui mensagens.
  - Renderizar o banner explicativo e o botão **"Iniciar janela de conversa"** quando `isWindowClosed` for verdadeiro.
  - Atualizar a interface reabilitando o campo de texto livre assim que o template for enviado com sucesso.
- **Validação e Testes**:
  - Testes unitários para o DTO, controller e provider de envio de template.
  - Testes de widget do `ChatViewPanel` cobrindo o estado com janela aberta e janela fechada.

## Fora de Escopo

- Gestão visual de múltiplos templates da Meta no painel (nesta entrega o template de abertura de janela é fixo/configurável).
- Criação e cadastro direto de novos templates na API da Meta via interface administrativa (a criação do template continua sendo realizada na Meta Cloud API / cURL).

---

# Contract

## Requisitos Funcionais

### RF-01 — Determinação do Estado da Janela de Conversa (24h)
A aplicação deve determinar que a janela de conversa com o cliente está **aberta** se a mensagem mais recente registrada no histórico do chat (seja enviada pelo escritório ou recebida do cliente) tiver ocorrido dentro das últimas 24 horas. Caso contrário (última mensagem > 24h ou sem histórico), a janela estará **fechada**.

### RF-02 — Banner Explicativo e Botão de Abertura na Interface
Quando a janela de conversa estiver **fechada**, a área inferior do `ChatViewPanel` não deve permitir a digitação em campo livre. Em seu lugar, deve exibir um banner informativo contendo:
- Uma breve explicação clara sobre a política de privacidade e a janela de 24 horas imposta pela Meta para mensagens no WhatsApp Business.
- O botão em destaque **"Iniciar janela de conversa"**.

### RF-03 — Envio do Template e Reabertura da Janela
Ao clicar no botão **"Iniciar janela de conversa"**:
- O sistema deve enviar o template `inicio_atendimento_ola` (ou o valor definido em `WHATSAPP_START_WINDOW_TEMPLATE_NAME`) para o telefone do cliente via Meta Graph API.
- Deve gravar uma mensagem no histórico (`private_messages`) com o conteúdo do template ("Olá! Gostaria de falar sobre o seu caso. Podemos conversar?"), `direction: 'outbound'` e o timestamp atual.
- O envio do template atualiza o estado do chat, fazendo com que `isWindowClosed` passe a ser `false` e a caixa de texto livre volte a ficar visível e habilitada.

### RF-04 — Atualização da Janela via Mensagens Inbound
Ao receber qualquer mensagem de texto ou mídia enviada pelo cliente (evento inbound via webhook), o registro é gravado com o timestamp atual, renovando automaticamente a janela de 24 horas para respostas do advogado.

---

## Critérios de Aceitação

| CA | RF | Dado | Quando | Então |
|---|---|---|---|---|
| CA-01 | RF-01 | Um chat cuja última mensagem (inbound ou outbound) foi criada há mais de 24h | O advogado abre o chat no `ChatViewPanel` | A propriedade `isWindowClosed` deve ser avaliada como `true` |
| CA-02 | RF-02 | A janela do chat está fechada (`isWindowClosed === true`) | O `ChatViewPanel` é renderizado | Exibe o banner explicativo da Meta e o botão "Iniciar janela de conversa"; a área de digitação livre fica oculta |
| CA-03 | RF-03 | A janela do chat está fechada | O advogado clica em "Iniciar janela de conversa" | Dispara requisição de envio do template `inicio_atendimento_ola`, insere o registro na tabela `private_messages`, atualiza a lista e reabilita o campo de texto livre |
| CA-04 | RF-04 | A janela do chat está fechada | O cliente envia uma mensagem de WhatsApp para o escritório | A mensagem inbound é gravada no banco com horário recente, renovando a janela e tornando `isWindowClosed = false` |

---

# Solução Técnica

## 1. Servidor (`apps/server`)

### Parametrização da Variável de Ambiente:
Adicionar ao `EnvProvider` (`apps/server/src/shared/provision/env/env-provider.ts`):
```typescript
WHATSAPP_START_WINDOW_TEMPLATE_NAME: z.string().default('inicio_atendimento_ola')
```

### Atualização do DTO:
Atualizar `SendCommunicationDto` ([send-communication.dto.ts](../../../../apps/server/src/communication/rest/dtos/send-communication.dto.ts)):
```typescript
export const sendCommunicationSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1),
  channel: z.enum(['whatsapp', 'email', 'phone']),
  type: z.enum(['text', 'template']).default('text').optional(),
  templateName: z.string().optional(),
})
```

### Atualização do Controller & Provider:
- No [whatsapp.provider.ts](../../../../apps/server/src/shared/communication/whatsapp.provider.ts), garantir método `sendTemplateMessage(phone: string, templateName: string)` que realiza chamada `POST` na API do Graph da Meta com `type: 'template'`.
- No [send-communication.controller.ts](../../../../apps/server/src/communication/rest/controllers/send-communication.controller.ts), se `body.type === 'template'`, invocar o disparo do template via `whatsappProvider` e persistir a mensagem em `private_messages`.

---

## 2. Web App (`apps/web`)

### Atualização do Serviço e Componente UI:
- Atualizar [communication-service.ts](../../../../apps/web/src/rest/services/communication-service.ts) para enviar `type` e `templateName` quando fornecidos.
- No `ChatViewPanel` ([chat-view-panel.tsx](../../../../apps/web/src/ui/identity/widgets/pages/lawyer-page/chat-view-panel.tsx)):
  - Calcular:
    ```typescript
    const lastMsg = activeChat.messages[activeChat.messages.length - 1]
    const isWindowClosed = !lastMsg || (Date.now() - new Date(lastMsg.createdAt).getTime()) > 24 * 60 * 60 * 1000
    ```
  - Se `isWindowClosed === true`, renderizar o banner:
    ```tsx
    <div className='border-t border-border/60 pt-4 flex flex-col gap-3 shrink-0 bg-muted/20 p-4 rounded-xl border'>
      <div className='flex items-start gap-3'>
        <Icon name='info' className='size-5 text-amber-500 shrink-0 mt-0.5' />
        <div className='space-y-1 text-xs text-muted-foreground'>
          <p className='font-medium text-foreground'>Janela de conversa de 24h fechada (Política da Meta)</p>
          <p>
            Para proteger os usuários contra spam, a Meta exige que a primeira mensagem após 24h de inatividade seja um template padrão.
          </p>
        </div>
      </div>
      <Button
        onClick={handleStartWindowTemplate}
        disabled={isSendingTemplate}
        className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
      >
        {isSendingTemplate ? 'Enviando template...' : 'Iniciar janela de conversa'}
      </Button>
    </div>
    ```

---

# Plano de Validação

1. **Testes Unitários no Servidor**:
   - Testar `SendCommunicationController` enviando `type: 'template'` e validando a criação da mensagem e o disparo para o `WhatsappProvider`.
2. **Testes de Widget no Web App**:
   - Testar a renderização do `ChatViewPanel` com mensagem criada há mais de 24h, verificando a presença do banner e ausência da caixa de texto livre.
   - Testar o clique no botão "Iniciar janela de conversa" e a transição para a caixa de texto livre habilitada.
3. **Verificação nos Ambientes**:
   - Executar `pnpm check-types`, `pnpm lint` e os testes da aplicação.
