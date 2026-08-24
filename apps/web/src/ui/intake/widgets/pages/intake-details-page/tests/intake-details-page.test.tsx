import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Intake } from '@hms/core/intake/domain/entities'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { IntakeDetailsPage } from '..'
import {
  useIntakeDetailsQuery,
  type IntakeDetailsData,
} from '../use-intake-details-query'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: Record<string, unknown>) => (
    <a
      href={
        route === 'intakeDetails'
          ? `/intakes/${(params as Record<string, string> | undefined)?.intakeId}`
          : route === 'attendantConsultations'
            ? '/consultas'
            : route === 'consultation'
              ? `/consultas/${(params as Record<string, string> | undefined)?.consultationId}`
              : route === 'consultationAttendanceForm'
                ? `/consultas/${(params as Record<string, string> | undefined)?.consultationId}/ficha-atendimento`
                : '/intakes'
      }
      {...props}
    >
      {children as ReactNode}
    </a>
  ),
}))

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('../use-intake-details-query', () => ({
  useIntakeDetailsQuery: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)
const useIntakeDetailsQueryMock = vi.mocked(useIntakeDetailsQuery)

const baseIntake: Intake = {
  id: 'intake-1',
  sequenceNumber: 339,
  clientId: 'client-1',
  responsibleId: 'responsible-1',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  origin: 'direct',
  contactChannel: 'whatsapp',
  legalAreaId: 'area-1',
  legalTopicId: 'topic-1',
  urgency: 'normal',
  demandNotes: 'Orientação sobre rescisão contratual',
  status: 'consultation_scheduled',
  version: 1,
  createdAt: new Date('2026-08-18T12:00:00.000Z'),
  updatedAt: new Date('2026-08-18T13:00:00.000Z'),
}

function createDetails(status: Intake['status'] = baseIntake.status): IntakeDetailsData {
  const intake = { ...baseIntake, status }

  if (status === 'closed_without_contract') {
    intake.closureReason = 'out_of_scope'
    intake.closureNotes = 'Demanda fora da área de atuação.'
    intake.closedAt = new Date('2026-08-19T12:00:00.000Z')
  }

  return {
    intake,
    client: {
      client: {
        id: 'client-1',
        type: 'natural',
        name: 'Cliente HMS Teste',
        taxId: { type: 'cpf', value: '98198246304' },
        email: 'cliente@example.com',
        phone: '66840566416',
        address: { city: 'Cuiabá', state: 'MT' },
      },
    } as never,
    responsible: { id: 'responsible-1', professionalName: 'Hudson Marcelo' } as never,
    legalArea: { id: 'area-1', name: 'Cível' } as never,
    legalTopic: { id: 'topic-1', name: 'Contratos' } as never,
    previousIntakes: [],
    consultationId: 'consultation-1',
  }
}

function renderPage(data: IntakeDetailsData) {
  const queryClient = new QueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <IntakeDetailsPage intakeId={data.intake.id} />
    </QueryClientProvider>,
  )
}

function createQueryResult(data: IntakeDetailsData) {
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never
}

describe('IntakeDetailsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthContextMock.mockReturnValue({ user: { id: 'user-1' } } as never)
    useRestContextMock.mockReturnValue({
      intakeService: {
        closeIntakeWithoutContract: vi.fn(),
        transitionIntakeStatus: vi.fn(),
      },
    } as never)
    useIntakeDetailsQueryMock.mockReturnValue(createQueryResult(createDetails()))
  })

  it('renders the scheduled intake overview with a vertical activity timeline', () => {
    renderPage(createDetails())

    expect(screen.getByRole('heading', { name: 'INT-0339' })).toBeDefined()
    expect(screen.queryByText('Demanda principal')).toBeNull()
    expect(screen.getAllByText('Consulta agendada').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: /Abrir consulta/ }).getAttribute('href'),
    ).toBe('/consultas/consultation-1')
    expect(screen.getByRole('heading', { name: 'Atividade' })).toBeDefined()
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByText('Comunicações')).toBeNull()
    expect(screen.queryByText('Observações')).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('Intake criado')).toBeDefined()
  })

  it('reveals the viability action at the viability status', () => {
    useIntakeDetailsQueryMock.mockReturnValue(
      createQueryResult(createDetails('viability_registered')),
    )
    renderPage(createDetails('viability_registered'))

    expect(screen.getByText('Avaliação de viabilidade')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Iniciar formalização' })).toBeDefined()
  })

  it('reveals the contracting action during formalization', () => {
    useIntakeDetailsQueryMock.mockReturnValue(
      createQueryResult(createDetails('in_formalization')),
    )
    renderPage(createDetails('in_formalization'))

    expect(screen.getAllByText('Formalização iniciada').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Confirmar contratação' })).toBeDefined()
  })

  it('opens the completed attendance form in the consultation ficha tab', () => {
    useIntakeDetailsQueryMock.mockReturnValue(
      createQueryResult(createDetails('consultation_completed')),
    )
    renderPage(createDetails('consultation_completed'))

    expect(screen.getByRole('link', { name: /Abrir ficha/ }).getAttribute('href')).toBe(
      '/consultas/consultation-1/ficha-atendimento',
    )
  })

  it('renders closure information and removes active actions in a terminal state', () => {
    useIntakeDetailsQueryMock.mockReturnValue(
      createQueryResult(createDetails('closed_without_contract')),
    )
    renderPage(createDetails('closed_without_contract'))

    expect(screen.getAllByText('Encerrado sem contratação').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Fora do escopo/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Encerrar sem contratação' })).toBeNull()
  })

  it('opens the closure dialog without changing the intake', () => {
    renderPage(createDetails())

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar sem contratação' }))

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('Motivo do encerramento')).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Encerrar sem contratação' }),
    ).toHaveProperty('disabled', true)
  })
})
