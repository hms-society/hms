import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommunicationProvider, useCommunication } from './communication-context'
import { useClientsQuery } from '@/ui/identity/hooks/use-clients-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { playNotificationBeep } from '@/ui/shared/utils/audio-notifier'

vi.mock('@/ui/identity/hooks/use-clients-query')
vi.mock('@/ui/shared/hooks/use-rest-context')
vi.mock('@/ui/shared/utils/audio-notifier')

describe('CommunicationContext', () => {
  const mockListClientCommunications = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRestContext).mockReturnValue({
      communicationService: {
        listClientCommunications: mockListClientCommunications,
      },
    } as any)
  })

  it('should initialize unread chats on initial load without playing notification beep', async () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: {
        data: [{ id: 'client-1', name: 'Cliente 1' }],
      },
    } as any)

    mockListClientCommunications.mockResolvedValue([
      { id: 'msg-1', direction: 'inbound', content: 'Olá' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    await waitFor(() => {
      expect(result.current.hasUnread).toBe(true)
    })

    expect(result.current.unreadChatIds).toEqual(['client-1'])
    expect(playNotificationBeep).not.toHaveBeenCalled()
  })

  it('should play notification beep when a NEW inbound message arrives for an inactive chat', async () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: {
        data: [{ id: 'client-1', name: 'Cliente 1' }],
      },
    } as any)

    // Primeira resposta: 1 mensagem inbound
    mockListClientCommunications.mockResolvedValueOnce([
      { id: 'msg-1', direction: 'inbound', content: 'Olá' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    await waitFor(() => {
      expect(result.current.hasUnread).toBe(true)
    })

    expect(playNotificationBeep).not.toHaveBeenCalled()

    // Segunda resposta: 2 mensagens inbound (nova mensagem chegou)
    mockListClientCommunications.mockResolvedValueOnce([
      { id: 'msg-1', direction: 'inbound', content: 'Olá' },
      { id: 'msg-2', direction: 'inbound', content: 'Tudo bem?' },
    ])

    // Força re-execução do efeito
    act(() => {
      result.current.markAsRead('client-1')
    })

    expect(result.current.hasUnread).toBe(false)
  })

  it('should clear unread status when markAsRead is called', async () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: {
        data: [{ id: 'client-1', name: 'Cliente 1' }],
      },
    } as any)

    mockListClientCommunications.mockResolvedValue([
      { id: 'msg-1', direction: 'inbound', content: 'Olá' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    await waitFor(() => {
      expect(result.current.hasUnread).toBe(true)
    })

    act(() => {
      result.current.markAsRead('client-1')
    })

    expect(result.current.hasUnread).toBe(false)
    expect(result.current.unreadChatIds).toEqual([])
  })
})
