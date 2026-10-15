import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useCaseClosureTab } from '../use-case-closure-tab'

describe('useCaseClosureTab', () => {
  it('enables conclusion only after every closure step is completed', () => {
    const { result } = renderHook(() => useCaseClosureTab({ canManage: true }))

    expect(result.current.completedSteps).toBe(1)
    expect(result.current.canConclude).toBe(false)

    act(() => {
      result.current.handleMarkNoSettlement()
      result.current.handleArchiveDocuments()
    })

    expect(result.current.completedSteps).toBe(3)
    expect(result.current.canConclude).toBe(true)

    act(() => result.current.handleConclude())

    expect(result.current.isConcluded).toBe(true)
  })

  it('keeps closure actions unavailable to collaborators without manager permission', () => {
    const { result } = renderHook(() => useCaseClosureTab({ canManage: false }))

    expect(result.current.canConclude).toBe(false)

    act(() => result.current.handleConclude())

    expect(result.current.isConcluded).toBe(false)
  })
})
