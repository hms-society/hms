import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ClaimsSection } from '../sections/claim-section'
import { ConclusionSection } from '../sections/conclusion-section'
import type { ConclusionSectionProps } from '../sections/conclusion-section'
import { LawyerNotesSection } from '../sections/lawyer-notes-section'
import { LegalAreaSection } from '../sections/legal-area-section'
import type { LegalAreaSectionProps } from '../sections/legal-area-section'
import { QualificationSection } from '../sections/qualification-section'
import type { QualificationSectionProps } from '../sections/qualification-section'
import { TimelineSection } from '../sections/timeline-section'

describe('ClaimsSection', () => {
  afterEach(cleanup)

  it('shows the empty state and adds a claim through its dialog', () => {
    const onAddClaim = vi.fn()
    render(<ClaimsSection claims={[]} onAddClaim={onAddClaim} />)

    expect(screen.getByText('Nenhum pedido registrado ainda.')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pedido manualmente' }))
    fireEvent.change(screen.getByLabelText('Título do pedido *'), {
      target: { value: 'Restituição dos valores' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pedido' }))

    expect(onAddClaim).toHaveBeenCalledWith({
      title: 'Restituição dos valores',
      summary: '',
    })
    expect(
      screen.queryByRole('heading', { name: 'Adicionar pedido jurídico' }),
    ).toBeNull()
  })

  it('opens an existing claim for editing and delegates removal', () => {
    const onAddClaim = vi.fn()
    const onRemoveClaim = vi.fn()
    const claim = {
      id: 'claim-1',
      title: 'Horas extras',
      summary: 'Jornada além do limite.',
      isSuggested: true,
    }
    render(
      <ClaimsSection
        claims={[claim]}
        onAddClaim={onAddClaim}
        onRemoveClaim={onRemoveClaim}
      />,
    )

    expect(screen.getByText('Sugerido')).not.toBeNull()
    fireEvent.click(screen.getByTitle('Editar pedido'))
    expect(screen.getByRole('heading', { name: 'Editar pedido jurídico' })).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Título do pedido *'), {
      target: { value: 'Horas extras e reflexos' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    fireEvent.click(screen.getByTitle('Excluir pedido'))

    expect(onAddClaim).toHaveBeenCalledWith({
      id: 'claim-1',
      title: 'Horas extras e reflexos',
      summary: 'Jornada além do limite.',
    })
    expect(onRemoveClaim).toHaveBeenCalledWith('claim-1')
  })

  it('renders claims without edit controls in read-only mode', () => {
    render(
      <ClaimsSection
        claims={[{ id: 'claim-1', title: 'Danos morais', summary: '' }]}
        isReadOnly
      />,
    )

    expect(screen.getByText('Danos morais')).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Adicionar pedido manualmente' }),
    ).toBeNull()
    expect(screen.queryByTitle('Editar pedido')).toBeNull()
    expect(screen.queryByTitle('Excluir pedido')).toBeNull()
  })
})

describe('TimelineSection', () => {
  afterEach(cleanup)

  const fact = {
    id: 'fact-1',
    date: '17/03/2025',
    description: 'O contrato foi encerrado.',
    status: 'Controvertido',
  }

  it('shows an empty state and delegates adding a fact', () => {
    const onOpenAddModal = vi.fn()
    render(
      <TimelineSection
        facts={[]}
        onRemoveFact={vi.fn()}
        onEditFact={vi.fn()}
        onOpenAddModal={onOpenAddModal}
      />,
    )

    expect(screen.getByText('Nenhum fato registrado')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar fato manualmente' }))
    expect(onOpenAddModal).toHaveBeenCalledOnce()
  })

  it('shows the fact status and delegates edit and remove actions', () => {
    const onEditFact = vi.fn()
    const onRemoveFact = vi.fn()
    render(
      <TimelineSection
        facts={[fact]}
        onRemoveFact={onRemoveFact}
        onEditFact={onEditFact}
        onOpenAddModal={vi.fn()}
      />,
    )

    expect(screen.getByText('17/03/2025')).not.toBeNull()
    expect(screen.getByText('Controvertido')).not.toBeNull()
    const factCard = screen.getByText(fact.description).parentElement?.parentElement
    expect(factCard).not.toBeNull()
    const factActions = within(factCard as HTMLElement).getAllByRole('button')
    fireEvent.click(factActions[0])
    fireEvent.click(factActions[1])
    expect(onEditFact).toHaveBeenCalledWith(fact)
    expect(onRemoveFact).toHaveBeenCalledWith('fact-1')
  })

  it('hides fact actions in read-only mode', () => {
    render(
      <TimelineSection
        facts={[fact]}
        onRemoveFact={vi.fn()}
        onEditFact={vi.fn()}
        onOpenAddModal={vi.fn()}
        isReadOnly
      />,
    )

    expect(screen.getByText('O contrato foi encerrado.')).not.toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Adicionar fato manualmente' }),
    ).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Recolher card' })).not.toBeNull()
  })
})

const getLegalAreaProps = (
  overrides: Partial<LegalAreaSectionProps> = {},
): LegalAreaSectionProps => ({
  legalAreaId: 'area-1',
  setLegalAreaId: vi.fn(),
  legalTopicId: 'topic-1',
  setLegalTopicId: vi.fn(),
  areasList: [{ id: 'area-2', name: 'Trabalhista' }],
  topicsList: [
    { id: 'topic-1', legalAreaId: 'area-1', name: 'Rescisão' },
    { id: 'topic-2', legalAreaId: 'area-2', name: 'Benefícios' },
    { id: 'topic-shared', name: 'Tema compartilhado' },
  ],
  ...overrides,
})

describe('LegalAreaSection', () => {
  afterEach(cleanup)

  it('keeps selected values visible when absent from loaded options', () => {
    render(
      <LegalAreaSection
        {...getLegalAreaProps({ legalTopicId: 'topic-legacy', topicsList: [] })}
        fallbackAreaName='Área importada'
        fallbackTopicName='Tema importado'
      />,
    )

    expect(screen.getByRole('heading', { name: 'Área e Tema' })).not.toBeNull()
    expect(screen.getByRole('combobox', { name: 'Área jurídica' }).textContent).toContain(
      'Área importada',
    )
    expect(screen.getByRole('combobox', { name: 'Tema jurídico' }).textContent).toContain(
      'Tema importado',
    )
  })

  it('disables both selectors for a read-only consultation', () => {
    render(<LegalAreaSection {...getLegalAreaProps()} isReadOnly />)

    expect(
      (screen.getByRole('combobox', { name: 'Área jurídica' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('combobox', { name: 'Tema jurídico' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})

const getQualificationProps = (
  overrides: Partial<QualificationSectionProps> = {},
): QualificationSectionProps => ({
  personType: 'individual',
  setPersonType: vi.fn(),
  fullName: 'Ana Silva',
  setFullName: vi.fn(),
  cpf: '12345678900',
  setCpf: vi.fn(),
  rg: '',
  setRg: vi.fn(),
  birthDate: '',
  setBirthDate: vi.fn(),
  maritalStatus: '',
  setMaritalStatus: vi.fn(),
  nationality: '',
  setNationality: vi.fn(),
  profession: '',
  setProfession: vi.fn(),
  companyName: 'HMS Ltda.',
  setCompanyName: vi.fn(),
  tradeName: '',
  setTradeName: vi.fn(),
  stateRegistration: '',
  setStateRegistration: vi.fn(),
  constitutionDate: '',
  setConstitutionDate: vi.fn(),
  legalNature: '',
  setLegalNature: vi.fn(),
  legalRepresentative: '',
  setLegalRepresentative: vi.fn(),
  representativeRole: '',
  setRepresentativeRole: vi.fn(),
  phone: '11999990000',
  setPhone: vi.fn(),
  email: 'ana@example.com',
  setEmail: vi.fn(),
  origin: 'Website / Plataforma',
  linkedThirdParty: 'Empresa vinculada',
  setLinkedThirdParty: vi.fn(),
  hmsResponsible: 'Maria Atendente',
  setHmsResponsible: vi.fn(),
  cep: '',
  setCep: vi.fn(),
  street: '',
  setStreet: vi.fn(),
  number: '',
  setNumber: vi.fn(),
  complement: '',
  setComplement: vi.fn(),
  neighborhood: '',
  setNeighborhood: vi.fn(),
  city: '',
  setCity: vi.fn(),
  uf: '',
  setUf: vi.fn(),
  consultationId: 'consultation-qualification',
  ...overrides,
})

describe('QualificationSection', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('formats RG digits and shows the linked third party for an individual', () => {
    const setRg = vi.fn()
    render(<QualificationSection {...getQualificationProps({ setRg })} />)

    expect((screen.getByLabelText('Terceiro vinculado') as HTMLInputElement).value).toBe(
      'Empresa vinculada',
    )
    fireEvent.change(screen.getByLabelText('RG'), { target: { value: '123456789' } })

    expect(setRg).toHaveBeenCalledWith('12.345.678-9')
  })

  it('switches to business fields and makes all fields non-editable when read-only', () => {
    const setPersonType = vi.fn()
    const { rerender } = render(
      <QualificationSection {...getQualificationProps({ setPersonType })} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pessoa Jurídica' }))
    expect(setPersonType).toHaveBeenCalledWith('legal')

    rerender(
      <QualificationSection
        {...getQualificationProps({ personType: 'legal', isReadOnly: true })}
      />,
    )
    expect((screen.getByLabelText('Razão social') as HTMLInputElement).value).toBe(
      'HMS Ltda.',
    )
    expect(
      (screen.getByLabelText('Razão social') as HTMLInputElement).matches(':disabled'),
    ).toBe(true)
    expect(screen.queryByLabelText('Nome completo')).toBeNull()
  })

  it('routes company and address edits to their corresponding field callbacks', () => {
    const props = getQualificationProps({ personType: 'legal' })
    render(<QualificationSection {...props} />)

    fireEvent.change(screen.getByLabelText('CNPJ'), {
      target: { value: '12345678000190' },
    })
    fireEvent.change(screen.getByLabelText('Natureza jurídica'), {
      target: { value: 'Sociedade limitada' },
    })
    fireEvent.change(screen.getByLabelText('Representante legal'), {
      target: { value: 'Ana Silva' },
    })
    fireEvent.change(screen.getByLabelText('Cargo do representante'), {
      target: { value: 'Diretora' },
    })
    fireEvent.change(screen.getByLabelText('CEP'), { target: { value: '01001000' } })
    fireEvent.change(screen.getByLabelText('Logradouro'), {
      target: { value: 'Rua da Justiça' },
    })
    fireEvent.change(screen.getByLabelText('Número'), { target: { value: '42' } })
    fireEvent.change(screen.getByLabelText('Complemento'), {
      target: { value: 'Sala 5' },
    })
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Centro' } })
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'SP' } })

    expect(props.setCpf).toHaveBeenCalledWith('12345678000190')
    expect(props.setLegalNature).toHaveBeenCalledWith('Sociedade limitada')
    expect(props.setLegalRepresentative).toHaveBeenCalledWith('Ana Silva')
    expect(props.setRepresentativeRole).toHaveBeenCalledWith('Diretora')
    expect(props.setCep).toHaveBeenCalledWith('01001000')
    expect(props.setStreet).toHaveBeenCalledWith('Rua da Justiça')
    expect(props.setNumber).toHaveBeenCalledWith('42')
    expect(props.setComplement).toHaveBeenCalledWith('Sala 5')
    expect(props.setNeighborhood).toHaveBeenCalledWith('Centro')
    expect(props.setCity).toHaveBeenCalledWith('São Paulo')
    expect(props.setUf).toHaveBeenCalledWith('SP')
  })

  it('restores saved extra fields and persists current values by consultation', async () => {
    localStorage.setItem(
      'extra_client_fields_consultation-qualification',
      JSON.stringify({ rg: '12.345.678-9', profession: 'Advogada' }),
    )
    const setRg = vi.fn()
    const setProfession = vi.fn()
    render(<QualificationSection {...getQualificationProps({ setRg, setProfession })} />)

    await waitFor(() => {
      expect(setRg).toHaveBeenCalledWith('12.345.678-9')
      expect(setProfession).toHaveBeenCalledWith('Advogada')
    })
    expect(
      JSON.parse(
        localStorage.getItem('extra_client_fields_consultation-qualification') ?? '{}',
      ),
    ).toMatchObject({
      rg: '',
      profession: '',
    })
  })
})

const getConclusionProps = (
  overrides: Partial<ConclusionSectionProps> = {},
): ConclusionSectionProps => ({
  mainLegalQuestion: 'Questão do cliente',
  setMainLegalQuestion: vi.fn(),
  clientGuidance: 'Orientação prestada',
  setClientGuidance: vi.fn(),
  viability: 'Viável',
  setViability: vi.fn(),
  decision: 'Prosseguir para contratação',
  setDecision: vi.fn(),
  ...overrides,
})

describe('ConclusionSection', () => {
  afterEach(cleanup)

  it('shows required-field errors after empty fields lose focus', () => {
    render(
      <ConclusionSection
        {...getConclusionProps({
          mainLegalQuestion: '',
          clientGuidance: '',
          viability: '',
          decision: '',
        })}
      />,
    )

    fireEvent.blur(screen.getByLabelText(/Questão jurídica principal/))
    fireEvent.blur(screen.getByLabelText(/Orientação prestada ao cliente/))
    fireEvent.click(screen.getByRole('button', { name: 'Viável' }))
    fireEvent.click(screen.getByRole('button', { name: 'Prosseguir para contratação' }))

    expect(screen.getByText('A questão jurídica principal é obrigatória.')).not.toBeNull()
    expect(
      screen.getByText('A orientação prestada ao cliente é obrigatória.'),
    ).not.toBeNull()
    expect(screen.getByText('A decisão de encaminhamento é obrigatória.')).not.toBeNull()
  })

  it('disables routing decisions when marked not viable and delegates available choices', () => {
    const setViability = vi.fn()
    const setDecision = vi.fn()
    render(
      <ConclusionSection
        {...getConclusionProps({
          viability: 'Inviável',
          decision: 'Encerrar sem contratação',
          setViability,
          setDecision,
        })}
      />,
    )

    const proceedButton = screen.getByRole('button', {
      name: 'Prosseguir para contratação',
    })
    expect((proceedButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Viável' }))
    expect(setViability).toHaveBeenCalledWith('Viável')
    expect((proceedButton as HTMLButtonElement).disabled).toBe(true)
    expect(
      (screen.getByLabelText('Questão jurídica principal *') as HTMLInputElement)
        .disabled,
    ).toBe(false)
  })

  it('renders supplied errors and makes conclusion controls read-only', () => {
    render(
      <ConclusionSection
        {...getConclusionProps({
          isReadOnly: true,
          errorMessage: 'Questão inválida',
          guidanceErrorMessage: 'Orientação inválida',
          viabilityErrorMessage: 'Viabilidade inválida',
          decisionErrorMessage: 'Decisão inválida',
        })}
      />,
    )

    expect(screen.getByText('Questão inválida')).not.toBeNull()
    expect(screen.getByText('Orientação inválida')).not.toBeNull()
    expect(screen.getByText('Viabilidade inválida')).not.toBeNull()
    expect(screen.getByText('Decisão inválida')).not.toBeNull()
    expect(
      screen.getByLabelText('Questão jurídica principal *').getAttribute('readonly'),
    ).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Viável' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})

describe('LawyerNotesSection', () => {
  afterEach(cleanup)

  it('renders current notes and delegates changes', () => {
    const setLawyerNotes = vi.fn()
    render(
      <LawyerNotesSection lawyerNotes='Nota inicial' setLawyerNotes={setLawyerNotes} />,
    )

    fireEvent.change(screen.getByPlaceholderText('Opcional — anotações adicionais...'), {
      target: { value: 'Nota revisada' },
    })

    expect(setLawyerNotes).toHaveBeenCalledWith('Nota revisada')
    expect(
      (
        screen.getByPlaceholderText(
          'Opcional — anotações adicionais...',
        ) as HTMLTextAreaElement
      ).value,
    ).toBe('Nota inicial')
  })

  it('keeps notes read-only when consultation is closed', () => {
    render(
      <LawyerNotesSection
        lawyerNotes='Nota encerrada'
        setLawyerNotes={vi.fn()}
        isReadOnly
      />,
    )

    expect(
      screen
        .getByPlaceholderText('Opcional — anotações adicionais...')
        .getAttribute('readonly'),
    ).not.toBeNull()
  })
})
