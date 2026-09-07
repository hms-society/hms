import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDynamicFormOptionsQuery } from '@/ui/shared/hooks/use-dynamic-form-options-query'

import { SelectFormDialog } from '../index'

vi.mock('@/ui/shared/hooks/use-dynamic-form-options-query', () => ({
  useDynamicFormOptionsQuery: vi.fn(),
}))

const useDynamicFormOptionsQueryMock = vi.mocked(useDynamicFormOptionsQuery)

const forms = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Entrevista Cível',
    status: 'available' as const,
    contexts: [],
    fields: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Triagem Cível',
    status: 'available' as const,
    contexts: [],
    fields: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
]

function renderDialog(onSelect = vi.fn(), initialSelectedFormId?: string) {
  return {
    onSelect,
    ...render(
      <SelectFormDialog
        isOpen
        onClose={vi.fn()}
        onSelect={onSelect}
        initialSelectedFormId={initialSelectedFormId}
      />,
    ),
  }
}

describe('SelectFormDialog', () => {
  beforeEach(() => {
    useDynamicFormOptionsQueryMock.mockReturnValue({
      dynamicForms: forms,
      isDynamicFormsError: false,
      isLoadingDynamicForms: false,
      legalAreas: [],
      legalTopics: [],
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('does not select the first dynamic form automatically', async () => {
    renderDialog()

    const firstForm = await screen.findByRole('button', { name: /Entrevista Cível/ })
    const secondForm = screen.getByRole('button', { name: /Triagem Cível/ })
    const confirmButton = screen.getByRole('button', { name: 'Usar ficha dinâmica' })

    expect(firstForm.getAttribute('aria-pressed')).toBe('false')
    expect(secondForm.getAttribute('aria-pressed')).toBe('false')
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(secondForm)

    await waitFor(() => {
      expect(firstForm.getAttribute('aria-pressed')).toBe('false')
      expect(secondForm.getAttribute('aria-pressed')).toBe('true')
      expect((confirmButton as HTMLButtonElement).disabled).toBe(false)
    })
  })

  it('selects the dynamic form currently displayed in the attendance form', async () => {
    renderDialog(vi.fn(), forms[1].id)

    const firstForm = await screen.findByRole('button', { name: /Entrevista Cível/ })
    const currentForm = screen.getByRole('button', { name: /Triagem Cível/ })
    const confirmButton = screen.getByRole('button', { name: 'Usar ficha dinâmica' })

    expect(firstForm.getAttribute('aria-pressed')).toBe('false')
    expect(currentForm.getAttribute('aria-pressed')).toBe('true')
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false)
  })
})
