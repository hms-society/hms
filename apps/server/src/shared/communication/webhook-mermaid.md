# Fluxo Completo de Integração do WhatsApp (Inbound & Outbound)

Este documento descreve e ilustra a arquitetura completa de comunicação via WhatsApp no HMS, cobrindo o fluxo de entrada (**Inbound** via Webhook e Inngest) e o fluxo de saída (**Outbound** via API REST, Provedores e Jobs).

---

## 🎨 Diagrama Unificado da Arquitetura WhatsApp (Inbound & Outbound)

O diagrama a seguir unifica os caminhos de entrada (cliente ➔ sistema) e de saída (advogado/sistema ➔ cliente), demonstrando como as tabelas do banco de dados (`communications`), os jobs do Inngest e as APIs REST se integram:

```mermaid
graph TD
    %% Estilos de nós
    classDef client fill:#10b981,stroke:#047857,color:#ffffff,stroke-width:2px;
    classDef meta fill:#06b6d4,stroke:#0891b2,color:#ffffff,stroke-width:2px;
    classDef server fill:#2563eb,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef web fill:#8b5cf6,stroke:#6d28d9,color:#ffffff,stroke-width:2px;
    classDef db fill:#f59e0b,stroke:#d97706,color:#ffffff,stroke-width:2px;

    %% Atores e Plataformas Externas
    Cliente(["👤 Cliente no WhatsApp"]):::client
    MetaAPI["🌐 Meta (WhatsApp Cloud API)"]:::meta

    %% Frontend (Web App)
    subgraph Web_App ["Frontend (apps/web)"]
        ChatUI["💻 Central de Comunicação (React UI)"]:::web
        ReactQuery["🔄 useSendCommunicationMutation & Services"]:::web
    end

    %% Backend (Server App)
    subgraph HMS_Server ["Backend (apps/server)"]
        WebhookCtrl["🔌 WhatsappWebhookController<br/>(GET/POST /integrations/whatsapp/webhook)"]:::server
        SendCtrl["🔌 SendCommunicationController<br/>(POST /communications/send)"]:::server
        InngestJob["⚡ Inngest (whatsapp/event.received)"]:::server
        WhatsappProv["📤 WhatsappProvider<br/>(sendTextMessage & sendAutomaticMessage)"]:::server
    end

    %% Banco de Dados
    subgraph Database ["Persistência (Drizzle ORM)"]
        DBCommunications[("🗄️ Tabela communications<br/>(inbound & outbound)")]:::db
        DBClients[("🗄️ Tabela clients<br/>(busca por telefone)")]:::db
    end

    %% FLUXO INBOUND (Entrada)
    Cliente -->|"1. Envia mensagem ou mídia"| MetaAPI
    MetaAPI -->|"2. Dispara Webhook HTTP POST"| WebhookCtrl
    WebhookCtrl -->|"3. Valida HMAC-SHA256 & despacha"| InngestJob
    WebhookCtrl -.->|"4. Responde 200 OK (< 3s)"| MetaAPI
    InngestJob -->|"5. Busca cliente pelo telefone"| DBClients
    InngestJob -->|"6. Salva registro (direction: inbound)"| DBCommunications

    %% FLUXO OUTBOUND (Saída Manual via UI)
    ChatUI -->|"7. Advogado digita e envia resposta"| ReactQuery
    ReactQuery -->|"8. Requisição HTTP POST"| SendCtrl
    SendCtrl -->|"9. Valida cliente & autorização"| DBClients
    SendCtrl -->|"10. Dispara envio de mensagem de texto"| WhatsappProv
    SendCtrl -->|"11. Grava registro (direction: outbound)"| DBCommunications
    WhatsappProv -->|"12. POST /v25.0/{phone_number_id}/messages"| MetaAPI
    MetaAPI -->|"13. Entrega mensagem no celular do cliente"| Cliente

    %% ATUALIZAÇÃO REATIVA DA UI
    DBCommunications -.->|"14. Re-fetch / React Query Invalidation"| ChatUI
```

---

## ⏱️ Diagrama de Sequência Cronológico (End-to-End)

Este diagrama de sequência detalha a ordem exata de execução das chamadas nos fluxos de entrada (webhook/Inngest) e saída (API/Provedor/Meta API):

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente (WhatsApp)
    actor Advogado as ⚖️ Advogado (HMS Web)
    participant Meta as 🌐 Meta Cloud API
    participant WebhookCtrl as 🔌 WhatsappWebhookController
    participant Inngest as ⚡ Inngest (whatsapp/event.received)
    participant SendCtrl as 🔌 SendCommunicationController
    participant Provider as 📤 WhatsappProvider
    participant DB as 🗄️ Banco de Dados (Drizzle)

    Note over Cliente, Inngest: 📥 FLUXO INBOUND (Recebimento de Mensagem)
    Cliente->>Meta: Envia mensagem de texto no WhatsApp
    Meta->>WebhookCtrl: POST /integrations/whatsapp/webhook (x-hub-signature-256)
    activate WebhookCtrl
    Note over WebhookCtrl: Valida HMAC-SHA256 com WHATSAPP_APP_SECRET
    WebhookCtrl->>Inngest: despacha evento 'whatsapp/event.received'
    WebhookCtrl-->>Meta: 200 OK (resposta imediata)
    deactivate WebhookCtrl

    activate Inngest
    Inngest->>DB: Busca clientModel onde client.phone == msg.from
    alt Cliente Encontrado
        Inngest->>DB: Insere em communications (direction: 'inbound', channel: 'whatsapp')
    else Cliente Não Cadastrado
        Note over Inngest: Emite alerta log (Warning)
    end
    deactivate Inngest

    Note over Advogado, Cliente: 📤 FLUXO OUTBOUND (Envio de Mensagem pela Central)
    Advogado->>SendCtrl: POST /communications/send { clientId, content, channel: 'whatsapp' }
    activate SendCtrl
    SendCtrl->>DB: Busca cliente e valida telefone
    SendCtrl->>Provider: sendTextMessage(phone, content)
    activate Provider
    Provider->>Meta: POST /v25.0/{phone_number_id}/messages (Bearer Token)
    Meta-->>Provider: 200 OK { messages: [{ id: externalId }] }
    deactivate Provider
    SendCtrl->>DB: Insere em communications (direction: 'outbound', authorId: req.user.id)
    SendCtrl-->>Advogado: 201 Created { id, content, channel, direction, externalId }
    deactivate SendCtrl
    Meta->>Cliente: Entrega mensagem no aplicativo WhatsApp
```

---

## 🔍 Resumo dos Componentes

| Componente | Responsabilidade | Tipo de Comunicação |
| :--- | :--- | :--- |
| **`WhatsappWebhookController`** | Recebe e valida assinaturas HMAC dos webhooks da Meta, encaminhando eventos ao Inngest. | Inbound (Entrada) |
| **`InngestService`** | Roteia e processa mensagens assíncronas do evento `whatsapp/event.received`, gravando como `inbound` no banco. | Inbound (Entrada) |
| **`SendCommunicationController`** | Endpoint REST `POST /communications/send` acionado pela UI para envio de mensagens pelos advogados. | Outbound (Saída) |
| **`WhatsappProvider`** | Envia mensagens de texto livre (`sendTextMessage`) e de modelo/template (`sendAutomaticMessage`) chamando a API da Meta. | Outbound (Saída) |
| **`communications` (DB)** | Tabela centralizada contendo os logs unificados de mensagens (`inbound` e `outbound`) em todos os canais. | Persistência |