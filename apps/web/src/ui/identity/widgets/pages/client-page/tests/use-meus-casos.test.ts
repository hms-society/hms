import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useClientDetailsQuery } from '../use-client-details-query'
import { useClientIntakesQuery } from '../use-client-intakes-query'
import { useMeusCasos } from '../use-meus-casos'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('../use-client-details-query', () => ({
  useClientDetailsQuery: vi.fn(),
}))

vi.mock('../use-client-intakes-query', () => ({
  useClientIntakesQuery: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useClientDetailsQueryMock = vi.mocked(useClientDetailsQuery)
const useClientIntakesQueryMock = vi.mocked(useClientIntakesQuery)

describe('useMeusCasos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns clientName from clientDetails (natural person) and maps state flags', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1', email: 'john@example.com' },
    } as any)

    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: { client: { type: 'natural', name: 'John Doe' } },
      clientDetailsError: null,
      isLoadingClientDetails: false,
    } as any)

    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [{ id: 'intake-1' }],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as any)

    const { result } = renderHook(() => useMeusCasos())

    expect(result.current.clientName).toBe('John Doe')
    expect(result.current.clientIntakes).toEqual([{ id: 'intake-1' }])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns clientName from clientDetails (legal entity)', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1', email: 'acme@example.com' },
    } as any)

    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: { client: { type: 'legal', legalName: 'Acme Corp' } },
      clientDetailsError: null,
      isLoadingClientDetails: false,
    } as any)

    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as any)

    const { result } = renderHook(() => useMeusCasos())

    expect(result.current.clientName).toBe('Acme Corp')
  })

  it('uses email prefix as fallback clientName when clientDetails is not loaded', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1', email: 'alex@example.com' },
    } as any)

    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: null,
      clientDetailsError: null,
      isLoadingClientDetails: false,
    } as any)

    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as any)

    const { result } = renderHook(() => useMeusCasos())

    expect(result.current.clientName).toBe('alex')
  })

  it('combines loading state', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1' },
    } as any)

    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: null,
      clientDetailsError: null,
      isLoadingClientDetails: true,
    } as any)

    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as any)

    const { result } = renderHook(() => useMeusCasos())

    expect(result.current.isLoading).toBe(true)
  })

  it('combines errors', () => {
    useAuthContextMock.mockReturnValue({
      user: { id: 'client-1' },
    } as any)

    const detailError = new Error('details error')
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: null,
      clientDetailsError: detailError,
      isLoadingClientDetails: false,
    } as any)

    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    } as any)

    const { result } = renderHook(() => useMeusCasos())

    expect(result.current.error).toBe(detailError)
  })
})
