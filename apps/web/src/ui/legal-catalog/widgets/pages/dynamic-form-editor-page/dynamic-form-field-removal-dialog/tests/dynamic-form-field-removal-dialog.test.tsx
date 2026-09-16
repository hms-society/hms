import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormFieldRemovalDialog } from '../index'

vi.mock('@/ui/legal-catalog/hooks', () => ({
  useDynamicFormFieldUsageImpactQuery: () => ({
    isFetching: false,
    isError: false,
    data: undefined,
    refetch: vi.fn(),
  }),
}))

describe('dynamic-form-field-removal-dialog', () => {
  it('keeps a new field removable without a usage lookup', () => {
    const onConfirm = vi.fn()
    render(
      <DynamicFormFieldRemovalDialog
        open
        field={{
          clientId: 'field-1',
          label: 'Contrato',
          type: 'short_text',
          required: true,
        }}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    )
    expect(screen.queryByText(/Formalizações/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Remover campo' }))
    expect(onConfirm).toHaveBeenCalledWith('field-1')
  })

  it('keeps a new currency field removable without a usage lookup', () => {
    const onConfirm = vi.fn()
    render(
      <DynamicFormFieldRemovalDialog
        open
        field={{
          clientId: 'field-1',
          label: 'Valor econômico aproximado',
          type: 'currency',
          required: false,
        }}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    const removeButton = screen.getByRole('button', { name: 'Remover campo' })
    expect(removeButton.hasAttribute('disabled')).toBe(false)
    fireEvent.click(removeButton)
    expect(onConfirm).toHaveBeenCalledWith('field-1')
  })
})
