import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useCreateCaseSubmission } from '../use-create-case-submission'

const mocks = vi.hoisted(() => ({
  createLegalCase: vi.fn(),
  navigate: vi.fn(),
  errorToast: vi.fn(),
  successToast: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: mocks.navigate }),
}))
vi.mock('sonner', () => ({
  toast: { error: mocks.errorToast, success: mocks.successToast },
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useRestContextMock = vi.mocked(useRestContext)
const manager = {
  collaboratorId: '00000000-0000-4000-8000-000000000014',
  professionalName: 'Maria Oliveira',
  email: 'maria@example.test',
  profile: CollaboratorProfile.Lawyer,
  status: UserStatus.Active,
}
const caseData: CreateCaseData = {
  title: 'Case title',
  intakeId: '00000000-0000-4000-8000-000000000011',
  legalAreaId: '00000000-0000-4000-8000-000000000012',
  legalTopicId: '00000000-0000-4000-8000-000000000013',
  description: '',
  initialManagerCollaboratorId: '00000000-0000-4000-8000-000000000014',
  team: [],
  operationId: '00000000-0000-4000-8000-000000000015',
}

function renderSubmission() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return {
    ...renderHook(() => useCreateCaseSubmission(), { wrapper }),
    queryClient,
  }
}

describe('useCreateCaseSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      caseManagementService: { createLegalCase: mocks.createLegalCase },
    } as never)
    mocks.createLegalCase.mockResolvedValue({ isFailure: false, body: { id: 'case-1' } })
  })

  it('requires an intake and a matching active lawyer manager before calling REST', async () => {
    const { result, queryClient } = renderSubmission()

    await act(async () => {
      await result.current.onSubmit({ ...caseData, intakeId: '' } as never, manager)
      await result.current.onSubmit(caseData, {
        ...manager,
        profile: CollaboratorProfile.Paralegal,
      } as never)
      await result.current.onSubmit(caseData, {
        ...manager,
        status: UserStatus.Disabled,
      } as never)
      await result.current.onSubmit(
        { ...caseData, initialManagerCollaboratorId: 'different-id' } as never,
        manager,
      )
    })

    expect(mocks.createLegalCase).not.toHaveBeenCalled()
    expect(mocks.errorToast).toHaveBeenCalledWith(
      'Este cliente não possui uma triagem (Intake) disponível para abertura de caso.',
    )
    expect(mocks.errorToast).toHaveBeenCalledWith(
      'Selecione um Advogado ativo como Gestor inicial do caso.',
    )
    queryClient.clear()
  })

  it('creates the case with a stable retry operation id and navigates on success', async () => {
    const { result, queryClient } = renderSubmission()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await act(async () => {
      await result.current.onSubmit(caseData, manager)
      await result.current.onSubmit(caseData, manager)
    })

    const firstRequest = mocks.createLegalCase.mock.calls[0][0]
    const retryRequest = mocks.createLegalCase.mock.calls[1][0]
    expect(firstRequest).toMatchObject({
      title: 'Case title',
      intakeId: '00000000-0000-4000-8000-000000000011',
      initialManagerCollaboratorId: manager.collaboratorId,
    })
    expect(firstRequest.operationId).not.toBe('form-operation-id')
    expect(retryRequest.operationId).toBe(firstRequest.operationId)
    expect(mocks.successToast).toHaveBeenCalledTimes(2)
    expect(mocks.navigate).toHaveBeenCalledWith('lawyerCases')
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['case-management', 'my-cases'],
    })
    queryClient.clear()
  })

  it('shows the REST failure and does not navigate when creation fails', async () => {
    mocks.createLegalCase.mockResolvedValue({
      isFailure: true,
      throwError: () => {
        throw new Error('Intake already used')
      },
    })
    const { result, queryClient } = renderSubmission()

    await act(async () => result.current.onSubmit(caseData, manager))

    expect(mocks.errorToast).toHaveBeenCalledWith('Intake already used')
    expect(mocks.successToast).not.toHaveBeenCalled()
    expect(mocks.navigate).not.toHaveBeenCalled()
    queryClient.clear()
  })
})
