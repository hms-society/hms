import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationDocumentProductionController } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useDocumentCatalogQuery } from '@/ui/document-production/hooks/use-document-catalog-query'
import { useDocumentTopicsQuery } from '@/ui/document-production/hooks/use-document-topics-query'

import { FormalizationDocumentsSection } from '../index'
import {
  type FormalizationDocumentsSectionProps,
  useFormalizationDocumentsSection,
} from '../use-formalization-documents-section'

vi.mock('../use-formalization-documents-section', () => ({
  useFormalizationDocumentsSection: vi.fn(),
}))
vi.mock('@/ui/document-production/hooks/use-document-catalog-query', () => ({
  useDocumentCatalogQuery: vi.fn(),
}))
vi.mock('@/ui/document-production/hooks/use-document-topics-query', () => ({
  useDocumentTopicsQuery: vi.fn(),
}))

const useFormalizationDocumentsSectionMock = vi.mocked(useFormalizationDocumentsSection)
const useDocumentCatalogQueryMock = vi.mocked(useDocumentCatalogQuery)
const useDocumentTopicsQueryMock = vi.mocked(useDocumentTopicsQuery)

type Controller = ReturnType<typeof useFormalizationDocumentsSection>

function createProduction(): FormalizationDocumentProductionController {
  return {
    documents: [],
    documentsQuery: {
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    },
    selectionQuery: {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    },
    selectionMutation: {
      error: null,
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    },
    generationMutation: { error: null },
    cancellationMutation: {
      error: null,
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    },
    confirmMutation: {
      error: null,
      isPending: false,
      mutate: vi.fn(),
    },
    isPackageConfirmed: false,
    isReopeningPackage: false,
    isConfirmationEligible: true,
    isCancellingDocument: false,
    handleGenerateDocument: vi.fn().mockResolvedValue(undefined),
    reopenPackage: vi.fn().mockResolvedValue(undefined),
  } as unknown as FormalizationDocumentProductionController
}

function fakeHook(overrides: Partial<Controller> = {}): Controller {
  return {
    actionError: null,
    handleCancelDocumentGeneration: vi.fn().mockResolvedValue(undefined),
    handleConfirmationDialogChange: vi.fn(),
    handleConfirm: vi.fn(),
    handleConfirmRequest: vi.fn().mockResolvedValue(undefined),
    handleGenerateDocument: vi.fn().mockResolvedValue(undefined),
    handleOpenChange: vi.fn(),
    handleOpenDocumentVersion: vi.fn().mockResolvedValue(undefined),
    handleRefreshDocument: vi.fn().mockResolvedValue(undefined),
    handleRetry: vi.fn().mockResolvedValue(undefined),
    handleReopen: vi.fn().mockResolvedValue(undefined),
    handleSaveSelection: vi.fn().mockResolvedValue(undefined),
    initialAreaId: undefined,
    initialTopicId: undefined,
    isConfirmationDialogOpen: false,
    isReopenDisabled: false,
    isReadOnly: false,
    isSelectionOpen: false,
    items: [],
    selection: undefined,
    shouldRender: true,
    ...overrides,
  }
}

const props: FormalizationDocumentsSectionProps = {
  formalizationId: 'formalization-1',
  formalization: { contractFormState: 'closed', version: 1 },
  intake: {},
  isTerminal: false,
  production: createProduction(),
}

describe('FormalizationDocumentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentCatalogQueryMock.mockReturnValue({
      areas: { data: [] },
    } as unknown as ReturnType<typeof useDocumentCatalogQuery>)
    useDocumentTopicsQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
    })
    useFormalizationDocumentsSectionMock.mockReturnValue(fakeHook())
  })

  afterEach(cleanup)

  it('renders the document package and wires document selection', () => {
    const handleOpenChange = vi.fn()
    useFormalizationDocumentsSectionMock.mockReturnValue(fakeHook({ handleOpenChange }))

    render(<FormalizationDocumentsSection {...props} />)

    expect(
      screen.getByRole('heading', { name: 'Documentos da formalização' }),
    ).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar documentos' }))

    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })

  it('shows package editing while the confirmed formalization is still open', () => {
    const production = createProduction()
    production.isPackageConfirmed = true
    useFormalizationDocumentsSectionMock.mockReturnValue(fakeHook({ isReadOnly: true }))

    render(
      <FormalizationDocumentsSection
        {...props}
        isTerminal={false}
        production={production}
      />,
    )

    expect(screen.getByRole('button', { name: 'Editar pacote' })).toBeDefined()
  })

  it('hides package editing after the formalization is completed or cancelled', () => {
    const production = createProduction()
    production.isPackageConfirmed = true
    useFormalizationDocumentsSectionMock.mockReturnValue(fakeHook({ isReadOnly: true }))

    render(
      <FormalizationDocumentsSection {...props} isTerminal production={production} />,
    )

    expect(screen.queryByRole('button', { name: 'Editar pacote' })).toBeNull()
  })

  it('does not render when the contract form is not closed', () => {
    useFormalizationDocumentsSectionMock.mockReturnValue(
      fakeHook({ shouldRender: false }),
    )

    render(<FormalizationDocumentsSection {...props} />)

    expect(
      screen.queryByRole('heading', { name: 'Documentos da formalização' }),
    ).toBeNull()
  })

  it('allows reopening a confirmed package while the formalization is open', () => {
    const production = createProduction()
    production.isPackageConfirmed = true
    useFormalizationDocumentsSectionMock.mockReturnValue(fakeHook({ isReadOnly: true }))

    render(
      <FormalizationDocumentsSection
        {...props}
        isTerminal={false}
        production={production}
      />,
    )

    expect(screen.getByRole('button', { name: 'Editar pacote' })).toBeDefined()
  })

  it('hides package reopening after the formalization reaches a terminal state', () => {
    const production = createProduction()
    production.isPackageConfirmed = true
    useFormalizationDocumentsSectionMock.mockReturnValue(fakeHook({ isReadOnly: true }))

    render(
      <FormalizationDocumentsSection {...props} isTerminal production={production} />,
    )

    expect(screen.queryByRole('button', { name: 'Editar pacote' })).toBeNull()
  })

  it('disables package reopening while signature sending is active', () => {
    const production = createProduction()
    production.isPackageConfirmed = true
    useFormalizationDocumentsSectionMock.mockReturnValue(
      fakeHook({ isReadOnly: true, isReopenDisabled: true }),
    )

    render(
      <FormalizationDocumentsSection
        {...props}
        isTerminal={false}
        production={production}
      />,
    )

    expect(screen.getByRole('button', { name: 'Editar pacote' })).toHaveProperty(
      'disabled',
      true,
    )
  })
})
