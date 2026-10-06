import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { LegalCatalogAdminPage } from '../index'
import { useLegalCatalogAdminPage } from '../use-legal-catalog-admin-page'

vi.mock('../use-legal-catalog-admin-page', () => ({
  useLegalCatalogAdminPage: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useLegalCatalogAdminPageMock = vi.mocked(useLegalCatalogAdminPage)
const useNavigationMock = vi.mocked(useNavigation)
const navigateToMock = vi.fn()
const handleSaveDialogMock = vi.fn()
const handleToggleAreaMock = vi.fn()
const handleToggleTopicMock = vi.fn()
const openEditAreaDialogMock = vi.fn()
const openEditTopicDialogMock = vi.fn()
const openNewAreaDialogMock = vi.fn()
const openNewTopicDialogMock = vi.fn()
const closeDialogMock = vi.fn()
const setActiveMock = vi.fn()
const setNameMock = vi.fn()
const setSearchMock = vi.fn()
const setSelectedAreaIdMock = vi.fn()

const area = {
  id: 'area-labor',
  name: 'Trabalhista',
  active: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  topics: [
    {
      id: 'topic-overtime',
      legalAreaId: 'area-labor',
      name: 'Horas extras',
      active: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
}

type PageState = ReturnType<typeof useLegalCatalogAdminPage>

function makePageState(overrides: Partial<PageState> = {}): PageState {
  return {
    active: true,
    dialogState: undefined,
    error: null,
    feedback: undefined,
    filteredTopics: area.topics,
    isDialogOpen: false,
    isLoading: false,
    isSaving: false,
    legalAreas: [area],
    name: '',
    search: '',
    selectedArea: area,
    selectedAreaId: area.id,
    setActive: setActiveMock,
    setName: setNameMock,
    setSearch: setSearchMock,
    setSelectedAreaId: setSelectedAreaIdMock,
    closeDialog: closeDialogMock,
    handleSaveDialog: handleSaveDialogMock,
    handleToggleArea: handleToggleAreaMock,
    handleToggleTopic: handleToggleTopicMock,
    openEditAreaDialog: openEditAreaDialogMock,
    openEditTopicDialog: openEditTopicDialogMock,
    openNewAreaDialog: openNewAreaDialogMock,
    openNewTopicDialog: openNewTopicDialogMock,
    ...overrides,
  }
}

describe('LegalCatalogAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useLegalCatalogAdminPageMock.mockReturnValue(makePageState())
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  afterEach(cleanup)

  it('shows loading feedback while the catalog is being fetched', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(makePageState({ isLoading: true }))

    render(<LegalCatalogAdminPage />)

    expect(screen.getByText('Carregando áreas e tipos de demanda...').textContent).toBe(
      'Carregando áreas e tipos de demanda...',
    )
    expect(screen.queryByRole('heading', { name: 'Áreas do direito' })).toBeNull()
  })

  it('shows a recovery message when loading or saving failed', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(
      makePageState({ error: new Error('service unavailable') }),
    )

    render(<LegalCatalogAdminPage />)

    expect(
      screen.getByText('Não foi possível carregar ou salvar o catálogo jurídico.')
        .textContent,
    ).toBe('Não foi possível carregar ou salvar o catálogo jurídico.')
  })

  it('renders the selected area and its topics with their statuses', () => {
    render(<LegalCatalogAdminPage />)

    expect(screen.getByRole('heading', { name: 'Trabalhista' }).textContent).toBe(
      'Trabalhista',
    )
    expect(screen.getByText('1 áreas cadastradas').textContent).toBe(
      '1 áreas cadastradas',
    )
    expect(screen.getByText('Ativa').textContent).toBe('Ativa')
    expect(screen.getByRole('cell', { name: 'Horas extras' }).textContent).toBe(
      'Horas extras',
    )
    expect(screen.getByRole('cell', { name: 'Ativo' }).textContent).toBe('Ativo')

    fireEvent.click(screen.getByRole('button', { name: /Editar área/ }))
    expect(openEditAreaDialogMock).toHaveBeenCalledWith(area)
    fireEvent.click(screen.getByRole('button', { name: /Editar$/ }))
    expect(openEditTopicDialogMock).toHaveBeenCalledWith(area.topics[0])
    fireEvent.click(screen.getByRole('button', { name: 'Inativar' }))
    expect(handleToggleTopicMock).toHaveBeenCalledWith(area.topics[0])
  })

  it('delegates area selection, filtering, toggles, and checklist navigation', () => {
    render(<LegalCatalogAdminPage />)

    fireEvent.click(screen.getByRole('button', { name: /Trabalhista/ }))
    expect(setSelectedAreaIdMock).toHaveBeenCalledWith('area-labor')

    fireEvent.change(screen.getByPlaceholderText('Buscar tipo de demanda...'), {
      target: { value: 'hora' },
    })
    expect(setSearchMock).toHaveBeenCalledWith('hora')

    fireEvent.click(screen.getByRole('switch', { name: 'Área ativa' }))
    expect(handleToggleAreaMock).toHaveBeenCalledWith(area)

    fireEvent.click(screen.getByRole('button', { name: 'Configurar checklist' }))
    expect(navigateToMock).toHaveBeenCalledWith('checklistTemplates', {
      search: { legalAreaId: 'area-labor' },
    })
  })

  it('opens the new-area dialog and delegates save and close actions', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(
      makePageState({
        active: false,
        dialogState: { kind: 'area' },
        isDialogOpen: true,
        name: 'Consumidor',
      }),
    )

    render(<LegalCatalogAdminPage />)

    expect(screen.getByRole('dialog').getAttribute('role')).toBe('dialog')
    expect(
      screen.getByRole('heading', { name: 'Nova área do direito' }).textContent,
    ).toBe('Nova área do direito')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Consumidor')
    expect(
      (screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled,
    ).toBe(false)

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Família' } })
    expect(setNameMock).toHaveBeenCalledWith('Família')
    fireEvent.click(screen.getByRole('switch', { name: 'Disponível para novos usos' }))
    expect(setActiveMock).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(handleSaveDialogMock).toHaveBeenCalledOnce()
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' })
    expect(cancelButtons.length).toBeGreaterThan(1)
    fireEvent.click(cancelButtons[cancelButtons.length - 1])
    expect(closeDialogMock).toHaveBeenCalled()
  })

  it('shows feedback and an empty-filter result when provided by the hook', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(
      makePageState({ feedback: 'Configuração salva.', filteredTopics: [] }),
    )

    render(<LegalCatalogAdminPage />)

    expect(screen.getByText('Configuração salva.').textContent).toBe(
      'Configuração salva.',
    )
    expect(screen.getByText('Nenhum tipo de demanda encontrado.').textContent).toBe(
      'Nenhum tipo de demanda encontrado.',
    )
  })

  it('shows the empty selection state and prevents adding a topic without an area', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(
      makePageState({
        filteredTopics: [],
        legalAreas: [],
        selectedArea: undefined,
        selectedAreaId: '',
      }),
    )

    render(<LegalCatalogAdminPage />)

    expect(screen.getByRole('heading', { name: 'Selecione uma área' }).textContent).toBe(
      'Selecione uma área',
    )
    expect(
      (screen.getByRole('button', { name: 'Novo tipo' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.queryByRole('button', { name: 'Editar área' })).toBeNull()
  })

  it('opens the new-area dialog from the page action', () => {
    render(<LegalCatalogAdminPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Nova área' }))

    expect(openNewAreaDialogMock).toHaveBeenCalledOnce()
  })

  it('disables saving while a request is pending', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(
      makePageState({
        dialogState: { kind: 'area' },
        isDialogOpen: true,
        isSaving: true,
        name: 'Consumidor',
      }),
    )

    render(<LegalCatalogAdminPage />)

    const saveButton = screen.getByRole('button', { name: 'Salvando...' })
    expect((saveButton as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables saving for a blank name', () => {
    useLegalCatalogAdminPageMock.mockReturnValue(
      makePageState({
        dialogState: { kind: 'area' },
        isDialogOpen: true,
        name: '   ',
      }),
    )

    render(<LegalCatalogAdminPage />)

    const saveButton = screen.getByRole('button', { name: 'Salvar' })
    expect((saveButton as HTMLButtonElement).disabled).toBe(true)
  })
})
