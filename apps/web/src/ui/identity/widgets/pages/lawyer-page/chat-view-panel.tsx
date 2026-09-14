import { useEffect, useRef } from 'react'
import { Card } from '@/ui/shadcn/card'
import { Button } from '@/ui/shadcn/button'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { MessageGroup, Message, MessageContent, MessageFooter } from '@/ui/shadcn/message'
import { Bubble, BubbleContent } from '@/ui/shadcn/bubble'
import { CollaboratorAvatar } from '../../components/collaborator-avatar'

import type { ClientConversation } from './chat-list-panel'

type ChatViewPanelProps = {
  activeChat: ClientConversation
  messageText: string
  onMessageChange: (text: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onSendStartWindowTemplate?: () => void
  isSendingTemplate?: boolean
}

export const ChatViewPanel = ({
  activeChat,
  messageText,
  onMessageChange,
  onSendMessage,
  onSendStartWindowTemplate,
  isSendingTemplate = false,
}: ChatViewPanelProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  const lastMsg = activeChat.messages[activeChat.messages.length - 1]
  const parseDate = (val?: unknown) => {
    if (!val) return Number.NaN
    if (val instanceof Date) return val.getTime()
    if (typeof val === 'number') return val
    if (typeof val === 'string') {
      const t = new Date(val).getTime()
      return Number.isNaN(t) ? Number.NaN : t
    }
    return Number.NaN
  }
  const rawTime = parseDate(lastMsg?.rawCreatedAt)
  const fallbackTime = parseDate(lastMsg?.createdAt)
  const lastMsgTime = !Number.isNaN(rawTime) ? rawTime : fallbackTime

  const isWindowClosed =
    !lastMsg ||
    Number.isNaN(lastMsgTime) ||
    Date.now() - lastMsgTime > 24 * 60 * 60 * 1000

  return (
    <Card
      id='chat-view-panel-container'
      className='lg:col-span-2 p-6 bg-card border border-border/60 shadow-sm flex flex-col justify-between h-[600px]'
    >
      {/* Chat Header */}
      <div
        id='chat-header-container'
        className='flex justify-between items-center border-b border-border/60 pb-4 shrink-0'
      >
        <div className='flex items-center gap-3'>
          <CollaboratorAvatar
            name={activeChat.avatar.name}
            colorSeed={activeChat.avatar.colorSeed}
            className='size-12'
          />
          <div className='flex flex-col'>
            <h3 className='font-semibold text-lg text-foreground leading-snug'>
              {activeChat.name}
            </h3>
            <span className='text-xs text-muted-foreground flex items-center gap-1.5'>
              {activeChat.caseNumber}
              <span className='inline-block size-1 rounded-full bg-muted-foreground/40' />
              Canal de comunicação:{' '}
              <span className='capitalize font-medium'>{activeChat.channel}</span>
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='secondary' size='sm' className='h-9 gap-1.5 text-xs'>
            <Icon name='file-text' className='size-4' />
            Ver Caso
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        id='chat-messages-container'
        ref={messagesContainerRef}
        className='flex-1 overflow-y-auto py-6 pr-1 flex flex-col gap-4 max-h-[360px]'
      >
        <MessageGroup>
          {activeChat.messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound'
            const isDocumentMsg = msg.content.startsWith('[Documento Recebido]')
            const docName = isDocumentMsg
              ? msg.content.replace('[Documento Recebido]', '').trim()
              : ''

            return (
              <Message key={msg.id} align={isOutbound ? 'end' : 'start'}>
                <MessageContent>
                  {isDocumentMsg ? (
                    <div
                      id={`document-message-card-${msg.id}`}
                      className='flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/60 max-w-sm my-1'
                    >
                      <div className='size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                        <Icon name='file-text' className='size-5' />
                      </div>
                      <div className='flex flex-col min-w-0 flex-1'>
                        <span className='font-semibold text-xs text-foreground truncate'>
                          {docName || 'Documento anexado'}
                        </span>
                        <span className='text-[11px] text-muted-foreground leading-tight mt-0.5'>
                          Documento recebido e atribuído ao cliente na Caixa de Docs
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Bubble
                      variant={isOutbound ? 'default' : 'secondary'}
                      align={isOutbound ? 'end' : 'start'}
                    >
                      <BubbleContent>{msg.content}</BubbleContent>
                    </Bubble>
                  )}
                  <MessageFooter className='flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground'>
                    <span>{msg.createdAt}</span>
                    <span>•</span>
                    <span>Enviado por {msg.sender}</span>
                    <Icon
                      name={
                        msg.channel === 'whatsapp'
                          ? 'message-square-text'
                          : msg.channel === 'email'
                            ? 'mail'
                            : 'phone'
                      }
                      className='size-3 text-muted-foreground/60'
                    />
                  </MessageFooter>
                </MessageContent>
              </Message>
            )
          })}
        </MessageGroup>
      </div>

      {/* Input Message Area or Closed Window Banner */}
      {activeChat.channel === 'whatsapp' && isWindowClosed ? (
        <div
          id='chat-window-closed-banner'
          className='border-t border-border/60 pt-4 flex flex-col gap-3 shrink-0 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20'
        >
          <div className='flex items-start gap-3'>
            <div className='shrink-0 size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center'>
              <Icon name='info' className='size-4' />
            </div>
            <div className='space-y-1 text-xs text-muted-foreground flex-1'>
              <p className='font-semibold text-foreground text-sm'>
                Janela de conversa de 24h fechada
              </p>
              <p className='leading-relaxed'>
                Pelas diretrizes de privacidade e uso do WhatsApp Business (Meta), após 24
                horas sem mensagens ativas, o envio de texto livre fica pausado. Para
                reabrir a janela de atendimento com este cliente, envie a mensagem de
                abertura oficial.
              </p>
            </div>
          </div>
          <Button
            id='start-conversation-window-button'
            type='button'
            onClick={onSendStartWindowTemplate}
            disabled={isSendingTemplate}
            className='w-full bg-primary text-white hover:bg-primary/90 font-medium h-10 rounded-lg shadow-sm cursor-pointer'
          >
            {isSendingTemplate ? (
              <span className='flex items-center gap-2'>
                <Icon name='refresh-cw' className='size-4 animate-spin' />
                Enviando mensagem de abertura...
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                <Icon name='message-square' className='size-4' />
                Iniciar janela de conversa
              </span>
            )}
          </Button>
        </div>
      ) : (
        <form
          id='chat-input-form'
          onSubmit={onSendMessage}
          className='border-t border-border/60 pt-4 flex gap-3 shrink-0 items-end'
        >
          <div className='flex-1'>
            <Textarea
              placeholder='Escreva sua resposta...'
              className='min-h-[50px] max-h-[80px] resize-none pr-12 focus-visible:ring-1 focus-visible:ring-primary'
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSendMessage(e)
                }
              }}
            />
          </div>
          <Button
            type='submit'
            size='icon'
            className='h-12 w-12 rounded-xl shrink-0 bg-primary text-white hover:bg-primary/95 flex items-center justify-center group'
          >
            <Icon
              name='send'
              className='size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200'
            />
          </Button>
        </form>
      )}
    </Card>
  )
}
