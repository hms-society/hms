import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'
import ChecklistsTemplatesPage from '../index'
import { useChecklistsTemplates } from '../use-checklist-template'

vi.mock('../use-checklist-template', () => ({ useChecklistsTemplates: vi.fn() }))

const useChecklistsTemplatesMock = vi.mocked(useChecklistsTemplates)
const setSearchMock = vi.fn()
const setActiveAreaIdMock = vi.fn()
const toggleRequiredMock = vi.fn()
const changeDocumentTypeMock = vi.fn()
const removeDocumentMock = vi.fn()
const addDocumentMock = vi.fn()
const saveTemplateMock = vi.fn()

describe('ChecklistsTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChecklistsTemplatesMock.mockReturnValue({
      areas: [
        { id: 'civil', name: 'Cível', documentCount: 1, templateId: 'template-civil' },
        { id: 'labor', name: 'Trabalhista', documentCount: 0 },
      ],
      activeArea: {
        id: 'civil',
        name: 'Cível',
        documentCount: 1,
        templateId: 'template-civil',
      },
      activeAreaId: 'civil',
      documents: [
        {
          id: 'document-1',
          name: 'Procuração',
          types: [ChecklistDocumentType.Pdf],
          required: true,
        },
      ],
      error: null,
      isLoading: false,
      isSaving: false,
      saveMessage: undefined,
      search: '',
      setSearch: setSearchMock,
      setActiveAreaId: setActiveAreaIdMock,
      toggleRequired: toggleRequiredMock,
      changeDocumentType: changeDocumentTypeMock,
      removeDocument: removeDocumentMock,
      addDocument: addDocumentMock,
      saveTemplate: saveTemplateMock,
    })
  })

  afterEach(cleanup)

  it('renders loading, error and save feedback states', () => {
    useChecklistsTemplatesMock.mockReturnValue({
      ...useChecklistsTemplatesMock(),
      error: new Error('query failed'),
      isLoading: true,
      isSaving: true,
      saveMessage: 'Template de checklist salvo.',
    })

    render(<ChecklistsTemplatesPage />)

    expect(screen.getByText('Carregando templates de checklist...')).toBeTruthy()
    expect(
      screen.getByText('Não foi possível carregar ou salvar os templates de checklist.'),
    ).toBeTruthy()
    expect(screen.getByText('Template de checklist salvo.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Salvando/ })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('wires area selection, search, row actions, save and add-document dialog', () => {
    render(<ChecklistsTemplatesPage initialAreaId='civil' />)

    fireEvent.click(screen.getByRole('button', { name: /Trabalhista/ }))
    expect(setActiveAreaIdMock).toHaveBeenCalledWith('labor')

    fireEvent.change(screen.getByPlaceholderText('Buscar documento por nome...'), {
      target: { value: 'Proc' },
    })
    expect(setSearchMock).toHaveBeenCalledWith('Proc')
    fireEvent.click(screen.getByRole('switch'))
    expect(toggleRequiredMock).toHaveBeenCalledWith('document-1')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Procuração' }))
    expect(removeDocumentMock).toHaveBeenCalledWith('document-1')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Template de Checklist' }))
    expect(saveTemplateMock).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Documento' }))
    fireEvent.change(screen.getByLabelText(/Nome do Documento/), {
      target: { value: '  Identidade  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tipo de Arquivo Aceito *' }))
    fireEvent.click(screen.getByRole('button', { name: 'PDF' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao Template' }))

    expect(addDocumentMock).toHaveBeenCalledWith(
      'Identidade',
      [ChecklistDocumentType.Pdf],
      true,
    )
  })

  it('shows the empty checklist state and allows opening the add form', () => {
    useChecklistsTemplatesMock.mockReturnValue({
      ...useChecklistsTemplatesMock(),
      documents: [],
      search: 'absent',
    })

    render(<ChecklistsTemplatesPage />)

    expect(screen.getByText('Nenhum documento encontrado')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Adicionar Documento' })[1])
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
