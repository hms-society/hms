import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type { IntakeListItem } from '@hms/core/intake/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { CaseDetailsPanel } from '../case-details-panel'
import { CaseTitleField } from '../case-title-field'
import { CreateCaseFormActions } from '../create-case-form-actions'
import { InitialManagerCard } from '../initial-manager-card'
import { IntakeSelector } from '../intake-selector'
import { LegalAreaTopicFields } from '../legal-area-topic-fields'
import { ManagerSuggestionState } from '../manager-suggestion-state'
import { TeamRoster } from '../team-roster'
import { TeamRosterMember } from '../team-roster-member'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: any) => <a href='/mock'>{children}</a>,
}))

vi.mock('@/ui/shadcn/select', () => ({
  Select: ({ children, onValueChange, value, disabled }: any) => (
    <div data-testid='legal-select' data-value={value} data-disabled={disabled}>
      {children}
      <button type='button' onClick={() => onValueChange('selected-option')}>
        choose option
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}))

vi.mock('@/ui/shadcn/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children, onOpenAutoFocus }: any) => (
    <div>
      {children}
      <button
        type='button'
        onClick={() => onOpenAutoFocus?.({ preventDefault: preventAutoFocus })}
      >
        Preserve input focus
      </button>
    </div>
  ),
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}))

const preventAutoFocus = vi.hoisted(() => vi.fn())

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

const intake = {
  intakeId: 'intake-1',
  displayId: 'INT-001',
  client: { name: 'Cliente Um', maskedTaxId: '***.123.***-**' },
} as IntakeListItem

const manager = {
  collaboratorId: 'collaborator-1',
  professionalName: 'Ana Advogada',
  email: 'ana@example.test',
  profile: 'lawyer',
  status: 'active',
} as any

const defaultValues = {
  title: '',
  intakeId: '',
  legalAreaId: '',
  legalTopicId: '',
  description: '',
  initialManagerCollaboratorId: '',
  team: [],
  operationId: 'operation-1',
} as CreateCaseData

const fieldArrayUpdate = vi.fn()

function IntakeHarness({
  initialValue = '',
  initialOpen = true,
  isLoading = false,
}: {
  initialValue?: string
  initialOpen?: boolean
  isLoading?: boolean
}) {
  const form = useForm<CreateCaseData>({
    defaultValues: { ...defaultValues, intakeId: initialValue },
  })
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [search, setSearch] = useState('')
  return (
    <>
      <IntakeSelector
        control={form.control}
        intakes={isLoading ? [] : [intake]}
        isLoading={isLoading}
        isOpen={isOpen}
        search={search}
        onOpenChange={setIsOpen}
        onSearchChange={setSearch}
        onSelectIntake={(intakeId, onChange) => onChange(intakeId)}
      />
      <output data-testid='selected-intake'>{form.watch('intakeId')}</output>
      <output data-testid='intake-open'>{String(isOpen)}</output>
    </>
  )
}

function LegalFieldsHarness() {
  const form = useForm<CreateCaseData>({
    defaultValues: {
      ...defaultValues,
      legalAreaId: undefined as unknown as string,
      legalTopicId: undefined as unknown as string,
    },
  })
  return (
    <>
      <LegalAreaTopicFields
        control={form.control}
        setValue={form.setValue}
        legalAreas={[{ id: 'area-1', name: 'Cível' }]}
        legalTopics={[{ id: 'topic-1', name: 'Contratos' }]}
        selectedLegalAreaId={form.watch('legalAreaId')}
        areaError='Área obrigatória'
        topicError='Tema obrigatório'
      />
      <output data-testid='legal-topic'>{form.watch('legalTopicId')}</output>
    </>
  )
}

function CaseDetailsHarness() {
  const form = useForm<CreateCaseData>({ defaultValues })
  useEffect(() => {
    form.setError('title', { message: 'Título obrigatório' })
    form.setError('intakeId', { message: 'Triagem obrigatória' })
    form.setError('legalAreaId', { message: 'Área obrigatória' })
    form.setError('legalTopicId', { message: 'Tema obrigatório' })
  }, [form])
  return (
    <CaseDetailsPanel
      form={form}
      intakes={[]}
      isLoadingIntakes={false}
      intakeOpen={false}
      intakeSearch=''
      legalAreas={[]}
      legalTopics={[]}
      selectedLegalAreaId=''
      onIntakeOpenChange={vi.fn()}
      onIntakeSearchChange={vi.fn()}
      onIntakeSelect={vi.fn()}
    />
  )
}

function CaseTitleHarness() {
  const form = useForm<CreateCaseData>({ defaultValues })
  return <CaseTitleField register={form.register} error='Título obrigatório' />
}

describe('case creation page widgets', () => {
  afterEach(cleanup)

  it('renders intake loading, empty and selectable states and clears a selected intake on search', () => {
    render(<IntakeHarness isLoading />)
    expect(screen.getByText('Buscando...')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Preserve input focus' }))
    expect(preventAutoFocus).toHaveBeenCalledOnce()
    cleanup()

    render(<IntakeHarness />)
    expect(screen.getByText('Nenhuma triagem contratada encontrada.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /INT-001/ }))
    expect(screen.getByTestId('selected-intake').textContent).toBe('intake-1')
    cleanup()

    render(<IntakeHarness initialOpen={false} />)
    const closedIntakeInput = screen.getByPlaceholderText(
      'Digite o nome do cliente, CPF ou ID da triagem...',
    )
    fireEvent.click(closedIntakeInput)
    expect(screen.getByTestId('intake-open').textContent).toBe('true')
    cleanup()

    render(<IntakeHarness initialValue='intake-1' initialOpen={false} />)
    const intakeInput = screen.getByPlaceholderText(
      'Digite o nome do cliente, CPF ou ID da triagem...',
    )
    fireEvent.change(intakeInput, { target: { value: 'Cliente' } })
    expect(screen.getByTestId('selected-intake').textContent).toBe('')
    expect((intakeInput as HTMLInputElement).value).toBe('Cliente')
  })

  it('renders legal-area and topic errors and clears a previous topic after area changes', () => {
    render(<LegalFieldsHarness />)
    expect(screen.getByText('Área obrigatória')).toBeTruthy()
    expect(screen.getByText('Tema obrigatório')).toBeTruthy()
    const [areaSelect, topicSelect] = screen.getAllByTestId('legal-select')
    expect(areaSelect.getAttribute('data-disabled')).toBeNull()
    expect(topicSelect.getAttribute('data-disabled')).toBe('true')

    fireEvent.click(screen.getAllByRole('button', { name: 'choose option' })[0])
    expect(screen.getByTestId('legal-topic').textContent).toBe('')
    expect(screen.getAllByTestId('legal-select')[1].getAttribute('data-disabled')).toBe(
      'false',
    )
  })

  it('renders details and title validation messages and optional description', () => {
    const { rerender } = render(<CaseTitleHarness />)
    expect(screen.getByText('Título obrigatório')).toBeTruthy()
    rerender(<CaseDetailsHarness />)
    expect(screen.getByText('Detalhes do Caso')).toBeTruthy()
    expect(screen.getByText('Triagem obrigatória')).toBeTruthy()
    expect(screen.getByText(/Descrição/)).toBeTruthy()
  })

  it('shows manager suggestion loading, error and suggested states', () => {
    const { rerender } = render(
      <ManagerSuggestionState isLoading error={null} isSuggested={false} />,
    )
    expect(screen.getByText('Buscando sugestão da triagem…')).toBeTruthy()
    rerender(<ManagerSuggestionState isLoading={false} error={{}} isSuggested />)
    expect(
      screen.getByText(
        'Não foi possível carregar a sugestão. Selecione o gestor manualmente.',
      ),
    ).toBeTruthy()
    rerender(<ManagerSuggestionState isLoading={false} error={null} isSuggested />)
    expect(
      screen.getByText('Sugerido com base no advogado responsável pela triagem.'),
    ).toBeTruthy()
    rerender(
      <ManagerSuggestionState isLoading={false} error={null} isSuggested={false} />,
    )
    expect(screen.queryByText(/sugestão da triagem/)).toBeNull()
  })

  it('renders manager suggestion, selected profile, and manager selection error', () => {
    render(
      <InitialManagerCard
        manager={manager}
        openingSource={{ suggestedManager: manager } as any}
        isLoadingSuggestion={false}
        suggestionError={null}
        selectionError='Selecione um gestor'
        onSelectManager={vi.fn()}
      />,
    )
    expect(screen.getByText('Ana Advogada')).toBeTruthy()
    expect(screen.getByText('Selecione um gestor')).toBeTruthy()
    expect(screen.getByText(/Sugerido com base/)).toBeTruthy()
  })

  it('renders an empty roster and updates or removes selected members', () => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    const { rerender } = render(
      <TeamRoster
        fields={[]}
        members={[]}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={fieldArrayUpdate as any}
      />,
    )
    expect(screen.getByText('Nenhum outro membro selecionado.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Adicionar membro/ }))
    expect(onAdd).toHaveBeenCalledOnce()

    rerender(
      <TeamRoster
        fields={[
          {
            id: 'field-1',
            collaboratorId: manager.collaboratorId,
            role: CaseMemberRole.Collaborator,
          },
        ]}
        members={[manager]}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={fieldArrayUpdate as any}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'choose option' }))
    expect(fieldArrayUpdate).toHaveBeenCalledWith(0, {
      id: 'field-1',
      collaboratorId: manager.collaboratorId,
      role: 'selected-option',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remover Ana Advogada' }))
    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('renders member fallback labels when roster data is missing', () => {
    render(
      <TeamRosterMember
        role={CaseMemberRole.Collaborator}
        onRoleChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getAllByText('Colaborador').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Remover colaborador' })).toBeTruthy()
  })

  it('disables creation until ready and shows the pending label while creating', () => {
    const { rerender } = render(
      <CreateCaseFormActions isCreating={false} canCreate={false} />,
    )
    expect(screen.getByRole('button', { name: 'Criar Caso' })).toHaveProperty(
      'disabled',
      true,
    )
    rerender(<CreateCaseFormActions isCreating canCreate />)
    expect(screen.getByRole('button', { name: 'Criando...' })).toHaveProperty(
      'disabled',
      true,
    )
  })
})
