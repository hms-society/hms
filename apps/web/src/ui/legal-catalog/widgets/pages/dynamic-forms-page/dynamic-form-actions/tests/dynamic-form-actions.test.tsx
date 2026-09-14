import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'

import { DynamicFormActions } from '../index'

const form: DynamicFormListItem = {
  id: 'form-1',
  name: 'Contrato',
  description: null,
  status: 'available',
  stage: 'consultation',
  legalArea: { id: 'area-1', name: 'Cível' },
  legalTopics: [],
  fieldCount: 2,
}

describe('DynamicFormActions', () => {
  it('opens an accessible menu with the status-dependent action', async () => {
    render(
      <DynamicFormActions
        form={form}
        onDuplicate={vi.fn()}
        onChangeAvailability={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Ações de Contrato' }), {
      button: 0,
    })
    expect(screen.queryByRole('menuitem', { name: 'Editar' })).toBeNull()
    expect(
      await screen.findByRole('menuitem', { name: 'Duplicar formulário' }),
    ).toBeInstanceOf(HTMLElement)
    expect(
      await screen.findByRole('menuitem', { name: 'Tornar indisponível' }),
    ).toBeInstanceOf(HTMLElement)
    expect(
      await screen.findByRole('menuitem', { name: 'Excluir formulário' }),
    ).toBeInstanceOf(HTMLElement)
  })
})
