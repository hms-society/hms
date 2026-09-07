import { act, renderHook } from '@testing-library/react'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import {
  useCloseWithoutContractDialog,
  type CloseWithoutContractDialogProps,
} from '../use-close-without-contract-dialog'

function createProps(
  overrides: Partial<CloseWithoutContractDialogProps> = {},
): CloseWithoutContractDialogProps {
  return {
    open: true,
    reason: '',
    notes: '',
    onOpenChange: vi.fn(),
    onReasonChange: vi.fn(),
    onNotesChange: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  }
}

describe('useCloseWithoutContractDialog', () => {
  it('prevents confirmation and exposes a reason error when no reason is selected', () => {
    const props = createProps()
    const preventDefault = vi.fn()
    const { result } = renderHook(() => useCloseWithoutContractDialog(props))

    act(() => {
      result.current.handleConfirm({ preventDefault } as never)
    })

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(props.onConfirm).not.toHaveBeenCalled()
    expect(result.current.hasReasonError).toBe(true)
  })

  it('clears the reason error and reports the newly selected reason', () => {
    const props = createProps()
    const { result } = renderHook(() => useCloseWithoutContractDialog(props))

    act(() => {
      result.current.handleConfirm({ preventDefault: vi.fn() } as never)
      result.current.handleReasonChange('client_withdrew')
    })

    expect(props.onReasonChange).toHaveBeenCalledWith('client_withdrew')
    expect(result.current.hasReasonError).toBe(false)
  })

  it('confirms the selected reason with the current notes', () => {
    const props = createProps({
      reason: 'legally_unviable' as IntakeClosureReason,
      notes: 'Não atende aos critérios.',
    })
    const { result } = renderHook(() => useCloseWithoutContractDialog(props))

    act(() => {
      result.current.handleConfirm({ preventDefault: vi.fn() } as never)
    })

    expect(props.onConfirm).toHaveBeenCalledWith(
      'legally_unviable',
      'Não atende aos critérios.',
    )
  })
})
