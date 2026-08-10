# Fluxo Completo de Integração do WhatsApp (Inbound & Outbound)

Este documento descreve a arquitetura de integração do WhatsApp no HMS, detalhando os papéis da tabela `private_messages` (mensagens diretas entre Advogado/Colaborador e Cliente) e da tabela `communications` (notificações oficiais do sistema/e-mail).

---

## 🎨 Diagrama Unificado da Arquitetura WhatsApp (Inbound & Outbound)

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
        DBPrivateMsgs[("🗄️ Tabela private_messages<br/>(Advogado ↔ Cliente / WhatsApp)")]:::db
        DBClients[("🗄️ Tabela clients<br/>(busca por telefone)")]:::db
    end

    %% FLUXO INBOUND (Entrada no Chat WhatsApp)
    Cliente -->|"1. Envia mensagem via WhatsApp"| MetaAPI
    MetaAPI -->|"2. Dispara Webhook HTTP POST"| WebhookCtrl
    WebhookCtrl -->|"3. Valida HMAC-SHA256 & despacha"| InngestJob
    WebhookCtrl -.->|"4. Responde 200 OK (< 3s)"| MetaAPI
    InngestJob -->|"5. Busca cliente por telefone"| DBClients
    InngestJob -->|"6. Registra em private_messages (direction: inbound)"| DBPrivateMsgs

    %% FLUXO OUTBOUND (Saída pelo Advogado na UI)
    ChatUI -->|"7. Advogado digita e envia mensagem"| ReactQuery
    ReactQuery -->|"8. Requisição HTTP POST /communications/send"| SendCtrl
    SendCtrl -->|"9. Valida cliente & autorização do advogado"| DBClients
    SendCtrl -->|"10. Dispara envio de mensagem de texto"| WhatsappProv
    SendCtrl -->|"11. Registra mensagem criptografada em private_messages"| DBPrivateMsgs
    WhatsappProv -->|"12. POST /v25.0/{phone_number_id}/messages"| MetaAPI
    MetaAPI -->|"13. Entrega no celular do cliente"| Cliente

    %% ATUALIZAÇÃO REATIVA DA UI
    DBPrivateMsgs -.->|"14. Invalidação de Cache & Atualização da UI"| ChatUI
```

---

## ⏱️ Diagrama de Sequência Cronológico (End-to-End)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👤 Cliente (WhatsApp)
    actor Advogado as ⚖️ Advogado (Colaborador HMS)
    participant Meta as 🌐 Meta Cloud API
    participant WebhookCtrl as 🔌 WhatsappWebhookController
    participant Inngest as ⚡ Inngest (whatsapp/event.received)
    participant SendCtrl as 🔌 SendCommunicationController
    participant Provider as 📤 WhatsappProvider
    participant DB as 🗄️ Banco de Dados (Drizzle)

    Note over Cliente, Inngest: 📥 FLUXO INBOUND (Mensagem Recebida do Cliente)
    Cliente->>Meta: Envia mensagem de texto no WhatsApp
    Meta->>WebhookCtrl: POST /integrations/whatsapp/webhook (x-hub-signature-256)
    activate WebhookCtrl
    WebhookCtrl->>Inngest: despacha evento 'whatsapp/event.received'
    WebhookCtrl-->>Meta: 200 OK (resposta em < 3s)
    deactivate WebhookCtrl

    activate Inngest
    Inngest->>DB: Busca clientModel onde client.phone == msg.from
    alt Cliente Encontrado
        Inngest->>DB: Insere em private_messages (direction: 'inbound', client_id, content)
    else Cliente Não Encontrado
        Note over Inngest: Emite aviso log (Warning)
    end
    deactivate Inngest

    Note over Advogado, Cliente: 📤 FLUXO OUTBOUND (Advogado responde na Central)
    Advogado->>SendCtrl: POST /communications/send { clientId, content, channel: 'whatsapp' }
    activate SendCtrl
    SendCtrl->>DB: Busca cliente e valida telefone
    SendCtrl->>Provider: sendTextMessage(phone, content)
    activate Provider
    Provider->>Meta: POST /v25.0/{phone_number_id}/messages
    Meta-->>Provider: 200 OK { messages: [{ id: externalId }] }
    deactivate Provider
    SendCtrl->>DB: Insere em private_messages (collaborator_id, client_id, direction: 'outbound')
    SendCtrl-->>Advogado: 201 Created { id, content, createdAt, externalId }
    deactivate SendCtrl
    Meta->>Cliente: Entrega mensagem no celular do cliente
```

---

## 🔍 Separação de Responsabilidades entre Tabelas

| Tabela | Finalidade | Principais Atributos | Atores Envolvidos |
| :--- | :--- | :--- | :--- |
| **`private_messages`** | **Chat e Operações CRUD da Central de Comunicação**. Mensagens diretas de conversa entre o advogado e o cliente (WhatsApp / demandas de atendimento). | `client_id`, `collaborator_id`, `intake_id`, `content` (criptografado), `file_ids`, `direction` | Advogado (Colaborador) ↔ Cliente |