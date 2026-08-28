import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  useDocumentPackageList,
  type DocumentPackageListProps,
} from '../use-document-package-list'

describe('useDocumentPackageList', () => {
  it('preserves list items and row props for the renderer', () => {
    const props = {
      items: [],
      isReadOnly: true,
    } satisfies DocumentPackageListProps

    const { result } = renderHook(() => useDocumentPackageList(props))

    expect(result.current).toBe(props)
  })
})
