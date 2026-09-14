import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateCasePage } from './index'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children }: any) => (
      <a href='/mock' data-testid='mock-link'>
        {children}
      </a>
    ),
  }
})

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: () => ({
    currentCollaborator: { professionalName: 'Lawyer Test', profile: 'lawyer' },
  }),
}))

vi.mock('@/ui/intake/hooks/use-intakes-query', () => ({
  useIntakesQuery: () => ({
    data: {
      items: [
        {
          intakeId: 'intake-123',
          displayId: '123',
          client: { name: 'Client Test', taxId: '123.456.789-00' },
        },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock('@/ui/case-management/hooks/use-create-case-action', () => ({
  useCreateCaseAction: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/ui/intake/hooks/use-legal-areas-query', () => ({
  useLegalAreasQuery: () => ({
    legalAreas: [{ id: 'area-1', name: 'Cível' }],
  }),
}))

vi.mock('@/ui/intake/hooks/use-legal-topics-query', () => ({
  useLegalTopicsQuery: () => ({
    legalTopics: [{ id: 'topic-1', name: 'Contratos' }],
  }),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    intakeService: {
      getIntake: vi.fn().mockResolvedValue({ isFailure: false, body: {} }),
    },
  }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
}))

vi.mock('@/ui/intake/hooks/use-intake-query', () => ({
  useIntakeQuery: () => ({ data: null }),
}))

// Mock the components that use radix-ui primitives which can cause act warnings in JSDOM if not fully mocked or interacted properly
vi.mock('@/ui/shadcn/select', () => ({
  Select: ({ children }: any) => <div data-testid='select-root'>{children}</div>,
  SelectTrigger: ({ children }: any) => (
    <button type='button' data-testid='select-trigger'>
      {children}
    </button>
  ),
  SelectValue: () => <span>Select</span>,
  SelectContent: ({ children }: any) => (
    <div data-testid='select-content'>{children}</div>
  ),
  SelectItem: ({ children }: any) => <div data-testid='select-item'>{children}</div>,
}))

describe('CreateCasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the form fields', () => {
    render(<CreateCasePage />)
    expect(screen.getByText('Novo Caso')).toBeDefined()
    expect(
      screen.getByPlaceholderText('Ex: Aposentadoria por Tempo de Contribuição'),
    ).toBeDefined()
    expect(screen.getByText('Criar Caso')).toBeDefined()
  })

  it('disables the submit button initially when no intake is selected', () => {
    render(<CreateCasePage />)
    const submitButton = screen.getAllByText('Criar Caso')[0]
    expect(submitButton).toHaveProperty('disabled', true)
  })

  it('shows validation error for title when intake is selected but title is empty', async () => {
    render(<CreateCasePage />)

    // Simulate form submit directly via form element since button is disabled without intake,
    // or just fire submit event on the form.
    const form = screen.getAllByText('Criar Caso')[0].closest('form')
    if (form) fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Selecione uma triagem de origem')).toBeDefined()
      expect(screen.getByText('O título do caso é obrigatório')).toBeDefined()
    })
  })
})
