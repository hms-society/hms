import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ChangeEvent, FormEvent } from 'react'

import { useDynamicFormNameConflictQuery } from '@/ui/legal-catalog/hooks'
import { useDuplicateDynamicFormDialog } from '../use-duplicate-dynamic-form-dialog'

vi.mock('@/ui/legal-catalog/hooks', () => ({
  useDynamicFormNameConflictQuery: vi.fn(),
}))

const useDynamicFormNameConflictQueryMock = vi.mocked(useDynamicFormNameConflictQuery)

const form = {
  id: 'form-1',
  name: 'Contrato',
  description: null,
  status: 'available' as const,
  stage: 'consultation' as const,
  legalArea: { id: 'area-1', name: 'Cível' },
  legalTopics: [],
  fieldCount: 2,
}

describe('useDuplicateDynamicFormDialog', () => {
  it('suggests a copy name and submits trimmed input', async () => {
    useDynamicFormNameConflictQueryMock.mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof useDynamicFormNameConflictQuery>)
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useDuplicateDynamicFormDialog({
        form,
        open: true,
        isPending: false,
        conflict: null,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onConfirm,
        onOpenExisting: vi.fn(),
      }),
    )
    expect(result.current.name).toBe('Contrato — cópia')
    act(() =>
      result.current.handleNameChange({
        target: { value: ' Novo nome ' },
      } as ChangeEvent<HTMLInputElement>),
    )
    await act(async () =>
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>),
    )
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: 'Novo nome' }))
  })
})
