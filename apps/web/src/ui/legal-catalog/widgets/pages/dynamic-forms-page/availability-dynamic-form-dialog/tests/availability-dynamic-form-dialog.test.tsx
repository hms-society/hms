import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AvailabilityDynamicFormDialog } from '../index'

describe('AvailabilityDynamicFormDialog', () => {
  it('shows live impact totals and confirms after impact loads', () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(
      <AvailabilityDynamicFormDialog
        form={{
          id: 'form-1',
          name: 'Contrato',
          description: null,
          status: 'available',
          stage: 'consultation',
          legalArea: { id: 'area-1', name: 'Cível' },
          legalTopics: [],
          fieldCount: 2,
        }}
        open
        impact={{
          consultation: { total: 3, inProgress: 1 },
          formalization: { total: 2, inProgress: 1 },
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

    expect(screen.getByText(/Consultas: 3/)).toBeInstanceOf(HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('renders a retry action when impact calculation fails', () => {
    const onRetryImpact = vi.fn()
    render(
      <AvailabilityDynamicFormDialog
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
    expect(
      (screen.getByRole('button', { name: 'Tentar novamente' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetryImpact).toHaveBeenCalledOnce()
  })
})
