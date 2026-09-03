import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppError } from '@hms/core/shared/domain/errors'

import { RestContext, RestContextProvider } from '../index'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const { getSessionMock, navigateToMock, restClient, signOutMock } = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  }

  return {
    getSessionMock: vi.fn(),
    navigateToMock: vi.fn(),
    restClient: client,
    signOutMock: vi.fn(),
  }
})

vi.mock('@/rest/axios/axios-rest-client', () => ({
  AxiosRestClient: vi.fn(() => restClient),
}))

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: () => ({
    getSession: getSessionMock,
    signOut: signOutMock,
  }),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

describe('RestContext', () => {
  it('throws when the consumer is outside the provider', () => {
    expect(() =>
      renderHook(() => useRestContext(), {
        wrapper: ({ children }) => (
          <RestContext.Provider value={null}>{children}</RestContext.Provider>
        ),
      }),
    ).toThrow(AppError)
  })

  it('registers the consultation document service with the shared authenticated client', async () => {
    const { result } = renderHook(() => useRestContext(), {
      wrapper: ({ children }) => <RestContextProvider>{children}</RestContextProvider>,
    })

    restClient.get.mockResolvedValue({})

    await result.current.consultationDocumentProductionService.listDocuments(
      'consultation-id',
    )

    expect(restClient.get).toHaveBeenCalledWith(
      '/consultations/consultation-id/documents',
    )
  })

  it('registers the formalization service with the same authenticated client', async () => {
    const { result } = renderHook(() => useRestContext(), {
      wrapper: ({ children }) => <RestContextProvider>{children}</RestContextProvider>,
    })

    restClient.post.mockResolvedValue({})

    await result.current.formalizationService.startByIntake('intake-1')

    expect(restClient.post).toHaveBeenCalledWith(
      '/formalizations/by-intake/intake-1/start',
    )
  })
})
