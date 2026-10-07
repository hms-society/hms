import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import { ConsultationStatus } from '@hms/core/consultation/domain/structures'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { useConsultation } from '@/ui/consultation/hooks/use-consultation'
import { useConsultationDocumentSelectionQuery } from '@/ui/document-production/hooks/use-consultation-document-selection-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { ConsultationPageActionProvider } from '../consultation-page-action-context'
import { ConsultationIndexPage, ConsultationPage } from '../index'
import { useConsultationPage } from '../use-consultation-page'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

vi.mock('@/ui/consultation/hooks/use-consultation', () => ({
  useConsultation: vi.fn(),
}))

vi.mock(
  '@/ui/document-production/hooks/use-consultation-document-selection-query',
  () => ({
    useConsultationDocumentSelectionQuery: vi.fn(),
  }),
)

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

vi.mock('../use-consultation-page', () => ({
  useConsultationPage: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={`/${route}`} {...props}>
      {children}
    </a>
  ),
}))

const useConsultationMock = vi.mocked(useConsultation)
const useConsultationDocumentSelectionQueryMock = vi.mocked(
  useConsultationDocumentSelectionQuery,
)
const useNavigationMock = vi.mocked(useNavigation)
const useConsultationPageMock = vi.mocked(useConsultationPage)
type ConsultationController = ReturnType<typeof useConsultation>

const completeConsultationMock: ConsultationController['completeConsultation'] = vi
  .fn()
  .mockResolvedValue(undefined)
const navigateToMock: ReturnType<typeof useNavigation>['navigateTo'] = vi
  .fn()
  .mockResolvedValue(undefined)
const navigateCollaboratorsSearchMock: ReturnType<
  typeof useNavigation
>['navigateCollaboratorsSearch'] = vi.fn().mockResolvedValue(undefined)

function createConsultationController(
  overrides: Partial<ConsultationController> = {},
): ConsultationController {
  return {
    consultation: ConsultationFaker.fake({
      id: 'consultation-1',
      intakeId: 'intake-1',
      attendanceFinalizedAt: new Date('2026-09-20T12:00:00.000Z'),
    }),
    isLoading: false,
    isError: false,
    error: null,
    responsible: undefined,
    markNoShow: async () => undefined,
    isMarkingNoShow: false,
    rescheduleConsultation: async () => undefined,
    isRescheduling: false,
    completeConsultation: completeConsultationMock,
    isCompleting: false,
    completeConsultationError: null,
    finalizeAttendance: async () => undefined,
    isFinalizingAttendance: false,
    editAttendance: async () => undefined,
    isEditingAttendance: false,
    editAttendanceError: null,
    ...overrides,
  }
}

function createDocumentSelectionQueryResult(confirmedAt: Date | null) {
  return {
    data: {
      options: [],
      selectedDocumentSpecificationIds: [],
      confirmedAt,
    },
  } as unknown as ReturnType<typeof useConsultationDocumentSelectionQuery>
}

function renderConsultationPage() {
  return render(
    <ConsultationPageActionProvider>
      <ConsultationPage consultationId='consultation-1'>
        <p>Detalhes da consulta</p>
      </ConsultationPage>
    </ConsultationPageActionProvider>,
  )
}

describe('ConsultationPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useConsultationMock.mockReturnValue(createConsultationController())
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createDocumentSelectionQueryResult(new Date()),
    )
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateCollaboratorsSearch: navigateCollaboratorsSearchMock,
    })
    useConsultationPageMock.mockReturnValue({ activeTab: 'details' })
  })

  it('renders the children and consultation tabs with the details tab active', () => {
    renderConsultationPage()

    expect(screen.getByText('Detalhes da consulta').textContent).toBe(
      'Detalhes da consulta',
    )
    expect(
      screen.getByRole('link', { name: 'Detalhes' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(screen.getByRole('link', { name: 'Documentos' }).textContent).toContain(
      'Documentos',
    )
    expect(
      (
        screen.getByRole('button', {
          name: 'Finalizar consulta',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)
  })

  it('renders guidance when no consultation is selected', () => {
    render(<ConsultationIndexPage />)

    expect(screen.getByRole('heading', { name: 'Consulta' })).toBeDefined()
    expect(
      screen.getByText(
        'Abra uma consulta usando o endereço que contém o ID da consulta.',
      ),
    ).toBeDefined()
  })

  it('requires attendance finalization and opens confirmation before completing', async () => {
    useConsultationMock.mockReturnValue(
      createConsultationController({
        consultation: ConsultationFaker.fake({ id: 'consultation-1' }),
      }),
    )
    renderConsultationPage()

    const completeButton = screen.getByRole('button', { name: 'Finalizar consulta' })
    expect((completeButton as HTMLButtonElement).disabled).toBe(true)
    expect(completeButton.getAttribute('title')).toBe(
      'Finalize a ficha de atendimento primeiro.',
    )

    expect(screen.queryByRole('link', { name: 'Documentos' })).toBeNull()
  })

  it('keeps document selection and consultation completion disabled until the package is confirmed', () => {
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createDocumentSelectionQueryResult(null),
    )

    renderConsultationPage()

    const completeButton = screen.getByRole('button', { name: 'Finalizar consulta' })
    expect((completeButton as HTMLButtonElement).disabled).toBe(true)
    expect(completeButton.getAttribute('title')).toBe(
      'Confirme o pacote de documentos primeiro.',
    )
    expect(screen.getByRole('link', { name: 'Documentos' })).toBeDefined()
  })

  it('shows a disabled document tab for an intake closed without a contract', () => {
    const consultation = Object.assign(
      ConsultationFaker.fake({
        id: 'consultation-1',
        attendanceFinalizedAt: new Date('2026-09-20T12:00:00.000Z'),
      }),
      { intake: { status: IntakeStatus.ClosedWithoutContract } },
    )
    useConsultationMock.mockReturnValue(createConsultationController({ consultation }))

    renderConsultationPage()

    const documentsTab = screen.getByText('Documentos').parentElement
    expect(documentsTab?.getAttribute('aria-disabled')).toBe('true')
    expect(documentsTab?.getAttribute('title')).toBe(
      'Documentos não disponíveis para consultas encerradas sem contratação.',
    )
    expect(screen.queryByRole('link', { name: 'Documentos' })).toBeNull()
  })

  it('hides the completion action when the consultation has not been loaded', () => {
    useConsultationMock.mockReturnValue(
      createConsultationController({ consultation: undefined }),
    )

    renderConsultationPage()

    expect(screen.queryByRole('button', { name: 'Finalizar consulta' })).toBeNull()
    expect(useConsultationDocumentSelectionQueryMock).toHaveBeenCalledWith(
      'consultation-1',
      { enabled: false },
    )
  })

  it('shows the pending completion state and disables the primary action', () => {
    useConsultationMock.mockReturnValue(
      createConsultationController({
        consultation: ConsultationFaker.fake({
          id: 'consultation-1',
          intakeId: 'intake-1',
          attendanceFinalizedAt: new Date('2026-09-20T12:00:00.000Z'),
        }),
        isCompleting: true,
      }),
    )

    renderConsultationPage()

    const completeButton = screen.getByRole('button', { name: 'Finalizando...' })
    expect((completeButton as HTMLButtonElement).disabled).toBe(true)
    expect(completeButton.getAttribute('aria-busy')).toBe('true')
  })

  it('marks an already completed consultation as unavailable for completion', () => {
    useConsultationMock.mockReturnValue(
      createConsultationController({
        consultation: ConsultationFaker.fake({
          id: 'consultation-1',
          status: 'completed',
          attendanceFinalizedAt: new Date('2026-09-20T12:00:00.000Z'),
        }),
      }),
    )

    renderConsultationPage()

    const completeButton = screen.getByRole('button', { name: 'Consulta finalizada' })
    expect((completeButton as HTMLButtonElement).disabled).toBe(true)
    expect(completeButton.getAttribute('title')).toBe('A consulta já foi finalizada.')
  })

  it('disables completion for a consultation that is no longer pending', () => {
    useConsultationMock.mockReturnValue(
      createConsultationController({
        consultation: ConsultationFaker.fake({
          id: 'consultation-1',
          status: ConsultationStatus.NoShow,
          attendanceFinalizedAt: new Date('2026-09-20T12:00:00.000Z'),
        }),
      }),
    )

    renderConsultationPage()

    const completeButton = screen.getByRole('button', { name: 'Finalizar consulta' })
    expect((completeButton as HTMLButtonElement).disabled).toBe(true)
    expect(completeButton.getAttribute('title')).toBe('A consulta não está pendente.')
  })

  it('displays a completion error inside the confirmation dialog', () => {
    useConsultationMock.mockReturnValue(
      createConsultationController({
        consultation: ConsultationFaker.fake({
          id: 'consultation-1',
          intakeId: 'intake-1',
          attendanceFinalizedAt: new Date('2026-09-20T12:00:00.000Z'),
        }),
        completeConsultationError: new Error('Não foi possível finalizar a consulta.'),
      }),
    )

    renderConsultationPage()
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar consulta' }))

    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível finalizar a consulta.',
    )
  })

  it('completes a confirmed consultation and navigates to its intake', async () => {
    renderConsultationPage()

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar consulta' }))
    const confirmationDialog = screen.getByRole('alertdialog')
    fireEvent.click(
      within(confirmationDialog).getByRole('button', {
        name: 'Finalizar consulta',
      }),
    )

    await waitFor(() => expect(completeConsultationMock).toHaveBeenCalledOnce())
    expect(navigateToMock).toHaveBeenCalledWith('intakeDetails', {
      params: { intakeId: 'intake-1' },
    })
  })
})
