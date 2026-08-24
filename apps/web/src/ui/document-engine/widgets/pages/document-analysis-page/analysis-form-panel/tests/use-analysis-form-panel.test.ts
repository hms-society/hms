import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAnalysisFormPanel } from '../use-analysis-form-panel'

describe('useAnalysisFormPanel', () => {
  it('sets the original document and opens it in the viewer', () => {
    const setValue = vi.fn()
    const onOpenDocument = vi.fn()

    const { result } = renderHook(() =>
      useAnalysisFormPanel({
        form: { setValue } as never,
        onOpenDocument,
      }),
    )

    act(() => {
      result.current.handleOpenDuplicateDocument('original-file-1')
    })

    expect(setValue).toHaveBeenCalledWith('originalDocumentId', 'original-file-1', {
      shouldDirty: true,
      shouldValidate: true,
    })
    expect(onOpenDocument).toHaveBeenCalledWith('original-file-1')
  })
})
