import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useRef,
} from 'react'
import { useClientsQuery } from '@/ui/identity/hooks/use-clients-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { playNotificationBeep } from '@/ui/shared/utils/audio-notifier'

type CommunicationContextType = {
  unreadChatIds: string[]
  initializeUnreadChats: (ids: string[]) => void
  addUnreadChat: (clientId: string) => void
  markAsRead: (clientId: string) => void
  hasUnread: boolean
  activeClientId: string
  setActiveClientId: (clientId: string) => void
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(
  undefined,
)

export const CommunicationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadChatIds, setUnreadChatIds] = useState<string[]>([])
  const [activeClientId, setActiveClientIdState] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)
  const lastInboundCountMap = useRef<Record<string, number>>({})

  const { communicationService } = useRestContext()

  // Automatically fetch clients with polling interval
  const { clientsPage } = useClientsQuery({
    page: 1,
    limit: 50,
  })

  const markAsRead = useCallback((clientId: string) => {
    if (!clientId) return
    setUnreadChatIds((prev) => {
      if (!prev.includes(clientId)) return prev
      return prev.filter((id) => id !== clientId)
    })
  }, [])

  const setActiveClientId = useCallback(
    (clientId: string) => {
      setActiveClientIdState(clientId)
      if (clientId) {
        markAsRead(clientId)
      }
    },
    [markAsRead],
  )

  const addUnreadChat = useCallback((clientId: string) => {
    setUnreadChatIds((prev) => {
      if (prev.includes(clientId)) return prev
      playNotificationBeep()
      return [...prev, clientId]
    })
  }, [])

  const initializeUnreadChats = useCallback((ids: string[]) => {
    setIsInitialized((prevInitialized) => {
      if (prevInitialized) return prevInitialized
      setUnreadChatIds(ids)
      return true
    })
  }, [])

  // Poll client communications to detect initial & new inbound messages
  useEffect(() => {
    const clients = (clientsPage?.data as any[]) || []
    if (!clients || !Array.isArray(clients) || clients.length === 0) return

    let isMounted = true

    const checkNewMessages = async () => {
      try {
        const results = await Promise.all(
          clients.map(async (item) => {
            const c = item.client || item
            if (!c?.id) return null

            try {
              const response: any = await communicationService.listClientCommunications(
                c.id,
              )
              let msgs: any[] = []
              if (Array.isArray(response)) {
                msgs = response
              } else if (response?.body && Array.isArray(response.body)) {
                msgs = response.body
              } else if (response?.data && Array.isArray(response.data)) {
                msgs = response.data
              }

              const inboundCount = msgs.filter(
                (m: any) => m.direction === 'inbound',
              ).length
              return { clientId: c.id, inboundCount }
            } catch (_err) {
              return null
            }
          }),
        )

        if (!isMounted) return

        for (const res of results) {
          if (!res) continue
          const { clientId, inboundCount } = res
          const prevCount = lastInboundCountMap.current[clientId]

          if (prevCount === undefined) {
            // Carga inicial: registra a contagem inicial e marca como unread se houver inbound sem tocar o beep
            lastInboundCountMap.current[clientId] = inboundCount
            if (inboundCount > 0 && clientId !== activeClientId) {
              setUnreadChatIds((prev) =>
                prev.includes(clientId) ? prev : [...prev, clientId],
              )
            }
          } else if (inboundCount > prevCount) {
            // Nova mensagem recebida durante a sessão
            lastInboundCountMap.current[clientId] = inboundCount
            if (clientId === activeClientId) {
              markAsRead(clientId)
            } else {
              addUnreadChat(clientId)
            }
          }
        }

        if (!isInitialized) {
          setIsInitialized(true)
        }
      } catch (_err) {
        // Ignora erros de polling temporários
      }
    }

    checkNewMessages()

    const timer = setInterval(checkNewMessages, 10000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [
    clientsPage,
    activeClientId,
    communicationService,
    addUnreadChat,
    markAsRead,
    isInitialized,
  ])

  const hasUnread = unreadChatIds.length > 0

  return (
    <CommunicationContext.Provider
      value={{
        unreadChatIds,
        initializeUnreadChats,
        addUnreadChat,
        markAsRead,
        hasUnread,
        activeClientId,
        setActiveClientId,
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
