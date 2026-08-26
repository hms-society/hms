# Fluxo de Lotes Documentais (Motor Documental & WhatsApp)

Este documento detalha o fluxo arquitetural e cronológico da recepção de documentos e mídias via WhatsApp, do bloqueio na borda (gatekeeping) até a criação do Lote Documental para a Caixa de Triagem.

---

## 1. Fluxograma de Decisão e Processamento (Gatekeeping & Lote)

```mermaid
graph TD
    %% Estilos
    classDef meta fill:#06b6d4,stroke:#0891b2,color:#ffffff,stroke-width:2px;
    classDef comm fill:#2563eb,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef doc fill:#7c3aed,stroke:#6d28d9,color:#ffffff,stroke-width:2px;
    classDef db fill:#f59e0b,stroke:#d97706,color:#ffffff,stroke-width:2px;
    classDef rejected fill:#ef4444,stroke:#dc2626,color:#ffffff,stroke-width:2px;
    classDef triage fill:#10b981,stroke:#047857,color:#ffffff,stroke-width:2px;

    %% Elementos
    Meta["🌐 Meta WhatsApp API"]:::meta
    Webhook["🔌 WhatsappWebhookController"]:::comm
    EventJob["⚡ ProcessWhatsappEventJob<br/>(Comunicação)"]:::comm
    DB_Client[("🗄️ Tabela clientes<br/>(Verificação por telefone)")]:::db
    DB_Evento[("🗄️ Tabela integracao_evento")]:::db
    
    Gatekeeping{"🔍 Remetente está<br/>cadastrado na HMS?"}
    Rejeitado["❌ Recusa na Borda (Gatekeeping)<br/>status: falha_definitiva<br/>(NENHUM lote criado)"]:::rejected
    
    InngestBatch["⚡ Evento: documents/whatsapp.batch.received"]:::comm
    BatchJob["⚡ ProcessWhatsappBatchJob<br/>(Motor Documental)"]:::doc
    UseCase["🧠 CreateDocumentBatchUseCase"]:::doc
    DB_Batch[("🗄️ PostgreSQL (Drizzle ORM)<br/>Tabela: document_batches<br/>Tabela: document_batch_files")]:::db
    TriageUI["📥 Caixa de Triagem de Lotes<br/>(Confirmação de titularidade por colaborador autorizado)"]:::triage

    %% Fluxo
    Meta -->|"POST Webhook (documento/imagem)"| Webhook
    Webhook -->|"whatsapp/event.received"| EventJob
    EventJob -->|"Consulta telefone"| DB_Client
    DB_Client --> Gatekeeping
    
    Gatekeeping -->|"NÃO (Desconhecido)"| Rejeitado
    Rejeitado --> DB_Evento
    
    Gatekeeping -->|"SIM (Cadastrado)"| DB_Evento
    DB_Evento -->|"Insere status: recebido"| InngestBatch
    InngestBatch --> BatchJob
    BatchJob --> UseCase
    UseCase -->|"Persiste lote"| DB_Batch
    DB_Batch --> TriageUI
```

---

## 2. Diagrama de Sequência Cronológico

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as 👤 Cliente / Remetente
    participant Meta as 🌐 Meta Cloud API
    participant Controller as 🔌 WhatsappWebhookController
    participant EventJob as ⚡ ProcessWhatsappEventJob
    participant DB as 🗄️ Banco de Dados (Drizzle)
    participant BatchJob as ⚡ ProcessWhatsappBatchJob
    participant UseCase as 🧠 CreateDocumentBatchUseCase
    participant Triage as 📥 Caixa de Triagem (Frontend)

    Note over Usuario, Controller: 1. Recepção Inbound & Validação de Webhook
    Usuario->>Meta: Envia documento/imagem pelo WhatsApp
    Meta->>Controller: POST /integrations/whatsapp/webhook
    activate Controller
    Note over Controller: Valida assinatura SHA256 (x-hub-signature-256)
    Controller->>EventJob: dispatch('whatsapp/event.received', payload)
    Controller-->>Meta: Retorna 200 OK (< 3s)
    deactivate Controller

    Note over EventJob, DB: 2. Processamento de Evento & Gatekeeping na Borda
    activate EventJob
    EventJob->>DB: SELECT * FROM clientModel WHERE phone LIKE sender
    alt Remetente NÃO Cadastrado (Gatekeeping)
        EventJob->>DB: INSERT integracao_evento (status: falha_definitiva, erro: 'Rejeitado...')
        Note over EventJob: Interrompe fluxo. NENHUM lote é criado.
    else Remetente Cadastrado
        EventJob->>DB: INSERT integracao_evento (status: recebido)
        EventJob->>BatchJob: dispatch('documents/whatsapp.batch.received', { eventoId, sender, clientId, mimeType, originalName })
    end
    deactivate EventJob

    Note over BatchJob, Triage: 3. Criação de Lote Documental & Triagem Operacional
    activate BatchJob
    BatchJob->>UseCase: execute({ channel: WhatsApp, sender, clientId, files: [...] })
    activate UseCase
    Note over UseCase: Gera readableId (LOTE-YYYYMMDD-XXXX) & define status PendingIdentification
    UseCase->>DB: INSERT INTO document_batches (inTriageBox: true)
    UseCase-->>BatchJob: Retorna DocumentBatch criado
    deactivate UseCase
    deactivate BatchJob

    Note over DB, Triage: 4. Exibição na Esteira de Triagem
    Triage->>DB: GET /caixa-de-documentos (Lista Lotes Pendentes)
    DB-->>Triage: Exibe Lote do Cliente para confirmação de titularidade humana
```
