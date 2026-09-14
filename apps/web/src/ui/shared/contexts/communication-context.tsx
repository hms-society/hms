import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react'
import { useClientsQuery } from '@/ui/identity/hooks/use-clients-query'

import { playNotificationBeep } from '@/ui/shared/utils/audio-notifier'

type CommunicationContextType = {
  unreadChatIds: string[]
  initializeUnreadChats: (ids: string[]) => void
  addUnreadChat: (clientId: string) => void
  markAsRead: (clientId: string) => void
  hasUnread: boolean
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(
  undefined,
)

export const CommunicationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadChatIds, setUnreadChatIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Automatically fetch first page of clients to set initial unread badge state
  const { clientsPage } = useClientsQuery({
    page: 1,
    limit: 50,
  })

  useEffect(() => {
    if (clientsPage?.data && !isInitialized) {
      setUnreadChatIds([])
      setIsInitialized(true)
    }
  }, [clientsPage, isInitialized])

  const initializeUnreadChats = useCallback((ids: string[]) => {
    setIsInitialized((prevInitialized) => {
      if (prevInitialized) return prevInitialized
      setUnreadChatIds(ids)
      return true
    })
  }, [])

  const addUnreadChat = useCallback((clientId: string) => {
    setUnreadChatIds((prev) => {
      if (prev.includes(clientId)) return prev
      playNotificationBeep()
      return [...prev, clientId]
    })
  }, [])

  const markAsRead = useCallback((clientId: string) => {
    setUnreadChatIds((prev) => {
      if (!prev.includes(clientId)) return prev
      return prev.filter((id) => id !== clientId)
    })
  }, [])

  const hasUnread = unreadChatIds.length > 0

  return (
    <CommunicationContext.Provider
      value={{
        unreadChatIds,
        initializeUnreadChats,
        addUnreadChat,
        markAsRead,
        hasUnread,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  )
}

export const useCommunication = () => {
  const context = useContext(CommunicationContext)
  if (context === undefined) {
    throw new Error('useCommunication must be used within a CommunicationProvider')
  }
  return context
}
