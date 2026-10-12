import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { useCreateCasePage } from '../use-create-case-page'

const mocks = vi.hoisted(() => ({
  suggestedManager: null as any,
  createCase: vi.fn(),
  selectedIntakeQueryFn: undefined as (() => Promise<unknown>) | undefined,
  selectedIntakeDetails: null as any,
  legalTopics: [] as { id: string; name: string }[],
  intakeResponse: { isFailure: false, body: {} } as any,
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/ui/case-management/hooks/use-create-case-action', () => ({
  useCreateCaseAction: () => ({
    createCase: mocks.createCase,
    isCreatingCase: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-case-opening-source-query', () => ({
  useCaseOpeningSourceQuery: (intakeId: string) => ({
    caseOpeningSource: intakeId
      ? { intakeId, suggestedManager: mocks.suggestedManager }
      : null,
    caseOpeningSourceError: null,
    isLoadingCaseOpeningSource: false,
  }),
}))
vi.mock('@/ui/intake/hooks/use-intakes-list-query', () => ({
  useIntakesListQuery: () => ({ data: { items: [] }, isLoading: false }),
}))
vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query',
  () => ({ useLegalAreasQuery: () => ({ legalAreas: [] }) }),
)
vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query',
  () => ({ useLegalTopicsQuery: () => ({ legalTopics: mocks.legalTopics }) }),
)
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    intakeService: { getIntake: vi.fn(async () => mocks.intakeResponse) },
  }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({
    queryFn,
    enabled,
  }: {
    queryFn: () => Promise<unknown>
    enabled: boolean
  }) => {
    if (enabled) mocks.selectedIntakeQueryFn = queryFn
    return { data: mocks.selectedIntakeDetails }
  },
}))

const suggested = {
  collaboratorId: '00000000-0000-4000-8000-000000000001',
  professionalName: 'Advogada da triagem',
  email: 'sugerida@example.test',
  profile: CollaboratorProfile.Lawyer,
  status: UserStatus.Active,
}
const chosen = {
  collaboratorId: '00000000-0000-4000-8000-000000000002',
  professionalName: 'Advogada escolhida',
  email: 'escolhida@example.test',
  profile: CollaboratorProfile.Lawyer,
  status: UserStatus.Active,
}

describe('useCreateCasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.suggestedManager = suggested
    mocks.intakeResponse = { isFailure: false, body: {} }
    mocks.selectedIntakeQueryFn = undefined
    mocks.selectedIntakeDetails = null
    mocks.legalTopics = []
  })

  it('preselects the active lawyer suggested by the selected Intake', async () => {
    const { result } = renderHook(() => useCreateCasePage())

    act(() =>
      result.current.form.setValue('intakeId', '00000000-0000-4000-8000-000000000010'),
    )

    await waitFor(() => {
      expect(result.current.initialManager).toEqual(suggested)
      expect(result.current.form.getValues('initialManagerCollaboratorId')).toBe(
        suggested.collaboratorId,
      )
    })
  })

  it('keeps an explicit manager choice over the Intake suggestion', async () => {
    const { result } = renderHook(() => useCreateCasePage())

    act(() =>
      result.current.form.setValue('intakeId', '00000000-0000-4000-8000-000000000010'),
    )
    await waitFor(() => expect(result.current.initialManager).toEqual(suggested))
    act(() => result.current.handleInitialManagerSelect(chosen))

    expect(result.current.initialManager).toEqual(chosen)
    expect(result.current.form.getValues('initialManagerCollaboratorId')).toBe(
      chosen.collaboratorId,
    )
  })

  it('copies legal area and a topic belonging to that area from the selected intake', async () => {
    mocks.selectedIntakeDetails = { legalAreaId: 'area-1', legalTopicId: 'topic-1' }
    mocks.legalTopics = [{ id: 'topic-1', name: 'Contratos' }]
    const { result } = renderHook(() => useCreateCasePage())
    act(() =>
      result.current.form.setValue('intakeId', '00000000-0000-4000-8000-000000000010'),
    )
    await waitFor(() => expect(mocks.selectedIntakeQueryFn).toBeTypeOf('function'))

    await act(async () => {
      await mocks.selectedIntakeQueryFn?.()
    })
    expect(mocks.intakeResponse.body).toEqual({})
    await waitFor(() => {
      expect(result.current.form.getValues('legalAreaId')).toBe('area-1')
      expect(result.current.form.getValues('legalTopicId')).toBe('topic-1')
    })
    expect(result.current.form.getValues('legalAreaId')).toBe('area-1')
    expect(result.current.form.getValues('legalTopicId')).toBe('topic-1')
  })

  it('does not copy an intake topic that is outside the selected legal-area options', async () => {
    mocks.selectedIntakeDetails = { legalAreaId: 'area-1', legalTopicId: 'other-topic' }
    const { result } = renderHook(() => useCreateCasePage())
    act(() => {
      result.current.form.setValue('legalTopicId', 'existing-topic')
      result.current.form.setValue('intakeId', '00000000-0000-4000-8000-000000000010')
    })

    await waitFor(() =>
      expect(result.current.form.getValues('legalAreaId')).toBe('area-1'),
    )
    expect(result.current.form.getValues('legalTopicId')).toBe('existing-topic')
  })

  it('rejects a failed selected-intake lookup with a readable error', async () => {
    mocks.intakeResponse = { isFailure: true, body: {} }
    const { result } = renderHook(() => useCreateCasePage())
    act(() =>
      result.current.form.setValue('intakeId', '00000000-0000-4000-8000-000000000010'),
    )
    await waitFor(() => expect(mocks.selectedIntakeQueryFn).toBeTypeOf('function'))
    await expect(mocks.selectedIntakeQueryFn?.()).rejects.toThrow(
      'Falha ao buscar triagem',
    )
  })

  it('resets the initial manager when another intake is selected', () => {
    const { result } = renderHook(() => useCreateCasePage())
    act(() => result.current.handleInitialManagerSelect(chosen))
    act(() => result.current.handleIntakeSelect('another-intake', vi.fn()))

    expect(result.current.initialManager).toBeNull()
    expect(result.current.form.getValues('initialManagerCollaboratorId')).toBe('')
  })

  it('rejects duplicate team members and keeps unique selections in roster order', () => {
    const { result } = renderHook(() => useCreateCasePage())
    act(() => result.current.handleInitialManagerSelect(chosen))
    act(() => result.current.handleTeamMemberSelect(suggested, 'collaborator'))
    act(() => result.current.handleTeamMemberSelect(suggested, 'manager'))
    act(() => result.current.handleTeamMemberSelect(chosen, 'collaborator'))

    expect(result.current.fields).toHaveLength(1)
    expect(result.current.teamMemberDetails).toEqual([suggested])
  })

  it('removes a roster member and closes either selector', () => {
    const { result } = renderHook(() => useCreateCasePage())
    act(() => result.current.handleTeamMemberSelect(suggested, 'collaborator'))
    act(() => result.current.handleRemoveTeamMember(0))
    act(() => {
      result.current.handleInitialManagerSelectorClose()
      result.current.handleTeamSelectorClose()
    })

    expect(result.current.fields).toHaveLength(0)
    expect(result.current.teamMemberDetails).toHaveLength(0)
    expect(result.current.isManagerSelectorOpen).toBe(false)
    expect(result.current.isTeamSelectorOpen).toBe(false)
  })

  it('submits only when intake and selected manager are valid, then navigates on success', async () => {
    mocks.createCase.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCreateCasePage())
    const data = {
      title: 'Case title',
      intakeId: 'intake-1',
      legalAreaId: 'area-1',
      legalTopicId: 'topic-1',
      description: '',
      initialManagerCollaboratorId: chosen.collaboratorId,
      team: [],
      operationId: 'form-operation-id',
    } as any

    act(() => result.current.handleInitialManagerSelect(chosen))
    await act(async () => result.current.onSubmit({ ...data, intakeId: '' }))
    act(() => result.current.handleIntakeSelect(data.intakeId, vi.fn()))
    await act(async () => result.current.onSubmit(data))
    expect(mocks.createCase).not.toHaveBeenCalled()

    act(() => result.current.handleInitialManagerSelect(chosen))
    await act(async () => result.current.onSubmit(data))
    expect(mocks.createCase).toHaveBeenCalledWith(
      expect.objectContaining({
        title: data.title,
        intakeId: data.intakeId,
        operationId: expect.any(String),
      }),
    )
    expect(mocks.navigate).toHaveBeenCalledWith({ to: expect.any(String) })
  })

  it('reuses an operation id for retries and reports known and unknown submission failures', async () => {
    const { result } = renderHook(() => useCreateCasePage())
    const data = {
      title: 'Case title',
      intakeId: 'intake-1',
      legalAreaId: 'area-1',
      legalTopicId: 'topic-1',
      description: '',
      initialManagerCollaboratorId: chosen.collaboratorId,
      team: [],
      operationId: 'form-operation-id',
    } as any
    mocks.createCase.mockRejectedValueOnce(new Error('known failure'))
    mocks.createCase.mockRejectedValueOnce('unknown failure')
    act(() => result.current.handleInitialManagerSelect(chosen))

    await act(async () => result.current.onSubmit(data))
    await act(async () => result.current.onSubmit(data))

    const firstCall = mocks.createCase.mock.calls[0][0]
    const secondCall = mocks.createCase.mock.calls[1][0]
    expect(firstCall.operationId).toBe(secondCall.operationId)
    expect(mocks.navigate).not.toHaveBeenCalled()
  })
})
