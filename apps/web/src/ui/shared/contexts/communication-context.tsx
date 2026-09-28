import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
  useRef,
} from 'react'
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
  const activeClientIdRef = useRef('')
  const hasInitializedUnreadChats = useRef(false)
  const lastInboundCountMap = useRef<Record<string, number>>({})

  const { communicationService } = useRestContext()

  const markAsRead = useCallback((clientId: string) => {
    if (!clientId) return
    setUnreadChatIds((prev) => {
      if (!prev.includes(clientId)) return prev
      return prev.filter((id) => id !== clientId)
    })
  }, [])

  const setActiveClientId = useCallback(
    (clientId: string) => {
      activeClientIdRef.current = clientId
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
    if (hasInitializedUnreadChats.current) return
    hasInitializedUnreadChats.current = true
    setUnreadChatIds(ids)
  }, [])

  useEffect(() => {
    let isActive = true
    let timer: ReturnType<typeof setTimeout> | undefined

    async function checkNewMessages() {
      try {
        const response = await communicationService.listClientCommunicationSummaries()
        if (response.isFailure) response.throwError()
        if (!isActive) return

        for (const { clientId, inboundCount, isLastMessageInbound } of response.body) {
          const prevCount = lastInboundCountMap.current[clientId]

          if (prevCount === undefined) {
            lastInboundCountMap.current[clientId] = inboundCount
            if (isLastMessageInbound && clientId !== activeClientIdRef.current) {
              setUnreadChatIds((prev) =>
                prev.includes(clientId) ? prev : [...prev, clientId],
              )
            }
          } else if (inboundCount > prevCount) {
            lastInboundCountMap.current[clientId] = inboundCount
            if (clientId === activeClientIdRef.current) {
              markAsRead(clientId)
            } else {
              addUnreadChat(clientId)
            }
          }
        }

        hasInitializedUnreadChats.current = true
      } catch (_err) {
        // A failed poll is retried after the interval without overlapping requests.
      } finally {
        if (isActive) timer = setTimeout(checkNewMessages, 10_000)
      }
    }

    void checkNewMessages()

    return () => {
      isActive = false
      if (timer) clearTimeout(timer)
    }
  }, [communicationService, addUnreadChat, markAsRead])

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
