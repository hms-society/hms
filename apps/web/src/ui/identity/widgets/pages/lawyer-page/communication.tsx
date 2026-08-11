import { useState, useEffect } from 'react'
import { useClientsQuery } from '@/ui/shared/hooks/use-clients-query'
import { useClientCommunicationsQuery } from '@/ui/shared/hooks/use-client-communications-query'
import { useSendCommunicationMutation } from '@/ui/shared/hooks/use-send-communication-mutation'
import { toast } from 'sonner'

import {
  ChatListPanel,
  type ChatMessage,
  type ClientConversation,
} from './chat-list-panel'
import { ChatViewPanel } from './chat-view-panel'
import { useCommunication } from '@/ui/shared/contexts/communication-context'

export const LawyerCommunicationPage = () => {
  const { unreadChatIds, markAsRead } = useCommunication()
  const [selectedId, setSelectedId] = useState<string>('')
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [localMessages, _setLocalMessages] = useState<Record<string, ChatMessage[]>>({})

  const sendCommunicationMutation = useSendCommunicationMutation()
  if (sendCommunicationMutation.isSuccess) {
    console.log(selectedId)
  }

  // Fetch clients from the database
  const { data: clientsData, isLoading: isLoadingClients } = useClientsQuery({
    page: 1,
    limit: 50,
    search: searchQuery,
  })

  const clients = (clientsData?.data ?? []) as any[]

  // Automatically select the first client if none is selected
  useEffect(() => {
    if (clients.length > 0 && !selectedId) {
      const firstClient = clients[0].client || clients[0]
      setSelectedId(firstClient.id)
    }
  }, [clients, selectedId])

  // Mark selected client's chat as read
  useEffect(() => {
    if (selectedId) {
      markAsRead(selectedId)
    }
  }, [selectedId, markAsRead])

  // Fetch communications for the selected client
  const { data: realMessages } = useClientCommunicationsQuery(selectedId)

  // Find the active client item
  const activeClientItem = clients.find((item: any) => {
    const c = item.client || item
    return c.id === selectedId
  })
  const activeClient = activeClientItem?.client || activeClientItem

  // Construct the active chat conversation
  const activeChat: ClientConversation | undefined = activeClient
    ? {
        avatar: {
          name: activeClient.name || activeClient.legalName || 'Nome não informado',
          colorSeed: activeClient.id,
        },
        id: activeClient.id,
        name: activeClient.name || activeClient.legalName || 'Nome não informado',
        lastMessage: '',
        channel: 'whatsapp',
        updatedAt: '',
        unread: false,
        caseNumber: activeClientItem?.intakeCount
          ? `Intakes: ${activeClientItem.intakeCount}`
          : 'Sem intakes',
        messages: [
          ...(realMessages?.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            direction: msg.direction,
            channel: msg.channel,
            createdAt: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            sender: msg.author || 'Cliente',
          })) || []),
          ...(localMessages[selectedId] || []),
        ],
      }
    : undefined

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedId || sendCommunicationMutation.isPending) return

    const textToSend = messageText
    setMessageText('')

    sendCommunicationMutation.mutate(
      {
        clientId: selectedId,
        content: textToSend,
        channel: 'whatsapp',
      },
      {
        onError: (error: any) => {
          setMessageText(textToSend)
          toast.error(error?.message || 'Falha ao entregar a mensagem.')
        },
      },
    )
  }

  // Construct conversations list for ChatListPanel
  const conversations: ClientConversation[] = clients.map((item: any) => {
    const c = item.client || item
    return {
      avatar: {
        name: c.name || c.legalName || 'Nome não informado',
        colorSeed: c.id,
      },
      id: c.id,
      name: c.name || c.legalName || 'Nome não informado',
      lastMessage: localMessages[c.id]?.length
        ? localMessages[c.id][localMessages[c.id].length - 1].content
        : 'Clique para ver a conversa',
      channel: 'whatsapp',
      updatedAt: '',
      unread: unreadChatIds.includes(c.id),
      caseNumber: item.intakeCount ? `Intakes: ${item.intakeCount}` : 'Sem intakes',
      messages: [],
    }
  })

  const handleSelectChat = (id: string) => {
    setSelectedId(id)
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
        {isLoadingClients ? (
          <div className='lg:col-span-3 flex items-center justify-center h-[400px] text-muted-foreground'>
            Carregando clientes...
          </div>
        ) : (
          <>
            <ChatListPanel
              conversations={conversations}
              selectedId={selectedId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectChat={handleSelectChat}
            />

            {activeChat ? (
              <ChatViewPanel
                activeChat={activeChat}
                messageText={messageText}
                onMessageChange={setMessageText}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className='lg:col-span-2 flex items-center justify-center border border-dashed rounded-xl p-8 bg-muted/5 text-muted-foreground'>
                Selecione um cliente para visualizar o chat.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
