import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  getDynamicFormEditorStatus,
  useDynamicFormEditorStatus,
} from '../use-dynamic-form-editor-status'

describe('use-dynamic-form-editor-status', () => {
  it('prioritizes invalid IDs and delegates retries to the detail query', () => {
    const refetch = vi.fn()
    const editor = {
      isLoading: false,
      isNotFound: false,
      detailQuery: { isError: true, refetch },
    }
    expect(
      getDynamicFormEditorStatus(
        { mode: 'edit', dynamicFormId: 'invalid', isValidId: false },
        editor as never,
      ),
    ).toBe('invalid-id')

    const { result } = renderHook(() =>
      useDynamicFormEditorStatus({
        props: { mode: 'edit', dynamicFormId: 'form-1' },
        editor: { ...editor, isLoading: true } as never,
        children: null,
      }),
    )
    expect(result.current.status).toBe('loading')
    result.current.onRetry()
    expect(refetch).toHaveBeenCalled()
  })
})
