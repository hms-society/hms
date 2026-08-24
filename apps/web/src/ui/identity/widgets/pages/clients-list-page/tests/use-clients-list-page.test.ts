import { act, renderHook } from '@testing-library/react'
import type { MouseEvent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useClientsQuery } from '@/ui/identity/hooks/use-clients-query'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useClientsListPage } from '../use-clients-list-page'

vi.mock('@/ui/identity/hooks/use-clients-query', () => ({
  useClientsQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-mask-phone', () => ({
  useMaskPhone: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-mask-tax-id', () => ({
  useMaskTaxId: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useClientsQueryMock = vi.mocked(useClientsQuery)
const useMaskPhoneMock = vi.mocked(useMaskPhone)
const useMaskTaxIdMock = vi.mocked(useMaskTaxId)
const useNavigationMock = vi.mocked(useNavigation)

describe('useClientsListPage', () => {
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useClientsQueryMock.mockReturnValue({
      clientsPage: {
        data: [
          {
            client: {
              id: 'client-1',
              name: 'Ana Ribeiro',
              status: 'Cliente',
              taxId: { value: '12345678900' },
              phone: '11999999999',
            },
            intakeCount: 2,
            latestOrigin: 'direct',
          },
        ],
        total: 1,
      },
      clientsPageError: null,
      isLoadingClients: false,
    } as never)
    useMaskPhoneMock.mockReturnValue((value = '') => `phone:${value}`)
    useMaskTaxIdMock.mockReturnValue((value = '') => `tax:${value}`)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('maps query data to client table rows', () => {
    const { result } = renderHook(() => useClientsListPage())

    expect(useClientsQueryMock).toHaveBeenCalledWith({ page: 1, limit: 20, search: '' })
    expect(result.current.clients[0]).toMatchObject({
      displayName: 'Ana Ribeiro',
      displayOrigin: 'Direta HMS',
      initials: 'AR',
      intakesCount: 2,
    })
    expect(result.current.maskPhone('11999999999')).toBe('phone:11999999999')
    expect(result.current.maskTaxId('12345678900')).toBe('tax:12345678900')
  })

  it('resets the page when searching and navigates when selecting a client', () => {
    const { result } = renderHook(() => useClientsListPage())

    act(() => {
      result.current.handleSearchChange('Ana')
      result.current.handleClientSelect('client-1')
    })

    expect(result.current.search).toBe('Ana')
    expect(result.current.page).toBe(1)
    expect(navigateTo).toHaveBeenCalledWith('clientDetails', {
      params: { clienteId: 'client-1' },
    })
    expect(useClientsQueryMock).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      search: 'Ana',
    })
  })

  it('opens and closes the client registration dialog', () => {
    const { result } = renderHook(() => useClientsListPage())

    expect(result.current.isClientRegisterDialogOpen).toBe(false)

    act(() => result.current.handleOpenClientRegisterDialog())
    expect(result.current.isClientRegisterDialogOpen).toBe(true)

    act(() => result.current.handleClientRegisterDialogOpenChange(false))
    expect(result.current.isClientRegisterDialogOpen).toBe(false)
  })

  it('moves between pages within the available range', () => {
    useClientsQueryMock.mockReturnValue({
      clientsPage: { data: [], total: 41 },
      clientsPageError: null,
      isLoadingClients: false,
    } as never)

    const { result } = renderHook(() => useClientsListPage())
    const preventDefault = vi.fn()
    const event = { preventDefault } as unknown as MouseEvent

    act(() => result.current.handleNextPage(event))
    expect(result.current.page).toBe(2)

    act(() => result.current.handlePreviousPage(event))
    expect(result.current.page).toBe(1)
    expect(preventDefault).toHaveBeenCalledTimes(2)
  })
})
