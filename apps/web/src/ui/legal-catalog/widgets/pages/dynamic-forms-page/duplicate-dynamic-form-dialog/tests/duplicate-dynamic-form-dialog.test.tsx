import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormNameConflictQuery } from '@/ui/legal-catalog/hooks'
import { DuplicateDynamicFormDialog } from '../index'

vi.mock('@/ui/legal-catalog/hooks', () => ({
  useDynamicFormNameConflictQuery: vi.fn(),
}))

const useDynamicFormNameConflictQueryMock = vi.mocked(useDynamicFormNameConflictQuery)

describe('DuplicateDynamicFormDialog', () => {
  it('renders the suggested name and keeps submit disabled for conflicts', () => {
    useDynamicFormNameConflictQueryMock.mockReturnValue({
      data: { conflict: true, existingDynamicFormId: 'existing-1' },
    } as ReturnType<typeof useDynamicFormNameConflictQuery>)

    render(
      <DuplicateDynamicFormDialog
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
        isPending={false}
        conflict={null}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onOpenExisting={vi.fn()}
      />,
    )

    expect(
      (screen.getByLabelText('Nome do novo formulário *') as HTMLInputElement).value,
    ).toBe('Contrato — cópia')
    expect(screen.getByRole('alert').textContent).toContain('Já existe')
    expect(
      (screen.getByRole('button', { name: 'Duplicar formulário' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir formulário' }))
  })
})
