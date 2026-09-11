import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useIntakeDetailsContent } from '../use-intake-details-content'

describe('useIntakeDetailsContent', () => {
  it('derives client presentation and terminal state without changing server data', () => {
    const data = {
      intake: { status: 'contracted' },
      client: { client: { type: 'natural', name: 'Cliente HMS' } },
    } as never

    const { result } = renderHook(() => useIntakeDetailsContent(data, 'Atendente'))

    expect(result.current.clientName).toBe('Cliente HMS')
    expect(result.current.isTerminal).toBe(true)
    expect(result.current.responsibleName).toBe('Atendente')
  })

  it('uses a safe client fallback for a partial optional projection', () => {
    const { result } = renderHook(() =>
      useIntakeDetailsContent({ intake: { status: 'registered' } } as never, 'Atendente'),
    )

    expect(result.current.clientName).toBe('Cliente não identificado')
    expect(result.current.isTerminal).toBe(false)
  })
})
