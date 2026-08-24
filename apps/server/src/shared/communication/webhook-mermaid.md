# Fluxo de Integração do WhatsApp e Comunicações

Este documento descreve a arquitetura e os fluxos reais de comunicação WhatsApp (Entrada / Inbound, Envio Direto via Painel / Outbound Chat e Mensagens Automáticas de Sistema).

```mermaid
graph TD
    classDef hms fill:#2563eb,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef meta fill:#06b6d4,stroke:#0891b2,color:#ffffff,stroke-width:2px;
    classDef user fill:#10b981,stroke:#047857,color:#ffffff,stroke-width:2px;
    classDef database fill:#f59e0b,stroke:#d97706,color:#ffffff,stroke-width:2px;
    classDef frontend fill:#8b5cf6,stroke:#6d28d9,color:#ffffff,stroke-width:2px;

    User["👤 Cliente (WhatsApp)"]:::user
    Meta["🌐 Meta (WhatsApp Cloud API)"]:::meta
    WebUI["💻 Frontend Web (Painel de Comunicação)"]:::frontend

    subgraph HMS_App ["HMS Server (apps/server)"]
        WebhookController["🔌 WhatsappWebhookController (GET/POST /integrations/whatsapp/webhook)"]:::hms
        InngestJob["⚡ ProcessWhatsappEventJob (Inngest Job)"]:::hms
        SendController["💬 SendCommunicationController (POST /communications/send)"]:::hms
        ListController["📋 ListClientCommunicationsController (GET /communications/clients/:clientId)"]:::hms
        Provider["📤 WhatsappProvider (sendTextMessage / sendAutomaticMessage)"]:::hms
    end

    DB_Events[("🗄️ Tabela integracao_evento")]:::database
    DB_Private[("🗄️ Tabela private_messages (Criptografada)")]:::database

    %% Fluxo Inbound (Webhook)
    User -->|"1. Envia Mensagem/Documento"| Meta
    Meta -->|"2. Dispara Webhook (POST x-hub-signature-256)"| WebhookController
    WebhookController -->|"3. Valida SHA256 & Despacha Evento"| InngestJob
    WebhookController -.->|"4. Responde 200 OK (status success)"| Meta
    InngestJob -->|"5. Grava Evento / Lote de Documentos"| DB_Events

    %% Fluxo Outbound Chat (Painel de Comunicação)
    WebUI -->|"6. Envia Mensagem (POST /communications/send)"| SendController
    SendController -->|"7. Dispara Texto Direto (sendTextMessage)"| Provider
    Provider -->|"8. POST /messages (type text)"| Meta
    Meta -->|"9. Entrega no Celular"| User
    SendController -->|"10. Criptografa & Persiste"| DB_Private

    %% Fluxo de Leitura (Histórico Chat)
    WebUI -->|"11. Busca Histórico (GET /communications/clients/:clientId)"| ListController
    ListController -->|"12. Lê e Descriptografa"| DB_Private
    ListController -.->|"13. Retorna Histórico de Conversa"| WebUI
```

---

## Diagrama de Sequência Detalhado

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente (WhatsApp)
    actor Advogado as ⚖️ Advogado (Web UI)
    participant WebUI as 💻 Apps Web (React/TanStack)
    participant Meta as 🌐 Meta Cloud API
    participant WebhookCtrl as 🔌 WhatsappWebhookController
    participant Inngest as ⚡ Inngest (ProcessWhatsappEventJob)
    participant SendCtrl as 💬 SendCommunicationController
    participant ListCtrl as 📋 ListClientCommunicationsController
    participant Provider as 📤 WhatsappProvider
    participant DB as 🗄️ Banco de Dados (Drizzle/Postgres)

    Note over Cliente, Inngest: 1. RECEBIMENTO DE MENSAGENS E DOCUMENTOS (INBOUND WEBHOOK)
    Cliente->>Meta: Envia mensagem ou documento
    Meta->>WebhookCtrl: POST /integrations/whatsapp/webhook (x-hub-signature-256)
    activate WebhookCtrl
    Note over WebhookCtrl: Valida assinatura SHA256 com WHATSAPP_APP_SECRET
    alt Assinatura Inválida
        WebhookCtrl-->>Meta: 403 Forbidden
    else Assinatura Válida
        WebhookCtrl->>Inngest: send("whatsapp/event.received", payload)
        WebhookCtrl-->>Meta: 200 OK { status: "success" }
    end
    deactivate WebhookCtrl

    activate Inngest
    Inngest->>DB: Busca cliente por telefone (like %phone)
    alt Cliente não encontrado
        Inngest->>DB: Insere em integracao_evento (status: falha_definitiva)
    else Cliente encontrado
        Inngest->>DB: Insere em integracao_evento (status: recebido)
        opt Mensagem contém Imagem / Documento
            Inngest->>Inngest: Dispara "documents/whatsapp.batch.received"
        end
    end
    deactivate Inngest

    Note over Advogado, Cliente: 2. ENVIO DIRETO DE MENSAGEM DO ADVOGADO (OUTBOUND CHAT)
    Advogado->>WebUI: Digita e envia mensagem
    WebUI->>SendCtrl: POST /communications/send { clientId, content, channel: "whatsapp" }
    activate SendCtrl
    SendCtrl->>DB: Valida cliente e obtém telefone
    SendCtrl->>Provider: sendTextMessage(phone, content)
    activate Provider
    Provider->>Meta: POST /v25.0/{phoneNumberId}/messages { type: "text", text: { body } }
    Meta-->>Provider: 200 OK { messages: [{ id: "wamid..." }] }
    Provider-->>SendCtrl: { externalMessageId }
    deactivate Provider

    Note over SendCtrl: Criptografa conteúdo com encrypt(content)
    SendCtrl->>DB: Insere registro em private_messages (direction: outbound)
    SendCtrl-->>WebUI: 201 Created { id, content, direction, externalId }
    deactivate SendCtrl
    Meta->>Cliente: Entrega mensagem no celular

    Note over Advogado, DB: 3. LEITURA DE HISTÓRICO E ATUALIZAÇÃO DO CHAT
    loop A cada 3 segundos ou no Envio
        WebUI->>ListCtrl: GET /communications/clients/:clientId
        activate ListCtrl
        ListCtrl->>DB: Query private_messages por clientId (order por createdAt desc)
        DB-->>ListCtrl: Retorna registros criptografados
        Note over ListCtrl: Descriptografa mensagens com decrypt(content)
        ListCtrl-->>WebUI: 200 OK [{ id, content, direction, author }]
        deactivate ListCtrl
    end
```