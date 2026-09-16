import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AvailabilityDynamicFormDialog } from '../index'

describe('AvailabilityDynamicFormDialog', () => {
  it('confirms the availability change without showing usage details', () => {
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
        isMutationPending={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.queryByText(/formalizações|uso histórico/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
