import { act, renderHook } from '@testing-library/react'
import type { ChangeEvent, FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { usePendingMarkersDialog } from '../pending-markers-dialog/use-pending-markers-dialog'

describe('usePendingMarkersDialog', () => {
  it('rejects empty values, submits the selected marker, and resets when closed', () => {
    const onFill = vi.fn()
    const onOpenChange = vi.fn()
    const { result } = renderHook(() =>
      usePendingMarkersDialog({ isRemoving: false, onFill, onOpenChange }),
    )
    const event = { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
    act(() => result.current.handleStartFilling('{cliente_nome}'))
    act(() => result.current.handleSubmit(event))
    expect(onFill).not.toHaveBeenCalled()
    act(() =>
      result.current.handleValueChange({
        target: { value: 'Maria Silva' },
      } as ChangeEvent<HTMLInputElement>),
    )
    act(() => result.current.handleSubmit(event))
    expect(onFill).toHaveBeenCalledWith('{cliente_nome}', 'Maria Silva')
    act(() => result.current.handleOpenChange(false))
    expect(result.current.editingMarker).toBeUndefined()
    expect(result.current.value).toBe('')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('prevents another submission during persistence and clears values when switching markers', () => {
    const onFill = vi.fn()
    const { result } = renderHook(() =>
      usePendingMarkersDialog({ isRemoving: true, onFill, onOpenChange: vi.fn() }),
    )
    act(() => result.current.handleStartFilling('{cliente_nome}'))
    act(() =>
      result.current.handleValueChange({
        target: { value: 'Maria' },
      } as ChangeEvent<HTMLInputElement>),
    )
    act(() =>
      result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>),
    )
    expect(onFill).not.toHaveBeenCalled()
    act(() => result.current.handleStartFilling('{procurador_oab}'))
    expect(result.current.value).toBe('')
    expect(result.current.editingMarker).toBe('{procurador_oab}')
    expect(result.current.getPendingMarkerLabel('{cliente_nome}')).toBe('Nome do cliente')
    expect(result.current.getPendingMarkerLabel('{procurador_oab}')).toBe(
      'Procurador Oab',
    )
  })
})
