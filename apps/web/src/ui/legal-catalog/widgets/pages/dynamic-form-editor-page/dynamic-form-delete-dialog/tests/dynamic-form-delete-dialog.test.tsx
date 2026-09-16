import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormDeleteDialog } from '../index'

describe('dynamic-form-delete-dialog', () => {
  it('confirms deletion without showing usage details', () => {
    const onDeleted = vi.fn()
    render(
      <DynamicFormDeleteDialog
        open
        form={{ id: 'form-1', name: 'Ficha' } as never}
        isDirty
        isDeleting={false}
        errorMessage='Falha ao excluir'
        onOpenChange={vi.fn()}
        onDeleted={onDeleted}
      />,
    )
    expect(screen.queryByText(/formalizações|uso histórico/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir formulário' }))
    expect(onDeleted).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('button', { name: 'Excluir formulário' }).hasAttribute('disabled'),
    ).toBe(false)
  })
})
