import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useVariablePicker } from '../use-variable-picker'

describe('useVariablePicker', () => {
  it('derives the technical name from the label while opening the create flow', () => {
    const { result } = renderHook(() =>
      useVariablePicker({
        variables: [],
        onInsert: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onUpdate: vi.fn(),
      }),
    )

    act(() => result.current.handleAdd())
    act(() => result.current.handleLabelChange('Cláusula específica'))

    expect(result.current.open).toBe(true)
    expect(result.current.draft).toEqual({
      label: 'Cláusula específica',
      technicalName: 'clausula_especifica',
      description: '',
    })
  })

  it('regenerates the technical name when editing a system variable label', () => {
    const { result } = renderHook(() =>
      useVariablePicker({
        variables: [],
        onInsert: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onUpdate: vi.fn(),
      }),
    )

    act(() =>
      result.current.handleEdit({
        label: 'Nome do cliente',
        technicalName: 'cliente_nome',
      }),
    )
    act(() => result.current.handleLabelChange('Cliente contratante'))

    expect(result.current.draft.technicalName).toBe('cliente_contratante')
  })
})
