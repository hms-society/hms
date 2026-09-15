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

  it('should mark chat as unread on initial load if the LAST message is inbound without playing beep', async () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: {
        data: [{ id: 'client-1', name: 'Cliente 1' }],
      },
    } as any)

    mockListClientCommunications.mockResolvedValue([
      { id: 'msg-1', direction: 'inbound', content: 'Mensagem da noite' },
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

  it('should NOT mark chat as unread on initial load if the LAST message was outbound', async () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: {
        data: [{ id: 'client-1', name: 'Cliente 1' }],
      },
    } as any)

    mockListClientCommunications.mockResolvedValue([
      { id: 'msg-2', direction: 'outbound', content: 'Resposta do advogado' },
      { id: 'msg-1', direction: 'inbound', content: 'Pergunta do cliente' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    await waitFor(() => {
      expect(mockListClientCommunications).toHaveBeenCalledWith('client-1')
    })

    expect(result.current.hasUnread).toBe(false)
    expect(result.current.unreadChatIds).toEqual([])
    expect(playNotificationBeep).not.toHaveBeenCalled()
  })

  it('should play notification beep and add unread badge when addUnreadChat is called for an inactive chat', () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: { data: [] },
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    act(() => {
      result.current.addUnreadChat('client-1')
    })

    expect(result.current.hasUnread).toBe(true)
    expect(result.current.unreadChatIds).toEqual(['client-1'])
    expect(playNotificationBeep).toHaveBeenCalledTimes(1)
  })

  it('should clear unread status when markAsRead is called', () => {
    vi.mocked(useClientsQuery).mockReturnValue({
      clientsPage: { data: [] },
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    act(() => {
      result.current.addUnreadChat('client-1')
    })

    expect(result.current.hasUnread).toBe(true)

    act(() => {
      result.current.markAsRead('client-1')
    })

    expect(result.current.hasUnread).toBe(false)
    expect(result.current.unreadChatIds).toEqual([])
  })
})
