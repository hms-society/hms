import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormUnsavedChangesDialog } from '../index'

describe('dynamic-form-unsaved-changes-dialog', () => {
  it('delegates the destructive discard action', () => {
    const onDiscardChanges = vi.fn()
    render(
      <DynamicFormUnsavedChangesDialog
        open
        onContinueEditing={vi.fn()}
        onDiscardChanges={onDiscardChanges}
      />,
    )
    expect(screen.getByRole('alertdialog').textContent).toContain('alterações não salvas')
    fireEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }))
    expect(onDiscardChanges).toHaveBeenCalledOnce()
  })
})
