import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCaseSummaryCard } from '../use-case-summary-card'

describe('useCaseSummaryCard', () => {
  it('maps Case status and optional lookup labels', () => {
    const { result } = renderHook(() =>
      useCaseSummaryCard({
        legalCase: {
          publicCode: 'CAS-1',
          status: 'protocol_delivery',
          openedAt: new Date('2026-08-26T12:00:00.000Z'),
        } as never,
        legalAreaName: undefined,
        primaryLawyerName: undefined,
        isUnavailable: false,
        onRetry: vi.fn(),
      }),
    )

    expect(result.current.caseCode).toBe('CAS-1')
    expect(result.current.statusLabel).toBe('Entrega de protocolo')
    expect(result.current.legalAreaLabel).toBe('Área não informada')
    expect(result.current.lawyerLabel).toBe('Advogado não informado')
  })

  it('uses an explicit absent-case status and does not expose a navigation callback', () => {
    const onRetry = vi.fn()
    const { result } = renderHook(() =>
      useCaseSummaryCard({ legalCase: undefined, isUnavailable: false, onRetry }),
    )

    expect(result.current.caseCode).toBe('Nenhum caso relacionado')
    expect(result.current.statusLabel).toBe('Não iniciado')
    expect(result.current.isUnavailable).toBe(false)
    expect(onRetry).not.toHaveBeenCalled()
  })
})
