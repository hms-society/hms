import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFormalizationCompletionCard } from '../use-formalization-completion-card'

describe('useFormalizationCompletionCard', () => {
  it('formats a completed summary and retains the route id', () => {
    const { result } = renderHook(() =>
      useFormalizationCompletionCard({
        summary: {
          formalizationId: 'formalization-1',
          status: 'completed',
          completedAt: new Date('2026-08-26T12:00:00.000Z'),
        } as never,
        isUnavailable: false,
        onRetry: vi.fn(),
      }),
    )

    expect(result.current.isCompleted).toBe(true)
    expect(result.current.formalizationId).toBe('formalization-1')
    expect(result.current.completedAtLabel).not.toBe('Data indisponível')
  })

  it('uses safe fallback values for absent optional data', () => {
    const { result } = renderHook(() =>
      useFormalizationCompletionCard({
        summary: undefined,
        isUnavailable: true,
        onRetry: vi.fn(),
      }),
    )

    expect(result.current.completedAtLabel).toBe('Data indisponível')
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.formalizationId).toBeUndefined()
  })
})
