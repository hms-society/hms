import { Card } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Avatar } from '@/ui/shadcn/avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ChatMessage = {
  id: string
  content: string
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'email' | 'phone'
  createdAt: string
  sender: string
}

export type ClientConversation = {
  id: string
  name: string
  lastMessage: string
  channel: 'whatsapp' | 'email' | 'phone'
  updatedAt: string
  unread: boolean
  caseNumber: string
  messages: ChatMessage[]
}

type ChatListPanelProps = {
  conversations: ClientConversation[]
  selectedId: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectChat: (id: string) => void
}

export const ChatListPanel = ({
  conversations,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelectChat,
}: ChatListPanelProps) => {
  return (
    <Card className='lg:col-span-1 p-6 bg-card border border-border/60 shadow-sm flex flex-col gap-4'>
      <div className='relative w-full'>
        <Icon
          name='search'
          className='absolute left-3 top-3 size-4 text-muted-foreground'
        />
        <Input
          type='text'
          placeholder='Buscar cliente...'
          className='pl-10 h-10 w-full'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className='flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1'>
        {conversations.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg p-4 bg-muted/10'>
            Nenhuma conversa encontrada.
          </div>
        ) : (
          conversations.map((chat) => (
            <button
              type='button'
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer flex gap-3 ${
                selectedId === chat.id
                  ? 'bg-primary/10 border-primary/30 shadow-xs'
                  : 'bg-muted/10 border-border/50 hover:bg-muted/30 hover:border-border'
              }`}
            >
              <div className='relative shrink-0'>
                <Avatar className='size-10 bg-primary/20 text-primary font-medium flex items-center justify-center rounded-full'>
                  {chat.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Avatar>
                <div className='absolute -bottom-1 -right-1 bg-white dark:bg-card p-1 rounded-full border border-border/40 shadow-xs flex items-center justify-center'>
                  <Icon
                    name={
                      chat.channel === 'whatsapp'
                        ? 'message-square-text'
                        : chat.channel === 'email'
                          ? 'mail'
                          : 'phone'
                    }
                    className={`size-3.5 ${
                      chat.channel === 'whatsapp'
                        ? 'text-emerald-600'
                        : chat.channel === 'email'
                          ? 'text-blue-600'
                          : 'text-amber-600'
                    }`}
                  />
                </div>
              </div>

              <div className='flex-1 min-w-0 flex flex-col gap-1'>
                <div className='flex justify-between items-center w-full'>
                  <span className='font-semibold text-foreground text-sm truncate'>
                    {chat.name}
                  </span>
                  <span className='text-[10px] text-muted-foreground shrink-0'>
                    {chat.updatedAt}
                  </span>
                </div>

                <div className='flex justify-between items-center w-full gap-2'>
                  <p
                    className={`text-xs truncate ${
                      chat.unread
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {chat.lastMessage}
                  </p>
                  {chat.unread && (
                    <span className='size-2 rounded-full bg-primary shrink-0' />
                  )}
                </div>

                <div className='flex items-center gap-1.5 mt-1'>
                  <span className='text-[10px] bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground'>
                    {chat.caseNumber}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  )
}
