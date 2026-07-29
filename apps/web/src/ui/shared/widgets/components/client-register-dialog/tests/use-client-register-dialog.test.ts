import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ClientDetails } from '@hms/core/identity/domain/entities'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useClientRegisterDialog } from '../use-client-register-dialog'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

const clientDetails = {
  client: {
    id: 'client-id',
    type: 'natural',
    name: 'Maria Aparecida',
    taxId: { type: 'cpf', value: '52998224725' },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  consents: [],
} satisfies ClientDetails

describe('useClientRegisterDialog', () => {
  const identityService = {
    lookupClient: vi.fn(),
    registerClient: vi.fn(),
    getClient: vi.fn(),
    grantClientConsent: vi.fn(),
  }
  const onOpenChange = vi.fn()
  const onClientSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      identityService,
      intakeService: {},
    } as never)
  })

  it('resets on a new opening and selects an existing client', async () => {
    identityService.lookupClient.mockResolvedValue(
      new RestResponse({ body: clientDetails }),
    )
    const { result, rerender } = renderHook(
      (props: { open: boolean }) =>
        useClientRegisterDialog({ ...props, onOpenChange, onClientSelected }),
      { initialProps: { open: true } },
    )

    act(() => result.current.identificationForm.setValue('taxId', '529.982.247-25'))
    await act(async () => result.current.handleLookup())
    expect(result.current.state).toBe('existing-client')

    act(() => result.current.handleSelectExistingClient())
    expect(onClientSelected).toHaveBeenCalledWith(clientDetails)
    expect(onOpenChange).toHaveBeenCalledWith(false)

    rerender({ open: false })
    rerender({ open: true })
    expect(result.current.state).toBe('identification')
    expect(result.current.identificationForm.getValues('taxId')).toBe('')
  })

  it('creates a client without sending consent data and completes without grants', async () => {
    identityService.lookupClient.mockResolvedValue(
      new RestResponse({ statusCode: 404, errorMessage: 'not found' }),
    )
    identityService.registerClient.mockResolvedValue(
      new RestResponse({ body: clientDetails }),
    )
    const { result } = renderHook(() =>
      useClientRegisterDialog({ open: true, onOpenChange, onClientSelected }),
    )

    act(() => result.current.identificationForm.setValue('taxId', '529.982.247-25'))
    await act(async () => result.current.handleLookup())
    act(() => result.current.handleContinueToRegistration())
    act(() => result.current.registrationForm.setValue('name', 'Maria Aparecida'))
    await act(async () => result.current.handleContinueToPrivacy())
    await act(async () => result.current.handleContinueToReview())
    await act(async () => result.current.handleSubmitRegistration())

    expect(identityService.registerClient).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'natural', taxId: '52998224725' }),
    )
    expect(identityService.registerClient.mock.calls[0]?.[0]).not.toHaveProperty(
      'consents',
    )
    expect(identityService.grantClientConsent).not.toHaveBeenCalled()
    expect(onClientSelected).toHaveBeenCalledWith(clientDetails)
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('keeps the created client and retries only a failed consent', async () => {
    identityService.lookupClient.mockResolvedValue(
      new RestResponse({ statusCode: 404, errorMessage: 'not found' }),
    )
    identityService.registerClient.mockResolvedValue(
      new RestResponse({ body: clientDetails }),
    )
    identityService.grantClientConsent
      .mockResolvedValueOnce(
        new RestResponse({ statusCode: 500, errorMessage: 'temporary' }),
      )
      .mockResolvedValueOnce(
        new RestResponse({
          body: {
            id: 'consent-id',
            clientId: 'client-id',
            type: 'data_processing',
            grantedAt: new Date('2026-01-01'),
          },
        }),
      )
    const { result } = renderHook(() =>
      useClientRegisterDialog({ open: true, onOpenChange, onClientSelected }),
    )

    act(() => result.current.identificationForm.setValue('taxId', '529.982.247-25'))
    await act(async () => result.current.handleLookup())
    act(() => result.current.handleContinueToRegistration())
    act(() => {
      result.current.registrationForm.setValue('name', 'Maria Aparecida')
      result.current.registrationForm.setValue('consents.data_processing', true)
    })
    await act(async () => result.current.handleContinueToPrivacy())
    await act(async () => result.current.handleContinueToReview())
    await act(async () => result.current.handleSubmitRegistration())

    expect(identityService.registerClient).toHaveBeenCalledTimes(1)
    expect(result.current.createdClientDetails?.client.id).toBe('client-id')
    expect(onClientSelected).not.toHaveBeenCalled()

    await act(async () => result.current.handleRetryPendingConsents())
    expect(identityService.registerClient).toHaveBeenCalledTimes(1)
    expect(identityService.grantClientConsent).toHaveBeenCalledTimes(2)
    expect(onClientSelected).toHaveBeenCalled()
  })
})
