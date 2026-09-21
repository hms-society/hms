import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CommercialConditionsCard } from '..'

vi.mock('@/ui/shared/widgets/dynamic-form/dynamic-form-fields', () => ({
  DynamicFormFieldsSection: () => null,
}))
vi.mock('../close-form-confirmation-dialog', () => ({
  CloseFormConfirmationDialog: () => null,
}))
vi.mock('../reopen-form-confirmation-dialog', () => ({
  ReopenFormConfirmationDialog: () => null,
}))

describe('CommercialConditionsCard', () => {
  afterEach(cleanup)

  it('disables form reopening while signature sending is active', () => {
    render(
      <CommercialConditionsCard
        fields={[]}
        answers={{}}
        isClosed
        isReadOnly
        isPending={false}
        expectedVersion={1}
        onChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onClose={vi.fn()}
        onReopen={vi.fn()}
        formName='Condições comerciais'
        onOpenSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Reabrir formulário' })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('button', { name: /Condições comerciais/ })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('exposes the shared form selector while the form is open', () => {
    const onOpenSelect = vi.fn()
    render(
      <CommercialConditionsCard
        fields={[]}
        answers={{}}
        isClosed={false}
        isPending={false}
        expectedVersion={1}
        onChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onClose={vi.fn()}
        onReopen={vi.fn()}
        formName='Condições comerciais'
        onOpenSelect={onOpenSelect}
        canReplace
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Condições comerciais/ }))
    expect(onOpenSelect).toHaveBeenCalled()
  })

  it('explains why replacement is blocked when the package is confirmed', () => {
    render(
      <CommercialConditionsCard
        fields={[]}
        answers={{}}
        isClosed={false}
        isPending={false}
        expectedVersion={1}
        onChange={vi.fn()}
        onSaveDraft={vi.fn()}
        onClose={vi.fn()}
        onReopen={vi.fn()}
        formName='Condições comerciais'
        onOpenSelect={vi.fn()}
      />,
    )

    expect(
      screen.getByText('Reabra o pacote de documentos antes de substituir a ficha.'),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: /Condições comerciais/ })).toHaveProperty(
      'disabled',
      true,
    )
  })
})
