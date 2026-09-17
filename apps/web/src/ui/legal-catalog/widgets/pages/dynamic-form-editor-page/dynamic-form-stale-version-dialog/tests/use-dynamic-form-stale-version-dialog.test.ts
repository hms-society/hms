import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormStaleVersionDialog } from '../use-dynamic-form-stale-version-dialog'

describe('use-dynamic-form-stale-version-dialog', () => {
  it('only allows reload when the query is idle', () => {
    const { result, rerender } = renderHook(
      (isReloading) =>
        useDynamicFormStaleVersionDialog({
          open: true,
          expectedVersion: 1,
          currentVersion: 2,
          isReloading,
          errorMessage: null,
          onContinueEditing: () => undefined,
          onReloadServerVersion: async () => undefined,
        }),
      { initialProps: false },
    )
    expect(result.current.canReload).toBe(true)
    rerender(true)
    expect(result.current.canReload).toBe(false)
  })
})
