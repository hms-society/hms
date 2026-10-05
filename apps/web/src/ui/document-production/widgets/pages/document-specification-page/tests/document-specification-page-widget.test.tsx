import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentSpecificationPage } from '../use-document-specification-page'
import { DocumentSpecificationPage } from '..'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

vi.mock('../use-document-specification-page', () => ({
  useDocumentSpecificationPage: vi.fn(),
}))

vi.mock('@/ui/document-production/widgets/components/document-editor', () => ({
  DocumentEditor: () => <textarea aria-label='Conteúdo do template' readOnly />,
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, ...props }: AnchorProps) => <a {...props}>{children}</a>,
}))

const useDocumentSpecificationPageMock = vi.mocked(useDocumentSpecificationPage)

function createPageState(overrides: Record<string, unknown> = {}) {
  const noop = vi.fn()

  return {
    isLoading: false,
    isNotFound: false,
    detail: { isError: false },
    handleRetry: noop,
    activeTab: 'configuration',
    form: {
      register: () => ({ name: 'name', onBlur: noop, onChange: noop, ref: noop }),
      formState: { errors: {} },
    },
    application: { scope: 'global', moment: 'consultation' },
    modelName: 'Procuração',
    status: 'available',
    canSaveModel: false,
    isTemplateDirty: false,
    isConfigurationDirty: false,
    actions: {
      isCreating: false,
      isUpdatingConfiguration: false,
      isUpdatingTemplate: false,
      isDeleting: false,
    },
    handleTemplateSave: noop,
    handleTabChange: noop,
    toggleAvailability: noop,
    handleApplicationMoment: noop,
    handleApplicationScope: noop,
    isCatalogError: false,
    handleCatalogRetry: noop,
    catalog: { areas: { data: [], isError: false } },
    topics: { data: [], isError: false },
    handleAreaToggle: noop,
    handleTopicToggle: noop,
    handleDeleteDialogOpenChange: noop,
    handleDeleteRequest: noop,
    handleDeleteConfirm: noop,
    isDeleteDialogOpen: false,
    content: { type: 'doc', content: [] },
    handleContentChange: noop,
    handleEditorReady: noop,
    isTemplateEmpty: true,
    wordCount: 0,
    variables: [],
    insertVariable: null,
    handleAddVariable: noop,
    handleRemoveVariable: noop,
    handleUpdateVariable: noop,
    ...overrides,
  }
}

describe('DocumentSpecificationPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentSpecificationPageMock.mockReturnValue(
      createPageState() as unknown as ReturnType<typeof useDocumentSpecificationPage>,
    )
  })

  it('shows a loading skeleton while edit details are being fetched', () => {
    useDocumentSpecificationPageMock.mockReturnValue(
      createPageState({ isLoading: true }) as unknown as ReturnType<
        typeof useDocumentSpecificationPage
      >,
    )

    render(<DocumentSpecificationPage mode='edit' documentSpecificationId='spec-1' />)

    expect(screen.getByRole('main')).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Procuração' })).toBeNull()
  })

  it('offers a retry when the requested model is not found', () => {
    const handleRetry = vi.fn()
    useDocumentSpecificationPageMock.mockReturnValue(
      createPageState({ isNotFound: true, handleRetry }) as unknown as ReturnType<
        typeof useDocumentSpecificationPage
      >,
    )

    render(<DocumentSpecificationPage mode='edit' documentSpecificationId='missing' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(screen.getByRole('heading', { name: 'Modelo não encontrado' })).toBeDefined()
    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('offers recovery for a transient edit-detail failure', () => {
    const handleRetry = vi.fn()
    useDocumentSpecificationPageMock.mockReturnValue(
      createPageState({
        detail: { isError: true },
        handleRetry,
      }) as unknown as ReturnType<typeof useDocumentSpecificationPage>,
    )

    render(<DocumentSpecificationPage mode='edit' documentSpecificationId='spec-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      screen.getByRole('heading', { name: 'Não foi possível carregar o modelo' }),
    ).toBeDefined()
    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('renders configuration controls and disables saving until required data is ready', () => {
    render(<DocumentSpecificationPage mode='create' />)

    expect(screen.getByRole('heading', { name: 'Procuração' })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Nome do documento *' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Configuração' })).toBeDefined()
    expect(
      (screen.getByRole('button', { name: 'Salvar modelo' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('shows the template editor and word count on the template tab', () => {
    useDocumentSpecificationPageMock.mockReturnValue(
      createPageState({ activeTab: 'template', wordCount: 2 }) as unknown as ReturnType<
        typeof useDocumentSpecificationPage
      >,
    )

    render(<DocumentSpecificationPage mode='create' />)

    expect(screen.getByRole('heading', { name: 'Conteúdo do template' })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Conteúdo do template' })).toBeDefined()
    expect(screen.getByText('2 palavras')).toBeDefined()
  })
})
