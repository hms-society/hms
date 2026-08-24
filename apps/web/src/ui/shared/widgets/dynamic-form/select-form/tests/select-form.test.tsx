import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SelectFormDialog } from '../index'

const { listDynamicFormsMock, listLegalAreasMock, listLegalTopicsMock } = vi.hoisted(
  () => ({
    listDynamicFormsMock: vi.fn(),
    listLegalAreasMock: vi.fn(),
    listLegalTopicsMock: vi.fn(),
  }),
)

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    dynamicFormService: { listDynamicForms: listDynamicFormsMock },
    legalCatalogService: {
      listLegalAreas: listLegalAreasMock,
      listLegalTopics: listLegalTopicsMock,
    },
  }),
}))

const forms = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Entrevista Cível',
    contexts: [],
    fields: [],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Triagem Cível',
    contexts: [],
    fields: [],
  },
]

function renderDialog(onSelect = vi.fn(), initialSelectedFormId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    onSelect,
    ...render(
      <QueryClientProvider client={queryClient}>
        <SelectFormDialog
          isOpen
          onClose={vi.fn()}
          onSelect={onSelect}
          initialSelectedFormId={initialSelectedFormId}
        />
      </QueryClientProvider>,
    ),
  }
}

describe('SelectFormDialog', () => {
  beforeEach(() => {
    listDynamicFormsMock.mockResolvedValue({ isFailure: false, body: forms })
    listLegalAreasMock.mockResolvedValue({ isFailure: false, body: [] })
    listLegalTopicsMock.mockResolvedValue({ isFailure: false, body: [] })
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
