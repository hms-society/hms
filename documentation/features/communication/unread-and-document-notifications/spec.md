---
title: Balão de Notificação de Documento no Chat e Sinalizador Global com Beep Sonoro
status: open
revision: 1
source:
  type: user_request
scope:
  - apps/server/src/communication/messaging/inngest/jobs
  - apps/web/src/ui/shared/contexts
  - apps/web/src/ui/shared/utils
  - apps/web/src/ui/shared/widgets/layouts/app-layout/sidebar
  - apps/web/src/ui/identity/widgets/pages/lawyer-page
last_updated_at: 2026-09-14
---

# Contexto e Objetivo

## Contexto

Quando um cliente envia um documento ou imagem pelo WhatsApp (ex: `comprovante.pdf`), o sistemaHMS encaminha o arquivo para o Motor Documental (Caixa de Docs), porém anteriormente o advogado não visualizava nenhum aviso ou balão dentro do chat do cliente informando que o documento fora recebido.

Além disso, para acompanhar atendimentos em tempo real, a plataforma precisa sinalizar globalmente no menu lateral (Sidebar) quando houver mensagens pendentes de visualização de qualquer cliente, emitindo um sinal sonoro (*beep*) ao receber novas mensagens e removendo a notificação assim que o advogado abrir o chat correspondente.

## Objetivo

1. **Balão de Notificação de Documento no Chat**:
   - Quando um documento ou imagem for recebido do cliente via WhatsApp, registrar a ocorrência e exibir no chat um balão visualmente destacado com o nome do arquivo (ex: `comprovante.pdf`) e a mensagem informativa "Documento atribuído ao cliente na Caixa de Docs" (sem opção de download).
2. **Sinalizador Global no Sidebar & Beep Sonoro**:
   - Encapsular a aplicação com o `CommunicationProvider` mantendo o estado global de chats com mensagens não lidas (`unreadChatIds`).
   - Emitir um *beep* de notificação suave via Web Audio API sempre que uma nova mensagem não lida for recebida.
   - Exibir um indicador vermelho pulsante na Sidebar no item de Comunicação enquanto houver conversas não lidas.
   - Remover o cliente de `unreadChatIds` assim que o advogado visualizar a conversa daquele cliente, apagando a notificação da Sidebar quando todas as mensagens forem lidas.

---

# Escopo

## Incluído

- **Servidor (`apps/server`)**:
  - Atualizar o job [process-whatsapp-event-job.ts](../../../../apps/server/src/communication/messaging/inngest/jobs/process-whatsapp-event-job.ts) para que, ao receber um arquivo (`message.type === 'document' || 'image'`), registre uma entrada em `private_messages` formatada como `"[Documento Recebido] <nome_do_arquivo>"`.
- **Web App (`apps/web`)**:
  - **Utilitário Sonoro**: Criar `playNotificationBeep()` em `audio-notifier.ts` utilizando Web Audio API (onda senoidal em 800Hz / 150ms).
  - **Contexto de Comunicação**: Evoluir o [communication-context.tsx](../../../../apps/web/src/ui/shared/contexts/communication-context.tsx) com polling leve (10s) para detectar mensagens não lidas por cliente, gerenciar `unreadChatIds`, acionar o beep sonoro quando novas mensagens chegarem e permitir a limpeza via `markAsRead(clientId)`.
  - **Sidebar**: Garantir a exibição da notificação vermelha no item de menu de Comunicação em [sidebar/index.tsx](../../../../apps/web/src/ui/shared/widgets/layouts/app-layout/sidebar/index.tsx).
  - **Chat do Advogado**: No [chat-view-panel.tsx](../../../../apps/web/src/ui/identity/widgets/pages/lawyer-page/chat-view-panel.tsx), identificar mensagens iniciadas com `[Documento Recebido]` e renderizar um Card especial com ícone de documento, o nome do arquivo e o informativo "Documento atribuído ao cliente na Caixa de Docs".
- **Validação e Testes**:
  - Testes unitários para o utilitário de áudio e atualizações de contexto.
  - Teste de widget cobrindo a renderização do balão especial de documento no `ChatViewPanel`.

## Fora de Escopo

- Download de arquivos diretamente do balão do chat (o arquivo vive governado na Caixa de Docs / Motor Documental).
- Instalação de bibliotecas pesadas de áudio externa (usaremos Web Audio API nativa).

---

# Contract

## Requisitos Funcionais

### RF-01 — Registro do Balão de Documento no Inbound WhatsApp
Quando o webhook do WhatsApp receber uma mensagem do tipo `document` ou `image`, o servidor deve registrar uma mensagem `inbound` na tabela `private_messages` com a estrutura `"[Documento Recebido] " + originalName`.

### RF-02 — Renderização do Balão de Documento no Chat
No `ChatViewPanel`, mensagens que iniciem por `[Documento Recebido]` devem ser estilizadas como um card de documento:
- Ícone de arquivo (`file-text` ou `clip`).
- O nome extraído do arquivo (ex: `comprovante.pdf`).
- Texto explicativo: "Documento recebido e atribuído ao cliente na Caixa de Docs".
- Sem link ou botão de download no chat.

### RF-03 — Gerenciamento do Estado Global de Mensagens Não Lidas
O `CommunicationProvider` deve manter uma lista de `unreadChatIds`. Ao realizar a verificação periódica de mensagens:
- Se houver clientes com mensagens não lidas que não estavam na lista anterior, adiciona o cliente a `unreadChatIds` e toca o beep sonoro (`playNotificationBeep()`).
- O estado `hasUnread` é `true` enquanto `unreadChatIds.length > 0`.

### RF-04 — Sinalizador Visual no Sidebar
A `Sidebar` deve exibir uma notificação visual vermelha pulsante no item do menu Comunicação sempre que `hasUnread` for `true` (em estado expandido e colapsado).

### RF-05 — Leitura e Limpeza de Notificação por Cliente
Quando o advogado clicar e visualizar o chat de um determinado cliente, a aplicação deve chamar `markAsRead(clientId)`. O `clientId` é removido de `unreadChatIds`. Se não houver outros clientes pendentes, `hasUnread` torna-se `false` e o sinalizador no Sidebar apaga.

---

## Critérios de Aceitação

| CA | RF | Dado | Quando | Então |
|---|---|---|---|---|
| CA-01 | RF-01 | Um cliente envia um arquivo `comprovante.pdf` via WhatsApp | O job `ProcessWhatsappEventJob` executa | Uma mensagem `inbound` com `[Documento Recebido] comprovante.pdf` é gravada em `private_messages` |
| CA-02 | RF-02 | O advogado visualiza o chat com a mensagem de documento | O `ChatViewPanel` renderiza a mensagem | Exibe o card com ícone, o texto `comprovante.pdf` e o aviso "Documento atribuído ao cliente na Caixa de Docs", sem botão de download |
| CA-03 | RF-03 | Chega uma nova mensagem de um cliente que não estava lido | O `CommunicationProvider` atualiza os dados | O `clientId` entra em `unreadChatIds`, `playNotificationBeep()` executa e emite um som suave |
| CA-04 | RF-04 | `hasUnread === true` no contexto | A `Sidebar` é renderizada | Um indicador vermelho pulsante é exibido no ícone de Comunicação |
| CA-05 | RF-05 | `unreadChatIds` contém `client-1` | O advogado seleciona e visualiza o chat de `client-1` | `markAsRead('client-1')` é chamado, `client-1` sai da lista e a notificação apaga assim que a lista ficar vazia |

---

# Solução Técnica

## 1. Utilitário Sonoro (`audio-notifier.ts`)

Criar em `apps/web/src/ui/shared/utils/audio-notifier.ts`:
```typescript
export function playNotificationBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime) // 800Hz tone

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15) // 150ms decay

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch (_e) {
    // Ignore audio context autoplay restrictions gracefully
  }
}
```

## 2. Servidor (`process-whatsapp-event-job.ts`)

No job [process-whatsapp-event-job.ts](../../../../apps/server/src/communication/messaging/inngest/jobs/process-whatsapp-event-job.ts), para mensagens de tipo `document` ou `image`:
```typescript
if (clientId && activeIntake?.responsibleId) {
  const fileName = typeof media.filename === 'string' ? media.filename : 'documento'
  await database.insert(privateMessageModel).values({
    clientId,
    collaboratorId: activeIntake.responsibleId,
    intakeId: activeIntake.id,
    clientPhone: sender,
    direction: 'inbound',
    content: encrypt(`[Documento Recebido] ${fileName}`),
    fileIds: [],
  })
}
```

## 3. Renderização de Balão no Chat (`chat-view-panel.tsx`)

No [chat-view-panel.tsx](../../../../apps/web/src/ui/identity/widgets/pages/lawyer-page/chat-view-panel.tsx), testar se `msg.content.startsWith('[Documento Recebido]')`:
```tsx
{msg.content.startsWith('[Documento Recebido]') ? (
  <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
    <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon name="file-text" className="size-5" />
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-sm text-foreground">
        {msg.content.replace('[Documento Recebido]', '').trim()}
      </span>
      <span className="text-xs text-muted-foreground">
        Documento enviado pelo cliente e atribuído na Caixa de Docs
      </span>
    </div>
  </div>
) : (
  <BubbleContent>{msg.content}</BubbleContent>
)}
```

---

# Plano de Validação

1. **Testes Automatizados**:
   - Testes de widget para `ChatViewPanel` cobrindo o balão especial de documento.
   - Teste unitário do utilitário `audio-notifier.ts`.
   - Executar `pnpm check-types`, `pnpm lint`, `pnpm test`.
