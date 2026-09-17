import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DeleteDynamicFormDialog } from '../index'

describe('DeleteDynamicFormDialog', () => {
  it('identifies the selected form and preserves historical records', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(
      <DeleteDynamicFormDialog
        form={{
          id: 'form-1',
          name: 'Contrato',
          description: null,
          status: 'unavailable',
          stage: 'formalization',
          legalArea: { id: 'area-1', name: 'Cível' },
          legalTopics: [],
          fieldCount: 2,
        }}
        open
        isMutationPending={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Excluir formulário permanentemente?' }),
    ).toBeInstanceOf(HTMLElement)
    expect(screen.getByText(/histórico de usos será preservado/)).toBeInstanceOf(
      HTMLElement,
    )
    expect(screen.queryByText(/Consultas/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir formulário' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
