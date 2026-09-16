import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDynamicFormNameConflictQuery } from '@/ui/legal-catalog/hooks'
import { DynamicFormsPage } from '../index'
import { useDynamicFormsPage } from '../use-dynamic-forms-page'

vi.mock('../use-dynamic-forms-page', () => ({ useDynamicFormsPage: vi.fn() }))
vi.mock('@/ui/legal-catalog/hooks', () => ({
  useDynamicFormNameConflictQuery: vi.fn(),
}))

const useDynamicFormsPageMock = vi.mocked(useDynamicFormsPage)
const useDynamicFormNameConflictQueryMock = vi.mocked(useDynamicFormNameConflictQuery)

describe('DynamicFormsPage', () => {
  beforeEach(() => {
    useDynamicFormNameConflictQueryMock.mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useDynamicFormNameConflictQuery>)
    useDynamicFormsPageMock.mockReturnValue({
      data: { items: [], page: 1, pageSize: 5, total: 0, pageCount: 0 },
      formsQuery: {
        isPending: false,
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      },
      searchParams: { search: '', stage: '', status: '', page: 1, pageSize: 5 },
      hasFilters: false,
      overlay: { kind: 'closed' },
      duplicateError: null,
      availabilityError: null,
      deleteError: null,
      duplicateAction: { isPending: false },
      availabilityAction: { isPending: false },
      deleteAction: { isPending: false },
      duplicateConflict: null,
      successMessage: null,
      updateSearch: vi.fn(),
      clearFilters: vi.fn(),
      openDuplicate: vi.fn(),
      openAvailability: vi.fn(),
      openDelete: vi.fn(),
      closeOverlay: vi.fn(),
      handleDuplicate: vi.fn(),
      handleAvailability: vi.fn(),
      handleDelete: vi.fn(),
      handleEdit: vi.fn(),
      handleOpenNew: vi.fn(),
    } as unknown as ReturnType<typeof useDynamicFormsPage>)
  })

  it('renders the empty catalog state and create action', () => {
    render(<DynamicFormsPage />)
    expect(screen.getByRole('heading', { name: 'Formulários dinâmicos' })).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.getByText('Nenhum formulário cadastrado')).toBeInstanceOf(HTMLElement)
    expect(screen.getAllByRole('button', { name: 'Novo formulário' })).toHaveLength(2)
  })
})
