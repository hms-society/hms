import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useNewIntake } from '../use-new-intake'
import { useRegisterIntakeAction } from '@/ui/intake/hooks/use-register-intake-action'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

vi.mock('@/ui/intake/hooks/use-register-intake-action', () => ({
  useRegisterIntakeAction: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useNavigationMock = vi.mocked(useNavigation)
const useRegisterIntakeActionMock = vi.mocked(useRegisterIntakeAction)

describe('useNewIntake', () => {
  const registerIntake = vi.fn()
  const navigateTo = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    registerIntake.mockResolvedValue({})
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
    useAuthContextMock.mockReturnValue({ user: { id: 'user-id' } } as never)
    useRegisterIntakeActionMock.mockReturnValue({
      error: null,
      isRegisteringIntake: false,
      registerIntake,
    } as never)
  })

  it('registers a scheduled intake through the intake action', async () => {
    const { result } = renderHook(() => useNewIntake())

    expect(result.current.stepContent).toEqual({
      title: 'Registrar demanda',
      description: 'Informe como o cliente chegou e o assunto do atendimento.',
    })

    act(() => {
      result.current.form.setValue('legalAreaId', '47dfd634-75e9-41e4-a47e-05114f923bd0')
      result.current.form.setValue('legalTopicId', '6aa955f2-a42f-47ce-ab5f-5f0bb62a8d4d')
      result.current.form.setValue('clientId', 'client-id')
      result.current.form.setValue('lawyer', 'lawyer-id')
    })

    await act(async () => result.current.handleSubmit())

    expect(registerIntake).toHaveBeenCalledWith({
      clientId: 'client-id',
      responsibleId: 'user-id',
      origin: 'direct',
      contactChannel: 'whatsapp',
      legalAreaId: '47dfd634-75e9-41e4-a47e-05114f923bd0',
      legalTopicId: '6aa955f2-a42f-47ce-ab5f-5f0bb62a8d4d',
      urgency: 'normal',
      demandNotes: '',
      decision: 'schedule_consultation',
      assignedLawyerId: 'lawyer-id',
      startsAt: expect.any(Date),
      modality: 'virtual',
      channel: 'whatsapp_video',
    })
    expect(result.current.form.getValues('clientId')).toBe('')
    expect(navigateTo).toHaveBeenCalledWith('intakes')
  })

  it('registers an intake without legal classification', async () => {
    const { result } = renderHook(() => useNewIntake())

    act(() => {
      result.current.form.setValue('clientId', 'client-id')
      result.current.form.setValue('lawyer', 'lawyer-id')
    })

    await act(async () => result.current.handleSubmit())

    expect(registerIntake).toHaveBeenCalledWith(
      expect.not.objectContaining({
        legalAreaId: expect.anything(),
        legalTopicId: expect.anything(),
      }),
    )
  })

  it('exposes the registering state as form submission state', () => {
    useRegisterIntakeActionMock.mockReturnValue({
      error: null,
      isRegisteringIntake: true,
      registerIntake,
    } as never)

    const { result } = renderHook(() => useNewIntake())

    expect(result.current.isSubmitting).toBe(true)
  })

  it('clears client validation before entering the client step', async () => {
    const { result } = renderHook(() => useNewIntake())

    act(() => {
      result.current.form.setValue('legalAreaId', 'legal-area-id')
      result.current.form.setValue('legalTopicId', 'legal-topic-id')
      result.current.form.setError('clientId', {
        type: 'manual',
        message: 'Vincule ou cadastre uma pessoa antes de continuar',
      })
    })

    await act(async () => result.current.handleNext())

    expect(result.current.form.formState.errors.clientId).toBeUndefined()
  })

  it('keeps the form data when registration fails', async () => {
    registerIntake.mockRejectedValue(new Error('request failed'))
    const { result } = renderHook(() => useNewIntake())

    act(() => {
      result.current.form.setValue('legalAreaId', '47dfd634-75e9-41e4-a47e-05114f923bd0')
      result.current.form.setValue('legalTopicId', '6aa955f2-a42f-47ce-ab5f-5f0bb62a8d4d')
      result.current.form.setValue('clientId', 'client-id')
    })

    await act(async () => result.current.handleSubmit())

    expect(result.current.form.getValues('clientId')).toBe('client-id')
  })

  it('registers an intake closed without a contract', async () => {
    const { result } = renderHook(() => useNewIntake())

    act(() => {
      result.current.form.setValue('legalAreaId', '47dfd634-75e9-41e4-a47e-05114f923bd0')
      result.current.form.setValue('legalTopicId', '6aa955f2-a42f-47ce-ab5f-5f0bb62a8d4d')
      result.current.form.setValue('clientId', 'client-id')
      result.current.form.setValue('decision', 'close')
      result.current.form.setValue('closureReason', 'client_withdrew')
      result.current.form.setValue('closureNotes', 'Client chose not to continue')
    })

    await act(async () => result.current.handleSubmit())

    expect(registerIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'close_without_contract',
        closureReason: 'client_withdrew',
        closureNotes: 'Client chose not to continue',
      }),
    )
  })
})
