import { Card } from '@/ui/shadcn/card'
import { Button } from '@/ui/shadcn/button'
import { Avatar } from '@/ui/shadcn/avatar'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { MessageGroup, Message, MessageContent, MessageFooter } from '@/ui/shadcn/message'
import { Bubble, BubbleContent } from '@/ui/shadcn/bubble'

import type { ClientConversation } from './chat-list-panel'

type ChatViewPanelProps = {
  activeChat: ClientConversation
  messageText: string
  onMessageChange: (text: string) => void
  onSendMessage: (e: React.FormEvent) => void
}

export const ChatViewPanel = ({
  activeChat,
  messageText,
  onMessageChange,
  onSendMessage,
}: ChatViewPanelProps) => {
  return (
    <Card className='lg:col-span-2 p-6 bg-card border border-border/60 shadow-sm flex flex-col justify-between h-[600px]'>
      {/* Chat Header */}
      <div className='flex justify-between items-center border-b border-border/60 pb-4 shrink-0'>
        <div className='flex items-center gap-3'>
          <Avatar className='size-12 bg-primary/20 text-primary font-medium flex items-center justify-center rounded-full'>
            {activeChat.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </Avatar>
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
      <div className='flex-1 overflow-y-auto py-6 pr-1 flex flex-col gap-4 max-h-[360px]'>
        <MessageGroup>
          {activeChat.messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound'
            return (
              <Message key={msg.id} align={isOutbound ? 'end' : 'start'}>
                <MessageContent>
                  <Bubble
                    variant={isOutbound ? 'default' : 'secondary'}
                    align={isOutbound ? 'end' : 'start'}
                  >
                    <BubbleContent>{msg.content}</BubbleContent>
                  </Bubble>
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

      {/* Input Message Area */}
      <form
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
    </Card>
  )
}
