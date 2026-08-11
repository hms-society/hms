# Fluxo de Integração do WhatsApp

Este diagrama ilustra a interação entre o `WhatsappWebhookController` (fluxo de entrada / inbound) e o `WhatsappProvider` (fluxo de saída / outbound).

```mermaid
graph TD
    %% Estilos Gerais
    classDef hms fill:#2563eb,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef meta fill:#06b6d4,stroke:#0891b2,color:#ffffff,stroke-width:2px;
    classDef user fill:#10b981,stroke:#047857,color:#ffffff,stroke-width:2px;
    classDef database fill:#f59e0b,stroke:#d97706,color:#ffffff,stroke-width:2px;

    %% Elementos
    User(["👤 Usuário no WhatsApp"]):::user
    Meta["🌐 Meta (WhatsApp Cloud API)"]:::meta
    
    subgraph HMS_App ["HMS (apps/server)"]
        Controller["🔌 WhatsappWebhookController<br/>(GET/POST /integrations/whatsapp/webhook)"]:::hms
        Provider["📤 WhatsappProvider<br/>(sendAutomaticMessage)"]:::hms
        Inngest["⚡ Inngest (Background Jobs)"]:::hms
    end

    DB[("🗄️ Tabela IntegracaoEvento<br/>(Supabase/Drizzle)")]:::database

    %% Fluxo de Entrada (Inbound)
    User -->|"1. Envia Mensagem"| Meta
    Meta -->|"2. Dispara Webhook (POST)"| Controller
    Controller -->|"3. Valida Assinatura & Salva"| DB
    Controller -->|"4. Dispara Evento Assíncrono"| Inngest
    Controller -.->|"5. Retorna 200 OK em < 3s"| Meta

    %% Fluxo de Saída (Outbound)
    Inngest -->|"Ex: Job de Agendamento"| Provider
    Provider -->|"6. POST /messages (Template)"| Meta
    Meta -->|"7. Entrega Mensagem"| User
```

## Diagrama de Sequência de Comunicação (WhatsApp)

O diagrama a seguir detalha o fluxo cronológico das interações para recepção (inbound) e envio (outbound) de mensagens:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as 👤 Usuário (WhatsApp)
    participant Meta as 🌐 Meta Cloud API
    participant Controller as 🔌 WhatsappWebhookController
    participant Env as ⚙️ EnvProvider
    participant Inngest as ⚡ Inngest (Background Jobs)
    participant Core as 🧠 Use Case / Service
    participant Provider as 📤 WhatsappProvider

    Note over Meta, Controller: Fluxo de Entrada (Inbound Webhook)
    Usuario->>Meta: Envia mensagem de texto
    Meta->>Controller: POST /integrations/whatsapp/webhook (x-hub-signature-256)
    activate Controller
    Controller->>Env: get('WHATSAPP_APP_SECRET')
    Env-->>Controller: Segredo da aplicação (App Secret)
    Note over Controller: Valida assinatura SHA256 com o payload bruto
    alt Assinatura Inválida
        Controller-->>Meta: Retorna 403 Forbidden
    else Assinatura Válida
        Controller->>Inngest: send('whatsapp/event.received', payload)
        activate Inngest
        Note over Inngest: Enfileira processamento assíncrono do evento
        Inngest-->>Controller: Evento despachado
        deactivate Inngest
        Controller-->>Meta: Retorna 200 OK (status: success)
    end
    deactivate Controller

    Note over Core, Meta: Fluxo de Saída (Outbound Messages)
    Core->>Provider: sendAutomaticMessage(params: { phone, kind, ... })
    activate Provider
    Provider->>Env: get('WHATSAPP_API_TOKEN' & 'WHATSAPP_PHONE_NUMBER_ID')
    Env-->>Provider: Credenciais da API
    Note over Provider: Constrói template com base em params.kind & HMS_SERVER_APP_MODE
    Provider->>Meta: POST /v25.0/{phone_number_id}/messages (Bearer Token & Body JSON)
    activate Meta
    Meta-->>Provider: Retorna 200 OK (com message_id gerado)
    deactivate Meta
    Note over Provider: Valida e extrai externalMessageId
    Provider-->>Core: Retorna { externalMessageId }
    deactivate Provider
    Meta->>Usuario: Entrega mensagem estruturada no dispositivo do usuário
```