import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useClientsQuery } from '@/ui/identity/hooks/use-clients-query'
import { useClientCommunicationsQuery } from '@/ui/identity/hooks/use-client-communications-query'
import { useSendCommunicationMutation } from '@/ui/identity/hooks/use-send-communication-mutation'
import { useCommunication } from '@/ui/shared/contexts/communication-context'
import { LawyerCommunicationPage } from '../communication'

vi.mock('@/ui/identity/hooks/use-clients-query', () => ({ useClientsQuery: vi.fn() }))
vi.mock('@/ui/identity/hooks/use-client-communications-query', () => ({
  useClientCommunicationsQuery: vi.fn(),
}))
vi.mock('@/ui/identity/hooks/use-send-communication-mutation', () => ({
  useSendCommunicationMutation: vi.fn(),
}))
vi.mock('@/ui/shared/contexts/communication-context', () => ({
  useCommunication: vi.fn(),
}))
vi.mock('../client-case-drawer', () => ({ ClientCaseDrawer: () => null }))
const { toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { error: toastErrorMock, success: toastSuccessMock } }))

const useClientsQueryMock = vi.mocked(useClientsQuery)
const useClientCommunicationsQueryMock = vi.mocked(useClientCommunicationsQuery)
const useSendCommunicationMutationMock = vi.mocked(useSendCommunicationMutation)
const useCommunicationMock = vi.mocked(useCommunication)
const sendMutationMock = vi.fn()

describe('LawyerCommunicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientsQueryMock.mockReturnValue({
      clientsPage: {
        data: [
          {
            id: 'client-1',
            name: 'Maria Silva',
            legalName: 'Maria Silva Ltda.',
          },
          {
            client: { id: 'client-2', legalName: 'Cliente Empresarial' },
            intakeCount: 2,
          },
        ],
        total: 2,
        page: 1,
        limit: 50,
      },
      clientsPageError: null,
      isLoadingClients: false,
    })
    useClientCommunicationsQueryMock.mockReturnValue(communicationsQueryResult())
    useSendCommunicationMutationMock.mockReturnValue({
      mutate: sendMutationMock,
      isPending: false,
      isSuccess: false,
    } as unknown as ReturnType<typeof useSendCommunicationMutation>)
    useCommunicationMock.mockReturnValue({
      unreadChatIds: ['client-2'],
      markAsRead: vi.fn(),
      setActiveClientId: vi.fn(),
      initializeUnreadChats: vi.fn(),
      addUnreadChat: vi.fn(),
      hasUnread: true,
      activeClientId: 'client-1',
    })
  })

  afterEach(cleanup)

  it('shows loading state while clients are loading', () => {
    useClientsQueryMock.mockReturnValue({
      clientsPage: undefined,
      clientsPageError: null,
      isLoadingClients: true,
    })

    render(<LawyerCommunicationPage />)

    expect(screen.getByText('Carregando clientes...')).toBeTruthy()
    expect(screen.queryByText('Maria Silva')).toBeNull()
  })

  it('selects the first client, displays messages and sends a reply', async () => {
    render(<LawyerCommunicationPage />)

    expect(screen.getByRole('heading', { name: 'Central de Comunicação' })).toBeTruthy()
    expect(await screen.findByText('Olá, preciso de ajuda.')).toBeTruthy()
    expect(useClientCommunicationsQueryMock).toHaveBeenCalledWith('client-1')

    fireEvent.change(screen.getByPlaceholderText('Escreva sua resposta...'), {
      target: { value: 'Retornarei em breve' },
    })
    const messageForm = screen
      .getByPlaceholderText('Escreva sua resposta...')
      .closest('form')
    expect(messageForm).not.toBeNull()
    if (messageForm) fireEvent.submit(messageForm)

    expect(sendMutationMock).toHaveBeenCalledWith(
      { clientId: 'client-1', content: 'Retornarei em breve', channel: 'whatsapp' },
      expect.objectContaining({ onError: expect.any(Function) }),
    )
  })

  it('restores the message and shows an error when sending fails', async () => {
    render(<LawyerCommunicationPage />)
    await screen.findByText('Olá, preciso de ajuda.')

    fireEvent.change(screen.getByPlaceholderText('Escreva sua resposta...'), {
      target: { value: 'Mensagem importante' },
    })
    const messageForm = screen
      .getByPlaceholderText('Escreva sua resposta...')
      .closest('form')
    expect(messageForm).not.toBeNull()
    if (messageForm) fireEvent.submit(messageForm)
    const options = sendMutationMock.mock.calls[0][1]
    options.onError?.(new Error('Falha de envio'))

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Escreva sua resposta...')).toHaveProperty(
        'value',
        'Mensagem importante',
      ),
    )
    expect(toastErrorMock).toHaveBeenCalledWith('Falha de envio')
  })

  it('starts a WhatsApp window template and reports success or failure', async () => {
    useClientCommunicationsQueryMock.mockReturnValue(
      communicationsQueryResult(new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()),
    )
    render(<LawyerCommunicationPage />)
    await screen.findByText('Olá, preciso de ajuda.')
    const startWindowButton = document.getElementById('start-conversation-window-button')
    expect(startWindowButton).not.toBeNull()
    if (startWindowButton) fireEvent.click(startWindowButton)

    expect(sendMutationMock).toHaveBeenCalledWith(
      {
        clientId: 'client-1',
        content: 'Olá! Gostaria de falar sobre o seu caso. Podemos conversar?',
        channel: 'whatsapp',
        type: 'template',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )

    const options = sendMutationMock.mock.calls[0][1]
    options.onSuccess?.()
    options.onError?.(new Error('Template indisponível'))
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Janela de conversa iniciada com sucesso!',
    )
    expect(toastErrorMock).toHaveBeenCalledWith('Template indisponível')
  })
})

function communicationsQueryResult(createdAt = new Date().toISOString()) {
  return {
    data: [
      {
        id: 'message-1',
        content: 'Olá, preciso de ajuda.',
        direction: 'inbound',
        channel: 'whatsapp',
        createdAt,
        author: 'Maria',
      },
    ],
  } as ReturnType<typeof useClientCommunicationsQuery>
}
