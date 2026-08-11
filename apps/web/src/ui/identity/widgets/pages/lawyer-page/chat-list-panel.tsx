import { Card } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  CollaboratorAvatar,
  type CollaboratorAvatarProps,
} from '../../components/collaborator-avatar'

export type ChatMessage = {
  id: string
  content: string
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'email' | 'phone'
  createdAt: string
  sender: string
}

export type ClientConversation = {
  avatar: CollaboratorAvatarProps
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
      <div id='chat-search-container' className='relative w-full'>
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

      <div
        id='chat-list-container'
        className='flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1'
      >
        {conversations.length === 0 ? (
          <div
            id='chat-empty-state'
            className='text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg p-4 bg-muted/10'
          >
            Nenhuma conversa encontrada.
          </div>
        ) : (
          conversations.map((chat) => (
            <button
              type='button'
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left p-2 rounded-lg border transition-all duration-200 cursor-pointer flex gap-3 ${
                selectedId === chat.id
                  ? 'bg-accent border-primary/15 shadow-xs'
                  : 'bg-muted/10 border-border/50 hover:bg-muted/30 hover:border-border'
              }`}
            >
              <div id={`chat-avatar-wrapper-${chat.id}`} className='relative shrink-0'>
                <CollaboratorAvatar
                  name={chat.avatar.name}
                  colorSeed={chat.avatar.colorSeed}
                  className='size-10'
                />
              </div>

              <div
                id={`chat-info-${chat.id}`}
                className='flex-1 min-w-0 flex flex-col gap-1'
              >
                <div
                  id={`chat-header-${chat.id}`}
                  className='flex justify-between items-center w-full'
                >
                  <span className='font-semibold text-foreground text-sm truncate'>
                    {chat.name}
                  </span>
                  <span className='text-[10px] text-muted-foreground shrink-0'>
                    {chat.updatedAt}
                  </span>
                </div>

                <div
                  id={`chat-body-${chat.id}`}
                  className='flex justify-between items-center w-full gap-2'
                >
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
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  )
}
