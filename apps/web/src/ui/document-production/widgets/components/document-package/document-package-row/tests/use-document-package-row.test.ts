import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  useDocumentPackageRow,
  type DocumentPackageRowProps,
} from '../use-document-package-row'

describe('useDocumentPackageRow', () => {
  it('preserves the widget contract for the row renderer', () => {
    const props = {
      item: {
        id: 'document-1',
        title: 'Procuração',
        status: 'not_generated' as const,
        statusLabel: 'Não gerado',
        isCurrent: false,
        isGenerating: false,
        isTimedOut: false,
      },
    } satisfies DocumentPackageRowProps

    const { result } = renderHook(() => useDocumentPackageRow(props))

    expect(result.current).toBe(props)
  })
})
