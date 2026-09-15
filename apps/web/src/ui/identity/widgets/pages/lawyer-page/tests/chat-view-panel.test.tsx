import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatViewPanel } from '../chat-view-panel'
import type { ClientConversation } from '../chat-list-panel'

describe('ChatViewPanel', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)
  const defaultChat: ClientConversation = {
    id: 'client-1',
    name: 'João Silva',
    caseNumber: 'Intakes: 1',
    channel: 'whatsapp',
    updatedAt: '10:00',
    unread: false,
    lastMessage: 'Olá',
    avatar: {
      name: 'João Silva',
      colorSeed: 'client-1',
    },
    messages: [],
  }

  it('renders closed window banner when there are no messages in whatsapp chat', () => {
    render(
      <ChatViewPanel
        activeChat={{ ...defaultChat, messages: [] }}
        messageText=''
        onMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        onSendStartWindowTemplate={vi.fn()}
      />,
    )

    expect(screen.getByText('Janela de conversa de 24h fechada')).toBeTruthy()
    expect(screen.getAllByText(/Iniciar janela de conversa/i)[0]).toBeTruthy()
    expect(screen.queryByPlaceholderText('Escreva sua resposta...')).toBeNull()
  })

  it('renders closed window banner when last message is older than 24h', () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const oldMessages = [
      {
        id: 'msg-1',
        content: 'Mensagem antiga',
        direction: 'inbound' as const,
        channel: 'whatsapp' as const,
        createdAt: oldDate,
        rawCreatedAt: oldDate,
        sender: 'João Silva',
      },
    ]

    render(
      <ChatViewPanel
        activeChat={{ ...defaultChat, messages: oldMessages }}
        messageText=''
        onMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        onSendStartWindowTemplate={vi.fn()}
      />,
    )

    expect(screen.getByText('Janela de conversa de 24h fechada')).toBeTruthy()
    expect(screen.getAllByText(/Iniciar janela de conversa/i)[0]).toBeTruthy()
  })

  it('renders text input area when last message is within 24h', () => {
    const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const recentMessages = [
      {
        id: 'msg-2',
        content: 'Mensagem recente',
        direction: 'inbound' as const,
        channel: 'whatsapp' as const,
        createdAt: recentDate,
        rawCreatedAt: recentDate,
        sender: 'João Silva',
      },
    ]

    render(
      <ChatViewPanel
        activeChat={{ ...defaultChat, messages: recentMessages }}
        messageText=''
        onMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        onSendStartWindowTemplate={vi.fn()}
      />,
    )

    expect(screen.queryByText('Janela de conversa de 24h fechada')).toBeNull()
    expect(screen.getByPlaceholderText('Escreva sua resposta...')).toBeTruthy()
  })

  it('calls onSendStartWindowTemplate when clicking start conversation window button', () => {
    const onStartTemplate = vi.fn()
    render(
      <ChatViewPanel
        activeChat={{ ...defaultChat, messages: [] }}
        messageText=''
        onMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        onSendStartWindowTemplate={onStartTemplate}
      />,
    )

    const btn = document.getElementById('start-conversation-window-button')
    expect(btn).not.toBeNull()
    if (btn) {
      fireEvent.click(btn)
    }

    expect(onStartTemplate).toHaveBeenCalledTimes(1)
  })

  it('renders document notification balloon card when message contains [Documento Recebido]', () => {
    const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const docMessages = [
      {
        id: 'msg-doc-1',
        content: '[Documento Recebido] comprovante.pdf',
        direction: 'inbound' as const,
        channel: 'whatsapp' as const,
        createdAt: recentDate,
        rawCreatedAt: recentDate,
        sender: 'João Silva',
      },
    ]

    render(
      <ChatViewPanel
        activeChat={{ ...defaultChat, messages: docMessages }}
        messageText=''
        onMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        onSendStartWindowTemplate={vi.fn()}
      />,
    )

    expect(screen.getByText('comprovante.pdf')).toBeTruthy()
    expect(
      screen.getByText('Documento recebido e atribuído ao cliente na Caixa de Docs'),
    ).toBeTruthy()
  })
})
