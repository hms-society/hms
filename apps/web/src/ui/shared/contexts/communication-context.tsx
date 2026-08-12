import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react'
import { useClientsQuery } from '@/ui/shared/hooks/use-clients-query'

type CommunicationContextType = {
  unreadChatIds: string[]
  initializeUnreadChats: (ids: string[]) => void
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
  const { data: clientsData } = useClientsQuery({
    page: 1,
    limit: 50,
  })

  useEffect(() => {
    if (clientsData?.data && !isInitialized) {
      setUnreadChatIds([])
      setIsInitialized(true)
    }
  }, [clientsData, isInitialized])

  const initializeUnreadChats = useCallback((ids: string[]) => {
    setIsInitialized((prevInitialized) => {
      if (prevInitialized) return prevInitialized
      setUnreadChatIds(ids)
      return true
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
