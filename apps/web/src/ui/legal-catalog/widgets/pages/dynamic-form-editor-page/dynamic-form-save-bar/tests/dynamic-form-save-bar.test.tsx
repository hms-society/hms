import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormSaveBar } from '../index'

describe('dynamic-form-save-bar', () => {
  it('enables saving for a valid dirty state and delegates the action', () => {
    const onSave = vi.fn()
    render(
      <DynamicFormSaveBar
        state={{ kind: 'dirty', isValid: true }}
        canDelete={false}
        onSave={onSave}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    const button = screen.getByRole('button', { name: 'Salvar modelo' })
    expect(button.hasAttribute('disabled')).toBe(false)
    fireEvent.click(button)
    expect(onSave).toHaveBeenCalledOnce()
  })
})
