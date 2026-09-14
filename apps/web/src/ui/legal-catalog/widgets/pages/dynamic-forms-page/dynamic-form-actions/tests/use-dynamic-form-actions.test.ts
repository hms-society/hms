import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'

import { useDynamicFormActions } from '../use-dynamic-form-actions'

describe('useDynamicFormActions', () => {
  it('derives availability labels and delegates actions', () => {
    const onDuplicate = vi.fn()
    const form: DynamicFormListItem = {
      id: 'form-1',
      name: 'Contrato',
      description: null,
      status: 'unavailable',
      stage: 'consultation',
      legalArea: { id: 'area-1', name: 'Cível' },
      legalTopics: [],
      fieldCount: 2,
    }
    const { result } = renderHook(() =>
      useDynamicFormActions({
        form,
        onDuplicate,
        onChangeAvailability: vi.fn(),
        onDelete: vi.fn(),
      }),
    )

    expect(result.current.availabilityLabel).toBe('Tornar disponível')
    act(() => result.current.handleDuplicate())
    expect(onDuplicate).toHaveBeenCalledWith(form)
  })
})
