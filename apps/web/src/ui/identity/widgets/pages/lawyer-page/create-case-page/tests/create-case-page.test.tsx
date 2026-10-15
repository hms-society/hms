import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { UserStatus } from '@hms/core/identity/domain/structures'
import type { IntakeListItem } from '@hms/core/intake/domain/structures'
import type { CaseTeamMemberSelectorProps } from '@/ui/case-management/widgets/components/case-team-member-selector/types/case-team-member-selector-props'
import { CreateCasePage } from '../index'

const { createCase, useIntakesListQueryMock } = vi.hoisted(() => ({
  createCase: vi.fn(),
  useIntakesListQueryMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  }
})

vi.mock('@/ui/case-management/hooks/use-create-case-action', () => ({
  useCreateCaseAction: () => ({ createCase, isCreatingCase: false }),
}))

vi.mock('@/ui/case-management/hooks/use-case-opening-source-query', () => ({
  useCaseOpeningSourceQuery: () => ({
    caseOpeningSource: null,
    caseOpeningSourceError: null,
    isLoadingCaseOpeningSource: false,
  }),
}))

vi.mock('@/ui/case-management/widgets/components/case-team-member-selector', () => ({
  CaseTeamMemberSelector: ({
    open,
    onSelect,
    onClose,
    requiredProfile,
    initialRole,
  }: CaseTeamMemberSelectorProps) => {
    if (!open) return null
    const isManager = requiredProfile === CollaboratorProfile.Lawyer
    const name = isManager ? 'Advogada Teste' : 'Colaborador Teste'
    return (
      <div role='dialog' aria-label='Selecionar colaborador'>
        <button
          type='button'
          onClick={() => {
            onSelect(
              {
                collaboratorId: isManager ? 'manager-1' : 'member-1',
                professionalName: name,
                email: `${isManager ? 'advogada' : 'colaborador'}@example.test`,
                profile: requiredProfile ?? CollaboratorProfile.Lawyer,
                status: UserStatus.Active,
              },
              initialRole ?? CaseMemberRole.Collaborator,
            )
            onClose()
          }}
        >
          Selecionar {name}
        </button>
      </div>
    )
  },
}))

vi.mock('@/ui/intake/hooks/use-intakes-list-query', () => ({
  useIntakesListQuery: useIntakesListQueryMock,
}))

vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query',
  () => ({ useLegalAreasQuery: () => ({ legalAreas: [] }) }),
)
vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query',
  () => ({ useLegalTopicsQuery: () => ({ legalTopics: [] }) }),
)
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({ intakeService: { getIntake: vi.fn() } }),
}))
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: null }) }))
vi.mock('@/ui/shadcn/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button type='button'>{children}</button>,
  SelectValue: () => <span>Selecione</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('@/ui/shadcn/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('@/ui/shadcn/command', () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <p>{children}</p>,
  CommandGroup: ({ children }: any) => <div>{children}</div>,
  CommandItem: ({ children, onSelect }: any) => (
    <button type='button' onClick={onSelect}>
      {children}
    </button>
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
}))

describe('CreateCasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useIntakesListQueryMock.mockReturnValue({
      data: {
        items: [
          {
            intakeId: 'intake-1',
            displayId: 'INT-001',
            client: { name: 'Cliente Um', maskedTaxId: '***.123.***-**' },
          } as IntakeListItem,
        ],
      },
      isLoading: false,
    })
  })
  afterEach(cleanup)

  it('renders the case form and requires an explicit initial manager', () => {
    render(<CreateCasePage />)

    expect(screen.getByText('Novo Caso')).toBeTruthy()
    expect(screen.getByText('Gestor inicial')).toBeTruthy()
    expect(screen.getByText('Selecione um advogado ativo.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Criar Caso' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('lets the user select an active lawyer as the initial manager', () => {
    render(<CreateCasePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar gestor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar Advogada Teste' }))

    expect(screen.getByText('Advogada Teste')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Trocar gestor' })).toBeTruthy()
  })

  it('filters intakes and lets the user choose the intake, manager and team member', () => {
    render(<CreateCasePage />)

    const intakeSearch = screen.getByPlaceholderText(
      'Digite o nome do cliente, CPF ou ID da triagem...',
    )
    fireEvent.change(intakeSearch, { target: { value: 'Cliente Um' } })
    expect(useIntakesListQueryMock).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      search: 'Cliente Um',
      status: 'contracted',
    })
    fireEvent.click(screen.getByRole('button', { name: /INT-001/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar gestor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar Advogada Teste' }))
    expect(screen.getByRole('button', { name: 'Criar Caso' })).toHaveProperty(
      'disabled',
      false,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar membro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar Colaborador Teste' }))
    expect(screen.getByText('Colaborador Teste')).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Remover Colaborador Teste' }),
    ).toBeDefined()
  })
})
