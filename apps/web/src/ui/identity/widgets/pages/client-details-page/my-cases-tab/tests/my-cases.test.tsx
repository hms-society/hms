import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { MyCasesTab } from '../index'
import { useMyCasesTab } from '../use-my-cases-tab'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: vi.fn() }),
}))

vi.mock('../use-my-cases-tab', () => ({
  useMyCasesTab: vi.fn(),
}))

const useMyCasesMock = vi.mocked(useMyCasesTab)

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

describe('MyCasesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the loading state from the widget state', () => {
    useMyCasesMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [],
      greeting: 'Bom dia',
      isLoading: true,
      error: null,
    })

    render(<MyCasesTab />)

    expect(screen.getByRole('heading', { name: /Olá, Cliente Teste!/i })).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.queryByText(/Nenhum caso encontrado/i)).toBeNull()
  })

  it('renders the empty state when the client has no cases', () => {
    useMyCasesMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [],
      greeting: 'Bom dia',
      isLoading: false,
      error: null,
    })

    render(<MyCasesTab />)

    expect(screen.getByText(/Nenhum caso encontrado/i)).toBeInstanceOf(HTMLElement)
    expect(
      screen.getByText(/Você ainda não possui solicitações de atendimento cadastradas/i),
    ).toBeInstanceOf(HTMLElement)
  })

  it('renders the case card when cases are returned', () => {
    useMyCasesMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [mockIntake],
      greeting: 'Bom dia',
      isLoading: false,
      error: null,
    })

    render(<MyCasesTab />)

    expect(screen.getByText('Caso #42')).toBeInstanceOf(HTMLElement)
    expect(screen.getByText(/Notas:\s*Notas de teste do caso\./i)).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getByText('Consulta Realizada')).toBeInstanceOf(HTMLElement)
  })

  it('renders the error state when loading fails', () => {
    useMyCasesMock.mockReturnValue({
      clientName: 'Cliente Teste',
      clientIntakes: [],
      greeting: 'Bom dia',
      isLoading: false,
      error: new Error('fetch failure'),
    })

    render(<MyCasesTab />)

    expect(
      screen.getByText(
        /Não foi possível carregar seus casos\. Por favor, tente novamente mais tarde\./i,
      ),
    ).toBeInstanceOf(HTMLElement)
  })
})
