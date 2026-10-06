import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClientFaker } from '@hms/core/identity/domain/entities/fakers'

import { useClientDetailsQuery } from '@/ui/identity/hooks/use-client-details-query'
import { useClientIntakesQuery } from '@/ui/identity/hooks/use-client-intakes-query'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'

import { useClientDetailsPage } from '../use-client-details-page'

vi.mock('@/ui/identity/hooks/use-client-details-query', () => ({
  useClientDetailsQuery: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-client-intakes-query', () => ({
  useClientIntakesQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-mask-phone', () => ({
  useMaskPhone: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-mask-tax-id', () => ({
  useMaskTaxId: vi.fn(),
}))

const useClientDetailsQueryMock = vi.mocked(useClientDetailsQuery)
const useClientIntakesQueryMock = vi.mocked(useClientIntakesQuery)
const useMaskPhoneMock = vi.mocked(useMaskPhone)
const useMaskTaxIdMock = vi.mocked(useMaskTaxId)

const client = ClientFaker.fake({ id: 'client-1', name: 'Ana Ribeiro' })
const clientDetails = { client, consents: [] }

describe('useClientDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails,
      clientDetailsError: null,
      isLoadingClientDetails: false,
    })
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    })
    useMaskPhoneMock.mockReturnValue((value = '') => `phone:${value}`)
    useMaskTaxIdMock.mockReturnValue((value = '') => `tax:${value}`)
  })

  it('passes the client id and enables intakes after details load', () => {
    const { result } = renderHook(() => useClientDetailsPage({ clientId: 'client-1' }))

    expect(useClientDetailsQueryMock).toHaveBeenCalledWith('client-1')
    expect(useClientIntakesQueryMock).toHaveBeenCalledWith('client-1', {
      enabled: true,
      throwOnFailure: false,
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('keeps the page loading while either query is loading', () => {
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: undefined,
      clientDetailsError: null,
      isLoadingClientDetails: true,
    })

    const { result, rerender } = renderHook(() =>
      useClientDetailsPage({ clientId: 'client-1' }),
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.clientData).toBeUndefined()

    useClientDetailsQueryMock.mockReturnValue({
      clientDetails,
      clientDetailsError: null,
      isLoadingClientDetails: false,
    })
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [],
      clientIntakesError: null,
      isLoadingClientIntakes: true,
    })
    rerender()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.clientData).toBeUndefined()
  })

  it('returns an error state when client details are missing or failed', () => {
    const clientError = new Error('Request failed')
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: undefined,
      clientDetailsError: clientError,
      isLoadingClientDetails: false,
    })

    const { result } = renderHook(() => useClientDetailsPage({ clientId: 'client-1' }))

    expect(result.current).toMatchObject({
      clientData: undefined,
      clientError,
      intakes: [],
      isLoading: false,
    })
  })

  it('derives natural-client identity, initials, potential status, and masks', () => {
    const { result } = renderHook(() => useClientDetailsPage({ clientId: 'client-1' }))

    expect(result.current).toMatchObject({
      displayName: 'Ana Ribeiro',
      initials: 'AR',
      status: 'Potencial',
      currentStyle: {
        badge: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
        avatar: 'bg-purple-100',
        text: 'text-purple-800',
      },
    })
    expect(result.current.maskPhone('11999999999')).toBe('phone:11999999999')
    expect(result.current.maskTaxId('12345678900')).toBe('tax:12345678900')
  })

  it('maps intake count to interested and client status styles', () => {
    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [{}] as never,
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    })

    const { result, rerender } = renderHook(() =>
      useClientDetailsPage({ clientId: 'client-1' }),
    )

    expect(result.current.status).toBe('Interessado')
    expect(result.current.currentStyle?.avatar).toBe('bg-amber-100')

    useClientIntakesQueryMock.mockReturnValue({
      clientIntakes: [{}, {}] as never,
      clientIntakesError: null,
      isLoadingClientIntakes: false,
    })
    rerender()

    expect(result.current.status).toBe('Cliente')
    expect(result.current.currentStyle?.avatar).toBe('bg-emerald-100')
  })

  it('uses a legal client trade name and falls back to its legal name', () => {
    const legalClientDetails = {
      client: ClientFaker.legal({
        id: 'company-1',
        legalName: 'Ribeiro Ltda',
        tradeName: '',
      }),
      consents: [],
    }
    useClientDetailsQueryMock.mockReturnValue({
      clientDetails: legalClientDetails,
      clientDetailsError: null,
      isLoadingClientDetails: false,
    })

    const { result } = renderHook(() => useClientDetailsPage({ clientId: 'company-1' }))

    expect(result.current.displayName).toBe('Ribeiro Ltda')
    expect(result.current.initials).toBe('RL')
  })

  it('changes the active tab through its public handler', () => {
    const { result } = renderHook(() => useClientDetailsPage({ clientId: 'client-1' }))

    act(() => result.current.handleTabChange('documentos'))

    expect(result.current.activeTab).toBe('documentos')
  })
})
