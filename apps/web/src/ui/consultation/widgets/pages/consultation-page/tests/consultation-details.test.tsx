import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConsultationDetails } from '../consultation-details'
import { useConsultation } from '@/ui/consultation/hooks/use-consultation'

vi.mock('@/ui/consultation/hooks/use-consultation', () => ({
  useConsultation: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({
    children,
    params,
    ...props
  }: {
    children: ReactNode
    params?: { intakeId?: string }
  }) => (
    <a href={`/intakes/${params?.intakeId ?? ''}`} {...props}>
      {children}
    </a>
  ),
}))

const useConsultationMock = vi.mocked(useConsultation)

const handleMarkNoShow = vi.fn().mockResolvedValue(undefined)
const handleRescheduleConsultation = vi.fn().mockResolvedValue(undefined)
const handleContinueForm = vi.fn()

type ControllerOverrides = Partial<ReturnType<typeof useConsultation>>

let controllerOverrides: ControllerOverrides = {}

function useConsultationTestController(): ReturnType<typeof useConsultation> {
  return {
    consultation: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      status: 'pending',
      createdAt: '2026-08-06T20:10:31.107Z',
      startedAt: '2026-08-11T00:27:28.675Z',
      modality: 'PRESENTIAL',
      primaryLegalQuestion: 'Se o patrão ainda tem funcionários',
      assignedLawyer: {
        id: '28723a68-d073-43b3-aa34-54b84d98f925',
        name: 'Advogado de desenvolvimento',
      },
      intake: {
        id: '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
        code: 'INT-0014',
        origin: 'website',
        contactChannel: 'phone',
        urgency: 'urgent',
        demandNotes: 'Caso sobre atropelamento',
      },
      client: {
        id: 'a97f1adf-335c-4ea8-817b-09e7f8446b3d',
        name: 'Morris Lemke',
        taxIdType: 'cpf',
        taxIdValue: '03737829420',
        phone: '1-924-844-6535',
        email: 'Austen.Lebsack@yahoo.com',
        city: 'São José dos Campos',
        state: 'SP',
      },
    } as any,
    responsible: {
      id: 'e861ad41-bc88-4650-a716-8dd6d7c20d54',
      professionalName: 'Maria Atendente',
    } as any,
    isLoading: false,
    isError: false,
    error: null,
    isMarkingNoShow: false,
    isRescheduling: false,
    isCompleting: false,
    markNoShow: handleMarkNoShow,
    rescheduleConsultation: handleRescheduleConsultation,
    completeConsultation: vi.fn(),
    finalizeAttendance: vi.fn(),
    isFinalizingAttendance: false,
    editAttendance: vi.fn(),
    isEditingAttendance: false,
    editAttendanceError: null,
    ...controllerOverrides,
    completeConsultationError: controllerOverrides.completeConsultationError ?? null,
  }
}

function renderConsultationDetailsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ConsultationDetails
        consultationId='a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        onContinueForm={handleContinueForm}
      />
    </QueryClientProvider>,
  )
}

describe('ConsultationDetails', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    controllerOverrides = {}
    useConsultationMock.mockImplementation(useConsultationTestController)
  })

  it('renders consultation details and resolves attendant name from responsible', () => {
    renderConsultationDetailsPage()

    expect(screen.getByRole('heading', { name: 'Morris Lemke' })).toBeTruthy()
    expect(screen.getByText('03737829420')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'INT-0014' }).getAttribute('href')).toBe(
      '/intakes/5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd',
    )
    expect(screen.getByText('Maria Atendente')).toBeTruthy()
    expect(screen.getByText('Advogado de desenvolvimento')).toBeTruthy()
  })

  it('renders "Não informado" when no attendant/responsible is assigned', () => {
    controllerOverrides = {
      responsible: undefined,
    }

    renderConsultationDetailsPage()

    expect(screen.getByText('Não informado')).toBeTruthy()
  })

  it('delegates continue form navigation action', () => {
    renderConsultationDetailsPage()

    fireEvent.click(screen.getByRole('button', { name: /Continuar ficha/i }))
    expect(handleContinueForm).toHaveBeenCalledOnce()
  })

  it('delegates mark no-show action', () => {
    renderConsultationDetailsPage()

    fireEvent.click(screen.getByRole('button', { name: /Marcar ausência/i }))

    expect(handleMarkNoShow).toHaveBeenCalledWith('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
  })
})
