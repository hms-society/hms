import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useClientDetailsQuery } from '@/ui/identity/hooks/use-client-details-query'
import { useClientIntakesQuery } from '@/ui/identity/hooks/use-client-intakes-query'
import { useMyCasesTab } from '../use-my-cases-tab'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-client-details-query', () => ({
  useClientDetailsQuery: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-client-intakes-query', () => ({
  useClientIntakesQuery: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useClientDetailsQueryMock = vi.mocked(useClientDetailsQuery)
const useClientIntakesQueryMock = vi.mocked(useClientIntakesQuery)

describe('useMyCasesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps natural client details and passes the authenticated client id to both queries', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1', email: 'john@example.com' },
    } as never)
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: { client: { type: 'natural', name: 'John Doe' } },
      clientDetailsError: null,
      isLoadingClientDetails: false,
    } as never)
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [{ id: 'intake-1' }],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as never)

    const { result } = renderHook(() => useMyCasesTab())

    expect(result.current.clientName).toBe('John Doe')
    expect(result.current.clientIntakes).toEqual([{ id: 'intake-1' }])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(useClientDetailsQueryMock).toHaveBeenCalledWith('client-1')
    expect(useClientIntakesQueryMock).toHaveBeenCalledWith('client-1')
  })

  it('uses the legal name for a legal client', () => {
    useAuthContextMock.mockReturnValue({ user: { id: 'client-1' } } as never)
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: { client: { type: 'legal', legalName: 'Acme Corp' } },
      clientDetailsError: null,
      isLoadingClientDetails: false,
    } as never)
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as never)

    const { result } = renderHook(() => useMyCasesTab())

    expect(result.current.clientName).toBe('Acme Corp')
  })

  it('falls back to the email prefix or the default client label', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1', email: 'alex@example.com' },
    } as never)
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: null,
      clientDetailsError: null,
      isLoadingClientDetails: false,
    } as never)
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as never)

    const { result } = renderHook(() => useMyCasesTab())

    expect(result.current.clientName).toBe('alex')

    useAuthContextMock.mockReturnValue({ user: { id: 'client-1' } } as never)
    const { result: fallbackResult } = renderHook(() => useMyCasesTab())

    expect(fallbackResult.current.clientName).toBe('Cliente')
  })

  it('combines loading and errors from both query hooks', () => {
    const detailsError = new Error('details error')
    const intakesError = new Error('intakes error')
    useAuthContextMock.mockReturnValue({ user: { id: 'client-1' } } as never)
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: null,
      clientDetailsError: detailsError,
      isLoadingClientDetails: true,
    } as never)
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: intakesError,
      isLoadingClientIntakes: false,
    } as never)

    const { result } = renderHook(() => useMyCasesTab())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(detailsError)
  })
})
