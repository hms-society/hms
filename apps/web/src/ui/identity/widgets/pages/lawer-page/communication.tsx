import { useState } from 'react'

import {
  ChatListPanel,
  type ChatMessage,
  type ClientConversation,
} from './chat-list-panel'
import { ChatViewPanel } from './chat-view-panel'

const INITIAL_CONVERSATIONS: ClientConversation[] = [
  {
    id: '1',
    name: 'João Silva',
    lastMessage: 'Enviei os documentos da CNH e comprovante de residência.',
    channel: 'whatsapp',
    updatedAt: '14:32',
    unread: true,
    caseNumber: 'Caso #042',
    messages: [
      {
        id: 'm1',
        content: 'Olá! Sou o Dr. Advogado de desenvolvimento. Em que posso ajudar hoje?',
        direction: 'outbound',
        channel: 'whatsapp',
        createdAt: '14:15',
        sender: 'Advogado de desenvolvimento',
      },
      {
        id: 'm2',
        content:
          'Olá doutor! Estou com dúvidas sobre os documentos para a ação contratual.',
        direction: 'inbound',
        channel: 'whatsapp',
        createdAt: '14:20',
        sender: 'João Silva',
      },
      {
        id: 'm3',
        content:
          'Pode nos enviar por aqui o seu documento de identidade e o comprovante de residência atualizado para análise.',
        direction: 'outbound',
        channel: 'whatsapp',
        createdAt: '14:25',
        sender: 'Advogado de desenvolvimento',
      },
      {
        id: 'm4',
        content: 'Enviei os documentos da CNH e comprovante de residência.',
        direction: 'inbound',
        channel: 'whatsapp',
        createdAt: '14:32',
        sender: 'João Silva',
      },
    ],
  },
  {
    id: '2',
    name: 'Maria Santos',
    lastMessage: 'A consulta de amanhã está confirmada no mesmo horário?',
    channel: 'whatsapp',
    updatedAt: 'Ontem',
    unread: false,
    caseNumber: 'Caso #015',
    messages: [
      {
        id: 'm5',
        content: 'Olá Maria, a sua consulta de retorno foi pré-agendada.',
        direction: 'outbound',
        channel: 'whatsapp',
        createdAt: 'Ontem - 10:00',
        sender: 'Secretaria HMS',
      },
      {
        id: 'm6',
        content: 'A consulta de amanhã está confirmada no mesmo horário?',
        direction: 'inbound',
        channel: 'whatsapp',
        createdAt: 'Ontem - 10:15',
        sender: 'Maria Santos',
      },
    ],
  },
  {
    id: '3',
    name: 'Pedro Souza',
    lastMessage: 'Obrigado pelo retorno. Aguardo o andamento.',
    channel: 'email',
    updatedAt: '3 dias atrás',
    unread: false,
    caseNumber: 'Caso #029',
    messages: [
      {
        id: 'm7',
        content:
          'Prezado Pedro, informamos que o protocolo de sua petição inicial foi realizado com sucesso.',
        direction: 'outbound',
        channel: 'email',
        createdAt: '3 dias atrás',
        sender: 'Advogado de desenvolvimento',
      },
      {
        id: 'm8',
        content: 'Obrigado pelo retorno. Aguardo o andamento.',
        direction: 'inbound',
        channel: 'email',
        createdAt: '3 dias atrás',
        sender: 'Pedro Souza',
      },
    ],
  },
]

export const LawyerCommunicationPage = () => {
  const [conversations, setConversations] =
    useState<ClientConversation[]>(INITIAL_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState<string>('1')
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const activeChat = conversations.find((c) => c.id === selectedId) || conversations[0]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    const newMessage: ChatMessage = {
      id: `new-${Date.now()}`,
      content: messageText,
      direction: 'outbound',
      channel: activeChat.channel,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sender: 'Advogado de desenvolvimento',
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedId) {
          return {
            ...c,
            lastMessage: messageText,
            updatedAt: newMessage.createdAt,
            messages: [...c.messages, newMessage],
          }
        }
        return c
      }),
    )

    setMessageText('')
  }

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectChat = (id: string) => {
    setSelectedId(id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: false } : c)),
    )
  }

  return (
    <div className='flex flex-col gap-6 w-full max-w-none flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl md:text-4xl font-semibold font-serif text-brand dark:text-primary'>
          Central de Comunicação
        </h1>
        <p className='text-muted-foreground text-md'>
          Centralize suas mensagens com os clientes por WhatsApp e outros canais oficiais.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 w-full flex-1 min-h-[600px]'>
        <ChatListPanel
          conversations={filteredConversations}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectChat={handleSelectChat}
        />

        <ChatViewPanel
          activeChat={activeChat}
          messageText={messageText}
          onMessageChange={setMessageText}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}
