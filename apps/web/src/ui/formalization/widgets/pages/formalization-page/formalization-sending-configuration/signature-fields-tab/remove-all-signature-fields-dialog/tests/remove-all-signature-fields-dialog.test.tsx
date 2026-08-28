import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RemoveAllSignatureFieldsDialog } from '..'

describe('RemoveAllSignatureFieldsDialog', () => {
  afterEach(cleanup)

  it('confirms removing all fields', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <RemoveAllSignatureFieldsDialog
        open
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    )

    expect(screen.getByRole('alertdialog').textContent).toContain(
      'Remover todos os campos?',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover todos' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
