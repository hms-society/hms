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
        impact={{
          consultation: { total: 4, inProgress: 2 },
          formalization: { total: 3, inProgress: 1 },
        }}
        isImpactPending={false}
        isImpactError={false}
        isMutationPending={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onRetryImpact={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Excluir formulário permanentemente?' }),
    ).toBeInstanceOf(HTMLElement)
    expect(screen.getByText(/históricas serão preservadas/)).toBeInstanceOf(HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir formulário' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('renders a retry action when impact calculation fails', () => {
    const onRetryImpact = vi.fn()
    render(
      <DeleteDynamicFormDialog
        form={null}
        open
        impact={null}
        isImpactPending={false}
        isImpactError
        isMutationPending={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onRetryImpact={onRetryImpact}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível calcular os impactos.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetryImpact).toHaveBeenCalledOnce()
  })
})
