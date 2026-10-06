import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import {
  ConsultationDecision,
  ConsultationViability,
} from '@hms/core/consultation/domain/structures'
import { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { AuthUserFaker } from '@hms/core/identity/domain/structures/fakers'
import { useConsultation } from '@/ui/consultation/hooks/use-consultation'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import type { AuthContextValue } from '@/ui/shared/contexts/auth-context/types/auth-context-value'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type { FormOption } from '@/ui/shared/widgets/dynamic-form/select-form/use-select-form'
import { useAttendanceForm } from '../use-attendance-form'

vi.mock('@/ui/consultation/hooks/use-consultation', () => ({
  useConsultation: vi.fn(),
}))

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useConsultationMock = vi.mocked(useConsultation)
const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)

const consultationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const legalAreaId = '4a664059-7f45-435f-b5b3-407d8f1652b6'
const legalTopicId = 'fd56da99-08c5-4adb-b153-217872297b08'
const intakeId = '5eb2b8d8-cc84-42b3-bc64-ff40d7e9debd'

const finalizeAttendanceMock = vi.fn().mockResolvedValue(undefined)
const editAttendanceMock = vi.fn().mockResolvedValue(undefined)
const closeIntakeWithoutContractMock = vi.fn().mockResolvedValue({
  isFailure: false,
  body: {},
})
const listLegalAreasMock = vi.fn().mockResolvedValue({
  isFailure: false,
  body: [{ id: legalAreaId, name: 'Cível' }],
})
const listLegalTopicsMock = vi.fn().mockResolvedValue({
  isFailure: false,
  body: [{ id: legalTopicId, legalAreaId, name: 'Contratos' }],
})

const validConsultation = ConsultationFaker.fake({
  id: consultationId,
  intakeId,
  legalAreaId,
  legalTopicId,
  primaryLegalQuestion: 'Dúvida contratual',
  guidanceProvided: 'Orientação registrada',
  viability: ConsultationViability.Viable,
  decision: ConsultationDecision.ProceedToContracting,
})

function createConsultationController(): ReturnType<typeof useConsultation> {
  return {
    consultation: validConsultation,
    isLoading: false,
    isError: false,
    error: null,
    responsible: null,
    isMarkingNoShow: false,
    isRescheduling: false,
    isCompleting: false,
    markNoShow: vi.fn().mockResolvedValue(undefined),
    rescheduleConsultation: vi.fn().mockResolvedValue(undefined),
    completeConsultation: vi.fn().mockResolvedValue(undefined),
    completeConsultationError: null,
    finalizeAttendance: finalizeAttendanceMock,
    isFinalizingAttendance: false,
    editAttendance: editAttendanceMock,
    isEditingAttendance: false,
    editAttendanceError: null,
  }
}

function createAuthContext(): AuthContextValue {
  return {
    session: null,
    user: AuthUserFaker.fake({ id: 'user-1' }),
    isLoading: false,
    getSession: vi.fn().mockResolvedValue(null),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function createHook() {
  return renderHook(
    (props: Parameters<typeof useAttendanceForm>[0]) => useAttendanceForm(props),
    {
      initialProps: { consultationId },
      wrapper: createWrapper(),
    },
  )
}

describe('useAttendanceForm', () => {
  beforeEach(() => {
    localStorage.clear()
    window.scrollTo = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    finalizeAttendanceMock.mockReset().mockResolvedValue(undefined)
    editAttendanceMock.mockReset().mockResolvedValue(undefined)
    closeIntakeWithoutContractMock.mockReset().mockResolvedValue({
      isFailure: false,
      body: {},
    })
    listLegalAreasMock.mockReset().mockResolvedValue({
      isFailure: false,
      body: [{ id: legalAreaId, name: 'Cível' }],
    })
    listLegalTopicsMock.mockReset().mockResolvedValue({
      isFailure: false,
      body: [{ id: legalTopicId, legalAreaId, name: 'Contratos' }],
    })
    useConsultationMock.mockReturnValue(createConsultationController())
    useAuthContextMock.mockReturnValue(createAuthContext())
    useRestContextMock.mockReturnValue({
      legalCatalogService: {
        listLegalAreas: listLegalAreasMock,
        listLegalTopics: listLegalTopicsMock,
      },
      intakeService: { closeIntakeWithoutContract: closeIntakeWithoutContractMock },
    } as unknown as ReturnType<typeof useRestContext>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('loads legal catalog options and saves initial form state as a draft', async () => {
    const { result } = createHook()

    await waitFor(() => {
      expect(result.current.areasList).toEqual([{ id: legalAreaId, name: 'Cível' }])
      expect(result.current.topicsList).toEqual([
        { id: legalTopicId, legalAreaId, name: 'Contratos' },
      ])
    })
    expect(result.current.currentAreaName).toBe('Cível')
    expect(result.current.currentTopicName).toBe('Contratos')
    expect(result.current.isAttendanceFormComplete).toBe(true)
    expect(
      JSON.parse(localStorage.getItem(`consultation_draft_${consultationId}`) ?? '{}'),
    ).toMatchObject({
      legalAreaId,
      legalTopicId,
      mainLegalQuestion: 'Dúvida contratual',
    })
    expect(listLegalAreasMock).toHaveBeenCalledOnce()
    expect(listLegalTopicsMock).toHaveBeenCalledWith(legalAreaId)
  })

  it('clears the selected topic when area changes and supports adding, editing, and removing facts and claims', () => {
    const { result } = createHook()

    act(() => {
      result.current.handleChangeLegalArea('new-area')
      result.current.handleSaveFact({
        date: '17/03/2025',
        description: 'Ação ajuizada',
        status: 'Comprovado',
      })
      result.current.handleSaveClaim({ title: 'Reparação', summary: 'Danos sofridos' })
    })

    expect(result.current.legalAreaId).toBe('new-area')
    expect(result.current.legalTopicId).toBe('')
    const factId = result.current.facts[0].id
    const claimId = result.current.claims[0].id

    act(() => {
      result.current.handleSaveFact({
        id: factId,
        date: '18/03/2025',
        description: 'Ação distribuída',
        status: 'Controvertido',
      })
      result.current.handleSaveClaim({
        id: claimId,
        title: 'Reparação integral',
        summary: '',
      })
    })

    expect(result.current.facts).toEqual([
      {
        id: factId,
        date: '18/03/2025',
        description: 'Ação distribuída',
        status: 'Controvertido',
      },
    ])
    expect(result.current.claims).toEqual([
      { id: claimId, title: 'Reparação integral', summary: '' },
    ])

    act(() => {
      result.current.handleRemoveFact(factId)
      result.current.handleRemoveClaim(claimId)
    })

    expect(result.current.facts).toEqual([])
    expect(result.current.claims).toEqual([])
  })

  it('enforces close-without-contract decisions for non-viable cases and clears closure state when viability changes', () => {
    const { result } = createHook()

    act(() => {
      result.current.handleOpenClosureConfirmation()
      result.current.handleClosureReasonChange(IntakeClosureReason.Other)
      result.current.handleClosureNotesChange('Motivo detalhado')
      result.current.setViability(ConsultationViability.NotViable)
    })

    expect(result.current.decision).toBe(ConsultationDecision.CloseWithoutContract)
    expect(result.current.isClosureConfirmationOpen).toBe(true)
    expect(result.current.closureReason).toBe(IntakeClosureReason.Other)
    expect(result.current.closureNotes).toBe('Motivo detalhado')

    act(() => result.current.setViability(ConsultationViability.Viable))

    expect(result.current.decision).toBe('')
    expect(result.current.closureReason).toBe('')
    expect(result.current.closureNotes).toBe('')
    expect(result.current.closureError).toBeNull()
    act(() => result.current.setDecision(ConsultationDecision.ProceedToContracting))
    expect(result.current.decision).toBe(ConsultationDecision.ProceedToContracting)
  })

  it('clears required dynamic-field errors when an answer is supplied', async () => {
    useConsultationMock.mockReturnValue({
      ...createConsultationController(),
      consultation: ConsultationFaker.fake({
        ...validConsultation,
        dynamicFormSnapshot: {
          dynamicFormId: '11111111-1111-4111-8111-111111111111',
          name: 'Triagem',
          fields: [
            {
              id: 'required-field',
              key: 'required_field',
              label: 'Descrição do pedido',
              type: 'short_text',
              position: 1,
              required: true,
            },
          ],
        },
      }),
    })
    const { result } = createHook()

    await waitFor(() => expect(result.current.selectedFormName).toBe('Triagem'))
    expect(result.current.isAttendanceFormComplete).toBe(false)
    let isFinalized = true
    await act(async () => {
      isFinalized = await result.current.handleFinalize()
    })
    expect(isFinalized).toBe(false)
    expect(result.current.validationErrors['field:required-field']).toBe(
      'Preencha o campo obrigatório "Descrição do pedido".',
    )
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    })

    act(() =>
      result.current.handleDynamicFormAnswerChange('required-field', 'Dano material'),
    )
    expect(result.current.validationErrors['field:required-field']).toBeUndefined()
    expect(result.current.isAttendanceFormComplete).toBe(true)
  })

  it('selects a new form, updates its area and topic context, and clears prior answers', () => {
    localStorage.setItem(
      `consultation_draft_${consultationId}`,
      JSON.stringify({
        legalAreaId,
        legalTopicId,
        dynamicFormAnswers: { 'old-field': 'old answer' },
      }),
    )
    const { result } = createHook()
    const nextForm: FormOption = {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Entrevista Cível',
      legalAreaId: 'new-area',
      legalTopicIds: ['new-topic'],
      fields: [],
    }

    act(() => result.current.handleSelectForm(nextForm))

    expect(result.current.selectedForm).toEqual(nextForm)
    expect(result.current.selectedFormName).toBe('Entrevista Cível')
    expect(result.current.legalAreaId).toBe('new-area')
    expect(result.current.legalTopicId).toBe('new-topic')
    expect(result.current.dynamicFormAnswers).toEqual({})
    expect(result.current.validationErrors).toEqual({})
  })

  it('finalizes a valid attendance, removes its draft, and reports its intake', async () => {
    const onFinalized = vi.fn(() => {
      expect(localStorage.getItem(`consultation_draft_${consultationId}`)).toBeNull()
    })
    const { result } = renderHook(
      (props: Parameters<typeof useAttendanceForm>[0]) => useAttendanceForm(props),
      {
        initialProps: { consultationId, onFinalized },
        wrapper: createWrapper(),
      },
    )
    localStorage.setItem(`consultation_draft_${consultationId}`, '{"draft":true}')
    let isFinalized = false

    await act(async () => {
      isFinalized = await result.current.handleFinalize()
    })

    expect(isFinalized).toBe(true)
    expect(finalizeAttendanceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        legalAreaId,
        legalTopicId,
        primaryLegalQuestion: 'Dúvida contratual',
        guidanceProvided: 'Orientação registrada',
      }),
    )
    expect(onFinalized).toHaveBeenCalledWith({
      closedWithoutContract: false,
      intakeId,
    })
    expect(onFinalized).toHaveBeenCalledOnce()
    expect(result.current.isSubmitting).toBe(false)
  })
})
