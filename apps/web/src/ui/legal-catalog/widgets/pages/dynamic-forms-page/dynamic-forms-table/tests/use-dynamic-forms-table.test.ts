import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormsTable } from '../use-dynamic-forms-table'

describe('useDynamicFormsTable', () => {
  it('sorts topics in the summary and guards page bounds', () => {
    const onPageChange = vi.fn()
    const { result } = renderHook(() =>
      useDynamicFormsTable({
        items: [
          {
            id: 'form-1',
            name: 'Contrato',
            description: null,
            status: 'available',
            stage: 'consultation',
            legalArea: { id: 'area-1', name: 'Cível' },
            legalTopics: [
              { id: 'topic-2', name: 'Família', position: 2 },
              { id: 'topic-1', name: 'Contratos', position: 1 },
            ],
            fieldCount: 2,
          },
        ],
        page: 1,
        pageSize: 5,
        pageCount: 2,
        total: 6,
        isPending: false,
        onEdit: vi.fn(),
        onDuplicate: vi.fn(),
        onChangeAvailability: vi.fn(),
        onDelete: vi.fn(),
        onPageChange,
      }),
    )

    expect(result.current.getTopicSummary(result.current.visibleItems[0])).toBe(
      'Contratos +1',
    )
    act(() => result.current.handlePageChange(0))
    expect(onPageChange).not.toHaveBeenCalled()
    act(() => result.current.handlePageChange(2))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
