import { render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}))

import { MeusCasos } from '../my-cases'
import { useMeusCasos } from '../use-meus-casos'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

vi.mock('../use-meus-casos', () => ({
  useMeusCasos: vi.fn(),
}))

const useMeusCasosMock = vi.mocked(useMeusCasos)

const mockIntake = {
  id: 'intake-1',
  sequenceNumber: 42,
  clientId: 'client-1',
  responsibleId: 'user-1',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  origin: 'direct' as const,
  contactChannel: 'whatsapp' as const,
  legalAreaId: 'area-1',
  legalTopicId: 'topic-1',
  urgency: 'normal' as const,
  demandNotes: 'Notas de teste do caso.',
  status: IntakeStatus.ConsultationCompleted,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('MeusCasos Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeletons when case list is loading', () => {
    useMeusCasosMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [],
      isLoading: true,
      error: null,
    })

    render(<MeusCasos />)

    expect(screen.getByText(/Olá, Cliente Teste!/i)).toBeDefined()
    expect(screen.queryByText(/Nenhum caso encontrado/i)).toBeNull()
  })

  it('renders empty state when client has no cases', () => {
    useMeusCasosMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [],
      isLoading: false,
      error: null,
    })

    render(<MeusCasos />)

    expect(screen.getByText(/Nenhum caso encontrado/i)).toBeDefined()
    expect(
      screen.getByText(/Você ainda não possui solicitações de atendimento cadastradas/i),
    ).toBeDefined()
  })

  it('renders the case cards when cases are returned', () => {
    useMeusCasosMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [mockIntake],
      isLoading: false,
      error: null,
    })

    render(<MeusCasos />)

    expect(screen.getByText('Caso #42')).toBeDefined()
    expect(screen.getByText(/Notas:\s*Notas de teste do caso\./i)).toBeDefined()
    expect(screen.getByText('Consulta Realizada')).toBeDefined()
  })

  it('renders error message when loading fails', () => {
    useMeusCasosMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [],
      isLoading: false,
      error: new Error('fetch failure'),
    })

    render(<MeusCasos />)

    expect(
      screen.getByText(/Não foi possível carregar seus casos. Por favor, tente novamente mais tarde./i),
    ).toBeDefined()
  })
})

