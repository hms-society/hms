import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useClientFilterDialog } from '../use-client-filter-dialog'
import { ClientFilterDialog } from '../index'

vi.mock('../use-client-filter-dialog', () => ({
  useClientFilterDialog: vi.fn(),
}))

const useClientFilterDialogMock = vi.mocked(useClientFilterDialog)

describe('ClientFilterDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClientFilterDialogMock.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      draftClientId: undefined,
      setDraftClientId: vi.fn(),
      options: [
        { id: 'client-1', name: 'Mariana Costa' },
        { id: 'client-2', name: 'João Silva' },
      ],
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isScanLimitReached: false,
      loadMore: vi.fn(),
      apply: vi.fn(),
      clearSearch: vi.fn(),
    })
  })

  it('selects a client and applies the filter', () => {
    const onApply = vi.fn()
    const onOpenChange = vi.fn()

    render(<ClientFilterDialog open onApply={onApply} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByRole('option', { name: /Mariana Costa/ }))
    expect(
      useClientFilterDialogMock.mock.results[0]?.value.setDraftClientId,
    ).toHaveBeenCalledWith('client-1')

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }))
    expect(useClientFilterDialogMock.mock.results[0]?.value.apply).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exposes the empty and error feedback states', () => {
    useClientFilterDialogMock.mockReturnValueOnce({
      search: '',
      setSearch: vi.fn(),
      draftClientId: undefined,
      setDraftClientId: vi.fn(),
      options: [],
      isLoading: false,
      isError: true,
      hasNextPage: false,
      isScanLimitReached: false,
      loadMore: vi.fn(),
      apply: vi.fn(),
      clearSearch: vi.fn(),
    })

    render(<ClientFilterDialog open onApply={vi.fn()} onOpenChange={vi.fn()} />)

    expect(screen.getByRole('alert').textContent).toContain('Não foi possível carregar')
    expect(screen.getByText('0 clientes encontrados')).toBeDefined()
  })
})
