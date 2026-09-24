import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommunicationProvider, useCommunication } from './communication-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { playNotificationBeep } from '@/ui/shared/utils/audio-notifier'

vi.mock('@/ui/shared/hooks/use-rest-context')
vi.mock('@/ui/shared/utils/audio-notifier')

describe('CommunicationContext', () => {
  const mockListClientCommunicationSummaries = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockListClientCommunicationSummaries.mockResolvedValue({
      isFailure: false,
      body: [],
    })
    vi.mocked(useRestContext).mockReturnValue({
      communicationService: {
        listClientCommunicationSummaries: mockListClientCommunicationSummaries,
      },
    } as any)
  })

  it('should mark chat as unread on initial load if the LAST message is inbound without playing beep', async () => {
    mockListClientCommunicationSummaries.mockResolvedValue({
      isFailure: false,
      body: [{ clientId: 'client-1', inboundCount: 1, isLastMessageInbound: true }],
    })

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
    mockListClientCommunicationSummaries.mockResolvedValue({
      isFailure: false,
      body: [{ clientId: 'client-1', inboundCount: 1, isLastMessageInbound: false }],
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CommunicationProvider>{children}</CommunicationProvider>
    )

    const { result } = renderHook(() => useCommunication(), { wrapper })

    await waitFor(() => {
      expect(mockListClientCommunicationSummaries).toHaveBeenCalledTimes(1)
    })

    expect(result.current.hasUnread).toBe(false)
    expect(result.current.unreadChatIds).toEqual([])
    expect(playNotificationBeep).not.toHaveBeenCalled()
  })

  it('should play notification beep and add unread badge when addUnreadChat is called for an inactive chat', () => {
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
