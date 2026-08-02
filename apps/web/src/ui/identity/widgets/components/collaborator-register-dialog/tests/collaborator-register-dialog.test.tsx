import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCollaboratorLegalAreasQuery } from '@/ui/identity/hooks/use-collaborator-legal-areas-query'
import { useCollaboratorLegalTopicsQuery } from '@/ui/identity/widgets/components/collaborator-expertise-group/use-collaborator-legal-topics-query'
import { useRegisterCollaboratorAction } from '../use-register-collaborator-action'

import { CollaboratorRegisterDialog } from '../index'

vi.mock('@/ui/identity/hooks/use-collaborator-legal-areas-query', () => ({
  useCollaboratorLegalAreasQuery: vi.fn(),
}))

vi.mock(
  '@/ui/identity/widgets/components/collaborator-expertise-group/use-collaborator-legal-topics-query',
  () => ({
    useCollaboratorLegalTopicsQuery: vi.fn(),
  }),
)

vi.mock('../use-register-collaborator-action', () => ({
  useRegisterCollaboratorAction: vi.fn(),
}))

const useLegalAreasMock = vi.mocked(useCollaboratorLegalAreasQuery)
const useLegalTopicsMock = vi.mocked(useCollaboratorLegalTopicsQuery)
const useRegisterMock = vi.mocked(useRegisterCollaboratorAction)

const areas = [
  {
    id: 'area-civil',
    name: 'Direito civil',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'area-labor',
    name: 'Direito trabalhista',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'area-tax',
    name: 'Direito tributário',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const topicsByArea = {
  'area-civil': [
    {
      id: 'topic-contracts',
      legalAreaId: 'area-civil',
      name: 'Contratos',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'topic-family',
      legalAreaId: 'area-civil',
      name: 'Família',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  'area-labor': [
    {
      id: 'topic-employment',
      legalAreaId: 'area-labor',
      name: 'Relações de trabalho',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  'area-tax': [
    {
      id: 'topic-tax',
      legalAreaId: 'area-tax',
      name: 'Tributos',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
}

async function chooseOption(label: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: label }))
  fireEvent.click(await screen.findByRole('option', { name: option }))
}

function toggleTopics(areaIndex: number) {
  fireEvent.click(
    screen.getByRole('combobox', { name: `Temas jurídicos da área ${areaIndex}` }),
  )
}

describe('CollaboratorRegisterDialog [POST /collaborators form]', () => {
  const registerCollaborator = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    HTMLElement.prototype.scrollIntoView = vi.fn()
    useLegalAreasMock.mockReturnValue({
      legalAreas: areas,
      legalAreasError: null,
      isLoadingLegalAreas: false,
    })
    useLegalTopicsMock.mockImplementation((areaId) => ({
      legalTopics: areaId
        ? (topicsByArea[areaId as keyof typeof topicsByArea] ?? [])
        : [],
      legalTopicsError: null,
      isLoadingLegalTopics: false,
    }))
    useRegisterMock.mockReturnValue({
      registerCollaborator,
      isRegisteringCollaborator: false,
      registerCollaboratorError: null,
    })
  })

  afterEach(cleanup)

  it('keeps groups independent, prevents duplicate areas, and clears topics when an area changes', async () => {
    render(<CollaboratorRegisterDialog open onOpenChange={vi.fn()} />)

    await chooseOption('Perfil', 'Advogado')
    await chooseOption('Área jurídica 1', 'Direito civil')
    toggleTopics(1)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Contratos' }))

    toggleTopics(1)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar área de atuação' }))
    await chooseOption('Área jurídica 2', 'Direito trabalhista')
    toggleTopics(2)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Relações de trabalho' }))

    expect(screen.getByText('Contratos')).toBeTruthy()
    expect(screen.getAllByText('Relações de trabalho').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Remover área' })).toHaveLength(2)

    toggleTopics(2)
    await chooseOption('Área jurídica 1', 'Direito tributário')
    toggleTopics(1)

    expect(screen.queryByRole('checkbox', { name: 'Contratos' })).toBeNull()
    expect(
      screen.getByRole('checkbox', { name: 'Tributos' }).getAttribute('aria-checked'),
    ).toBe('false')
    toggleTopics(1)
    toggleTopics(2)
    expect(
      screen
        .getByRole('checkbox', { name: 'Relações de trabalho' })
        .getAttribute('aria-checked'),
    ).toBe('true')

    fireEvent.click(screen.getAllByRole('button', { name: 'Remover área' })[0])
    expect(screen.queryByRole('button', { name: 'Remover área' })).toBeNull()
    expect(screen.getAllByRole('combobox', { name: /Área jurídica/ })).toHaveLength(1)
  }, 15000)

  it('submits the schema-compatible expertise array without duplicating areas', async () => {
    render(<CollaboratorRegisterDialog open onOpenChange={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'lawyer@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Nome profissional'), {
      target: { value: 'Dra. Ana' },
    })
    await chooseOption('Perfil', 'Advogado')
    await chooseOption('Área jurídica 1', 'Direito civil')
    toggleTopics(1)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Contratos' }))
    const form = screen.getByRole('button', { name: 'Criar colaborador' }).closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form as HTMLFormElement)

    await waitFor(() => expect(registerCollaborator).toHaveBeenCalledOnce())
    expect(registerCollaborator).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: 'lawyer',
        legalExpertises: [
          { legalAreaId: 'area-civil', legalTopicIds: ['topic-contracts'] },
        ],
      }),
    )
  })

  it('blocks legal-area selection and submission while areas are loading', async () => {
    useLegalAreasMock.mockReturnValue({
      legalAreas: [],
      legalAreasError: null,
      isLoadingLegalAreas: true,
    })

    render(<CollaboratorRegisterDialog open onOpenChange={vi.fn()} />)

    await chooseOption('Perfil', 'Advogado')

    expect(screen.getByRole('status').textContent).toContain('Carregando áreas jurídicas')
    expect(
      screen
        .getByRole('combobox', { name: 'Temas jurídicos da área 1' })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      (screen.getByRole('combobox', { name: 'Área jurídica 1' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Criar colaborador' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('announces an area error and blocks legal-area selection and submission', async () => {
    useLegalAreasMock.mockReturnValue({
      legalAreas: [],
      legalAreasError: new Error('catalog unavailable'),
      isLoadingLegalAreas: false,
    })

    render(<CollaboratorRegisterDialog open onOpenChange={vi.fn()} />)

    await chooseOption('Perfil', 'Advogado')

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar as áreas jurídicas',
    )
    expect(
      screen
        .getByRole('combobox', { name: 'Temas jurídicos da área 1' })
        .getAttribute('aria-disabled'),
    ).toBe('true')
    expect(
      (screen.getByRole('combobox', { name: 'Área jurídica 1' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Criar colaborador' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('blocks submission while the selected area topics are loading or unavailable', async () => {
    useLegalTopicsMock.mockReturnValue({
      legalTopics: [],
      legalTopicsError: new Error('topics unavailable'),
      isLoadingLegalTopics: true,
    })

    render(<CollaboratorRegisterDialog open onOpenChange={vi.fn()} />)

    await chooseOption('Perfil', 'Advogado')
    await chooseOption('Área jurídica 1', 'Direito civil')
    toggleTopics(1)

    expect(screen.getByText('Carregando temas jurídicos…')).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Criar colaborador' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
