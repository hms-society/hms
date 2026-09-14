import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSignatureProgressSummary } from '../use-signature-progress-summary'

describe('useSignatureProgressSummary', () => {
  it('normalizes progress and describes terminal statuses', () => {
    const { result } = renderHook(() =>
      useSignatureProgressSummary({
        status: {
          status: 'confirmed',
          totalDocuments: 2,
          completedDocuments: 2,
          failedDocuments: 0,
          progressPercentage: 130,
        } as never,
        isRefreshing: false,
      }),
    )

    expect(result.current.progressPercentage).toBe(100)
    expect(result.current.statusLabel).toBe('Todas confirmadas')
    expect(result.current.failedLabel).toBeUndefined()
  })

  it('keeps the request status label while refreshing', () => {
    const { result } = renderHook(() =>
      useSignatureProgressSummary({
        status: {
          status: 'sent',
          totalDocuments: 1,
          completedDocuments: 0,
          failedDocuments: 0,
          progressPercentage: -4,
        } as never,
        isRefreshing: true,
      }),
    )

    expect(result.current.statusLabel).toBe('Envio em andamento')
    expect(result.current.progressPercentage).toBe(0)
  })
})
