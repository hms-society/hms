import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useIntakeResponsiblesQuery } from '@/ui/intake/hooks/use-intake-responsibles-query'
import { useLegalAreasQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query'
import { useLegalTopicsQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query'

import { IntakeEditDialog } from '..'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/intake/hooks/use-intake-responsibles-query', () => ({
  useIntakeResponsiblesQuery: vi.fn(),
}))

vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query',
  () => ({
    useLegalAreasQuery: vi.fn(),
  }),
)

vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query',
  () => ({
    useLegalTopicsQuery: vi.fn(),
  }),
)

const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)
const useIntakeResponsiblesQueryMock = vi.mocked(useIntakeResponsiblesQuery)
const useLegalAreasQueryMock = vi.mocked(useLegalAreasQuery)
const useLegalTopicsQueryMock = vi.mocked(useLegalTopicsQuery)

describe('IntakeEditDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthContextMock.mockReturnValue({ user: { id: 'user-id' } } as never)
    useIntakeResponsiblesQueryMock.mockReturnValue({
      data: [{ responsibleId: 'responsible-id', professionalName: 'Hudson Marcelo' }],
      isLoading: false,
      error: null,
    } as never)
    useLegalAreasQueryMock.mockReturnValue({
      legalAreas: [{ id: 'area-id', name: 'Cível', active: true }],
      legalAreasError: null,
      isLoadingLegalAreas: false,
    } as never)
    useLegalTopicsQueryMock.mockReturnValue({
      legalTopics: [{ id: 'topic-id', legalAreaId: 'area-id', name: 'Contratos' }],
      legalTopicsError: null,
      isLoadingLegalTopics: false,
    } as never)
  })

  it('renders all editable intake fields and keeps saving disabled until a change', () => {
    const intake = IntakeFaker.fake({
      responsibleId: 'responsible-id',
      legalAreaId: 'area-id',
      legalTopicId: 'topic-id',
    })
    useRestContextMock.mockReturnValue({ intakeService: {} } as never)

    renderDialog(intake)

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByLabelText('Demanda')).toBeDefined()
    expect(screen.getByLabelText('Origem')).toBeDefined()
    expect(screen.getByLabelText('Canal de contato')).toBeDefined()
    expect(screen.getByLabelText('Urgência')).toBeDefined()
    expect(screen.getByLabelText('Atendente')).toBeDefined()
    expect(screen.getByLabelText('Área jurídica')).toBeDefined()
    expect(screen.getByLabelText('Assunto jurídico')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('submits the edited fields through the intake service', async () => {
    const intake = IntakeFaker.fake({
      responsibleId: 'responsible-id',
      legalAreaId: 'area-id',
      legalTopicId: 'topic-id',
    })
    const updatedIntake = { ...intake, demandNotes: 'Demanda revisada' }
    const updateIntake = vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: updatedIntake }))
    const onOpenChange = vi.fn()
    useRestContextMock.mockReturnValue({ intakeService: { updateIntake } } as never)

    renderDialog(intake, onOpenChange)
    fireEvent.change(screen.getByLabelText('Demanda'), {
      target: { value: 'Demanda revisada' },
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Salvar alterações' })).toHaveProperty(
        'disabled',
        false,
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(updateIntake).toHaveBeenCalledOnce())
    expect(updateIntake).toHaveBeenCalledWith(
      intake.id,
      expect.objectContaining({
        expectedVersion: intake.version,
        updatedBy: 'user-id',
        demandNotes: 'Demanda revisada',
      }),
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})

function renderDialog(
  intake: ReturnType<typeof IntakeFaker.fake>,
  onOpenChange = vi.fn(),
) {
  const queryClient = new QueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <IntakeEditDialog open intake={intake} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
}
