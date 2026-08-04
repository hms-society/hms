import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useClientCommunicationsQuery } from '@/ui/shared/hooks/use-client-communications-query'
import { ClientDetailsPage } from '../client-detail'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-client-communications-query', () => ({
  useClientCommunicationsQuery: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: any) => (
    <a href={route} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/ui/shared/widgets/components/icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}))

// Mock Radix Select components since they can be hard to interact with in testing library without full rendering
vi.mock('@/ui/shadcn/select', () => {
  return {
    Select: ({ children, value, onValueChange }: any) => {
      return (
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          data-testid="mock-select"
        >
          {children}
        </select>
      )
    },
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  }
})

const useRestContextMock = vi.mocked(useRestContext)
const useClientCommunicationsQueryMock = vi.mocked(useClientCommunicationsQuery)

const mockClient = {
  id: 'client-1',
  type: 'natural',
  name: 'John Doe',
  taxId: { value: '12345678901' },
  phone: '11999999999',
  email: 'john@example.com',
}

const mockConsents = [
  { id: 'consent-1', termId: 'term-1', acceptedAt: new Date() },
]

const mockCommunications = [
  {
    id: 'comm-1',
    channel: 'whatsapp',
    direction: 'inbound',
    content: 'Olá, gostaria de saber sobre meu processo.',
    author: 'John Doe',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'comm-2',
    channel: 'email',
    direction: 'outbound',
    content: 'Olá! Seu processo está em andamento.',
    author: 'Secretaria HMS',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
]

describe('ClientDetailsPage', () => {
  const identityService = {
    getClient: vi.fn(),
  }
  const intakeService = {
    listClientIntake: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ identityService, intakeService } as never)
    useClientCommunicationsQueryMock.mockReturnValue({
      data: mockCommunications,
      isLoading: false,
      isError: false,
    } as any)
  })

  afterEach(cleanup)

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return function QueryProvider({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
  }

  it('renders loading state when data is fetching', () => {
    identityService.getClient.mockReturnValue(new Promise(() => {}))
    intakeService.listClientIntake.mockReturnValue(new Promise(() => {}))

    render(<ClientDetailsPage clientId="client-1" />, { wrapper: createWrapper() })

    expect(screen.getByText('Carregando ficha do cliente...')).toBeDefined()
  })

  it('renders error state when client fetch fails', async () => {
    identityService.getClient.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'Fail' }),
    )
    intakeService.listClientIntake.mockResolvedValue(new RestResponse({ body: [] }))

    render(<ClientDetailsPage clientId="client-1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar dados do cliente.')).toBeDefined()
    })
  })

  it('renders client details card, consents count, status badge, and communication items', async () => {
    identityService.getClient.mockResolvedValue(
      new RestResponse({ body: { client: mockClient, consents: mockConsents } }),
    )
    intakeService.listClientIntake.mockResolvedValue(
      new RestResponse({ body: [{ id: 'intake-1' }, { id: 'intake-2' }] }),
    )

    render(<ClientDetailsPage clientId="client-1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'John Doe' })).toBeDefined()
    })

    expect(screen.getAllByText('Cliente')[0]).toBeDefined() // status: 'Cliente' (intakes.length > 1)
    expect(screen.getByText('1 consentimento(s)')).toBeDefined()
    expect(screen.getByText('john@example.com')).toBeDefined()

    // Verify communication entries are rendered
    expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    expect(screen.getByText('Olá! Seu processo está em andamento.')).toBeDefined()
  })

  it('filters communications by channel', async () => {
    identityService.getClient.mockResolvedValue(
      new RestResponse({ body: { client: mockClient, consents: mockConsents } }),
    )
    intakeService.listClientIntake.mockResolvedValue(new RestResponse({ body: [] }))

    render(<ClientDetailsPage clientId="client-1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    })

    const selects = screen.getAllByTestId('mock-select')
    // Channel select is the first select (value: channelFilter)
    const channelSelect = selects[0]

    // Filter by WhatsApp
    fireEvent.change(channelSelect, { target: { value: 'whatsapp' } })
    expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    expect(screen.queryByText('Olá! Seu processo está em andamento.')).toBeNull()

    // Filter by Email
    fireEvent.change(channelSelect, { target: { value: 'email' } })
    expect(screen.queryByText('Olá, gostaria de saber sobre meu processo.')).toBeNull()
    expect(screen.getByText('Olá! Seu processo está em andamento.')).toBeDefined()
  })

  it('filters communications by direction', async () => {
    identityService.getClient.mockResolvedValue(
      new RestResponse({ body: { client: mockClient, consents: mockConsents } }),
    )
    intakeService.listClientIntake.mockResolvedValue(new RestResponse({ body: [] }))

    render(<ClientDetailsPage clientId="client-1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    })

    const selects = screen.getAllByTestId('mock-select')
    // Direction select is the second select (value: typeFilter)
    const directionSelect = selects[1]

    // Filter by Inbound
    fireEvent.change(directionSelect, { target: { value: 'inbound' } })
    expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    expect(screen.queryByText('Olá! Seu processo está em andamento.')).toBeNull()

    // Filter by Outbound
    fireEvent.change(directionSelect, { target: { value: 'outbound' } })
    expect(screen.queryByText('Olá, gostaria de saber sobre meu processo.')).toBeNull()
    expect(screen.getByText('Olá! Seu processo está em andamento.')).toBeDefined()
  })

  it('filters communications by period', async () => {
    identityService.getClient.mockResolvedValue(
      new RestResponse({ body: { client: mockClient, consents: mockConsents } }),
    )
    intakeService.listClientIntake.mockResolvedValue(new RestResponse({ body: [] }))

    render(<ClientDetailsPage clientId="client-1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    })

    const selects = screen.getAllByTestId('mock-select')
    // Period select is the third select (value: periodFilter)
    const periodSelect = selects[2]

    // Filter by last 7 days (comm-1 is 2 days ago, comm-2 is 10 days ago)
    fireEvent.change(periodSelect, { target: { value: '7days' } })
    expect(screen.getByText('Olá, gostaria de saber sobre meu processo.')).toBeDefined()
    expect(screen.queryByText('Olá! Seu processo está em andamento.')).toBeNull()
  })
})
