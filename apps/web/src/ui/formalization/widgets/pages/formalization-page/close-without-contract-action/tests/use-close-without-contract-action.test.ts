import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCloseWithoutContractAction } from '../use-close-without-contract-action'

describe('useCloseWithoutContractAction', () => {
  it('opens and submits trimmed notes without changing the dialog state', () => {
    const mutate = vi.fn()
    const { result } = renderHook(() =>
      useCloseWithoutContractAction({
        isEnabled: true,
        mutation: { isPending: false, error: null, mutate },
      }),
    )

    act(() => {
      result.current.handleOpenChange(true)
      result.current.onReasonChange('out_of_scope')
      result.current.onNotesChange('  Motivo  ')
    })
    act(() => result.current.handleConfirm('out_of_scope', '  Motivo  '))

    expect(result.current.isOpen).toBe(true)
    expect(mutate).toHaveBeenCalledWith({ reason: 'out_of_scope', notes: 'Motivo' })
  })

  it('resets the form after closing when no submission is pending', () => {
    const { result } = renderHook(() =>
      useCloseWithoutContractAction({
        isEnabled: true,
        mutation: { isPending: false, error: null, mutate: vi.fn() },
      }),
    )

    act(() => {
      result.current.onReasonChange('client_withdrew')
      result.current.onNotesChange('Observação')
      result.current.handleOpenChange(true)
      result.current.handleOpenChange(false)
    })

    expect(result.current.reason).toBe('')
    expect(result.current.notes).toBe('')
    expect(result.current.isOpen).toBe(false)
  })

  it('keeps the form values while a submission is pending', () => {
    const { result } = renderHook(() =>
      useCloseWithoutContractAction({
        isEnabled: true,
        mutation: { isPending: true, error: null, mutate: vi.fn() },
      }),
    )

    act(() => {
      result.current.onReasonChange('other')
      result.current.onNotesChange('Aguardando')
      result.current.handleOpenChange(false)
    })

    expect(result.current.reason).toBe('other')
    expect(result.current.notes).toBe('Aguardando')
  })
})
