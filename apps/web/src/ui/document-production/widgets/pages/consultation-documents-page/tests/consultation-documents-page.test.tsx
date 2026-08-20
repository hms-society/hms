import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DocumentGenerationStatus } from '@hms/core/document-production/domain/structures'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildConsultationDocumentVersionPath, ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ConsultationDocumentsPage } from '..'
import { useConsultationDocumentsQuery } from '../../../../hooks/use-consultation-documents-query'
import { useCancelConsultationDocumentGenerationAction } from '../../../../hooks/use-cancel-consultation-document-generation-action'
import { useConsultationDocumentSelectionQuery } from '../../../../hooks/use-consultation-document-selection-query'
import { useReplaceConsultationDocumentSelectionAction } from '../../../../hooks/use-replace-consultation-document-selection-action'
import { useGenerateConsultationDocumentAction } from '../../../../hooks/use-generate-consultation-document-action'
import { useGenerateConsultationDocumentsAction } from '../../../../hooks/use-generate-consultation-documents-action'
import { useConfirmConsultationDocumentPackageAction } from '../../../../hooks/use-confirm-consultation-document-package-action'

const useConsultationMock = vi.hoisted(() => vi.fn())

vi.mock('@/ui/consultation/hooks/use-consultation', () => ({
  useConsultation: () => useConsultationMock(),
}))

vi.mock('../../../../hooks/use-consultation-document-selection-query', () => ({
  useConsultationDocumentSelectionQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-replace-consultation-document-selection-action', () => ({
  useReplaceConsultationDocumentSelectionAction: vi.fn(),
}))
vi.mock('../../document-specifications-page/use-document-catalog-query', () => ({
  useDocumentCatalogQuery: vi.fn(() => ({ areas: { data: [] } })),
}))
vi.mock('../../document-specifications-page/use-document-topics-query', () => ({
  useDocumentTopicsQuery: vi.fn(() => ({ data: [] })),
}))

vi.mock('../../../../hooks/use-consultation-documents-query', () => ({
  useConsultationDocumentsQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-cancel-consultation-document-generation-action', () => ({
  useCancelConsultationDocumentGenerationAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-generate-consultation-document-action', () => ({
  useGenerateConsultationDocumentAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-generate-consultation-documents-action', () => ({
  useGenerateConsultationDocumentsAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-confirm-consultation-document-package-action', () => ({
  useConfirmConsultationDocumentPackageAction: vi.fn(),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => {
    const href =
      route === 'consultationDocumentVersion' && params
        ? buildConsultationDocumentVersionPath({
            consultationId: params.consultationId ?? '',
            documentId: params.documentId ?? '',
            documentVersionId: params.documentVersionId ?? '',
          })
        : ROUTES[route]

    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

const useConsultationDocumentsQueryMock = vi.mocked(useConsultationDocumentsQuery)
const useCancelConsultationDocumentGenerationActionMock = vi.mocked(
  useCancelConsultationDocumentGenerationAction,
)
const useConsultationDocumentSelectionQueryMock = vi.mocked(
  useConsultationDocumentSelectionQuery,
)
const useReplaceConsultationDocumentSelectionActionMock = vi.mocked(
  useReplaceConsultationDocumentSelectionAction,
)
const useGenerateConsultationDocumentActionMock = vi.mocked(
  useGenerateConsultationDocumentAction,
)
const useGenerateConsultationDocumentsActionMock = vi.mocked(
  useGenerateConsultationDocumentsAction,
)
const useConfirmConsultationDocumentPackageActionMock = vi.mocked(
  useConfirmConsultationDocumentPackageAction,
)

function createVersion(
  overrides: Partial<{
    id: string
    versionNumber: number
    status: 'in_review' | 'approved' | 'rejected'
    source: 'ai' | 'manual'
    rejectionReason: string
  }> = {},
) {
  return {
    id: 'version-1',
    versionNumber: 1,
    source: 'ai' as const,
    status: 'approved' as const,
    pendingMarkersCount: 0,
    createdByCollaboratorId: 'collaborator-1',
    createdAt: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function createIndividualAction(overrides: Record<string, unknown> = {}) {
  return {
    generateDocument: vi.fn().mockResolvedValue(undefined),
    error: null,
    isGeneratingDocument: false,
    pendingDocumentIds: [],
    timedOutDocumentIds: [],
    ...overrides,
  }
}

function createBatchAction(overrides: Record<string, unknown> = {}) {
  return {
    generateDocuments: vi.fn().mockResolvedValue(undefined),
    error: null,
    isGeneratingDocuments: false,
    pendingDocumentIds: [],
    timedOutDocumentIds: [],
    ...overrides,
  }
}

function createCancellationAction(overrides: Record<string, unknown> = {}) {
  return {
    cancelDocumentGeneration: vi.fn().mockResolvedValue(undefined),
    error: null,
    isCancellingDocument: false,
    ...overrides,
  }
}

function createSelectionQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      options: [],
      selectedDocumentSpecificationIds: [],
    },
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  }
}

function renderPage() {
  return render(<ConsultationDocumentsPage consultationId='consultation-1' />)
}

describe('ConsultationDocumentsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useConsultationMock.mockReturnValue({
      consultation: {
        status: 'pending',
        attendanceFinalizedAt: new Date('2026-08-19T12:00:00.000Z'),
      },
    })
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [
          { id: 'document-1', title: 'Procuração', versions: [] },
          {
            id: 'document-2',
            title: 'Termo de confidencialidade',
            currentVersionId: 'version-2',
            versions: [createVersion({ id: 'version-2', status: 'approved' })],
          },
          {
            id: 'document-3',
            title: 'Declaração de hipossuficiência',
            versions: [createVersion({ id: 'version-3', status: 'in_review' })],
          },
          {
            id: 'document-4',
            title: 'Minuta de contrato',
            versions: [
              createVersion({
                id: 'version-4',
                status: 'rejected',
                rejectionReason: 'Falta conferir a qualificação das partes.',
              }),
            ],
          },
          {
            id: 'document-5',
            title: 'Documento com falha',
            generationStatus: DocumentGenerationStatus.Failed,
            versions: [],
          },
        ],
      }) as never,
    )
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      createCancellationAction() as never,
    )
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createSelectionQuery() as never,
    )
    useReplaceConsultationDocumentSelectionActionMock.mockReturnValue({
      replaceSelection: vi.fn().mockResolvedValue(undefined),
      isReplacing: false,
      error: null,
    } as never)
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction() as never,
    )
    useGenerateConsultationDocumentsActionMock.mockReturnValue(
      createBatchAction() as never,
    )
    useConfirmConsultationDocumentPackageActionMock.mockReturnValue({
      confirmDocumentPackage: vi.fn().mockResolvedValue(undefined),
      error: null,
      isConfirming: false,
    } as never)
  })

  it('renders the real list composition with status matrix, current chip and actions', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Documentos da consulta' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Gerar documentos' })).toBeNull()
    expect(screen.getByText('Não gerado')).toBeDefined()
    const notGeneratedRow = screen
      .getByRole('heading', { name: 'Procuração' })
      .closest('li')
    expect(notGeneratedRow).not.toBeNull()
    expect(
      within(notGeneratedRow as HTMLElement).queryByText('Nenhuma versão disponível'),
    ).toBeNull()
    expect(within(notGeneratedRow as HTMLElement).queryByText(/Versão \d/)).toBeNull()
    expect(screen.getAllByText('Aprovado')).not.toHaveLength(0)
    expect(screen.getAllByText('Em revisão')).not.toHaveLength(0)
    expect(screen.getAllByText('Rejeitado')).not.toHaveLength(0)
    expect(screen.getAllByText('Vigente')).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Gerar documento' })).toBeDefined()
    expect(screen.getByText('Falha na geração')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Revisar' }).getAttribute('href')).toBe(
      '/consultas/consultation-1/documentos/document-3/versoes/version-3',
    )
    expect(screen.queryByRole('link', { name: 'Ver motivo' })).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Visualizar' }).length).toBeGreaterThan(0)
  })

  it('delegates individual generation without rendering a batch CTA', () => {
    const individualAction = createIndividualAction()
    useGenerateConsultationDocumentActionMock.mockReturnValue(individualAction as never)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Gerar documento' }))

    expect(individualAction.generateDocument).toHaveBeenCalledWith({
      documentId: 'document-1',
    })
    expect(screen.queryByRole('button', { name: 'Gerar documentos' })).toBeNull()
  })

  it('keeps document selection available without a batch generation CTA', () => {
    renderPage()

    expect(screen.queryByRole('button', { name: 'Gerar documentos' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Selecionar documentos' })).toBeDefined()
  })

  it('keeps the document package read-only when the consultation is not pending', () => {
    useConsultationMock.mockReturnValue({
      consultation: {
        status: 'completed',
        attendanceFinalizedAt: new Date('2026-08-19T12:00:00.000Z'),
      },
    })

    renderPage()

    expect(screen.getByRole('button', { name: 'Selecionar documentos' })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('button', { name: 'Gerar documento' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('blocks the document package when the intake was closed without contract', () => {
    useConsultationMock.mockReturnValue({
      consultation: {
        status: 'pending',
        attendanceFinalizedAt: new Date('2026-08-19T12:00:00.000Z'),
        intake: { status: 'closed_without_contract' },
      },
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Documentos bloqueados' })).toBeDefined()
    expect(
      screen.getByText(
        'Documentos não disponíveis para consultas encerradas sem contratação.',
      ),
    ).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Selecionar documentos' })).toBeNull()
  })

  it('locks only versioned package documents and submits additions', () => {
    const replaceSelection = vi.fn().mockResolvedValue(undefined)
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createSelectionQuery({
        data: {
          selectedDocumentSpecificationIds: ['spec-locked-1', 'spec-locked-2'],
          options: [
            {
              documentSpecificationId: 'spec-locked-1',
              name: 'Procuração',
              description: 'Representação contratual.',
              application: { scope: 'global', moment: 'consultation' },
              status: 'available',
              selected: true,
              hasVersion: true,
            },
            {
              documentSpecificationId: 'spec-locked-2',
              name: 'Termo de ciência',
              description: 'Consentimento para tratamento de dados.',
              application: { scope: 'global', moment: 'consultation' },
              status: 'available',
              selected: true,
              hasVersion: false,
            },
            {
              documentSpecificationId: 'spec-new',
              name: 'Declaração de pobreza',
              description: 'Pedido de gratuidade da justiça.',
              application: { scope: 'global', moment: 'consultation' },
              status: 'available',
              selected: false,
            },
          ],
        },
      }) as never,
    )
    useReplaceConsultationDocumentSelectionActionMock.mockReturnValue({
      replaceSelection,
      isReplacing: false,
      error: null,
    } as never)

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar documentos' }))
    const dialog = screen.getByRole('dialog', { name: 'Selecionar documentos' })

    expect(screen.getByText('0 selecionados')).toBeDefined()
    expect(
      within(dialog)
        .getByRole('combobox', { name: 'Tema jurídico' })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.getAllByText('Já adicionado')).toHaveLength(1)
    const lockedCheckboxes = screen
      .getAllByRole('checkbox')
      .filter((checkbox) => checkbox.hasAttribute('disabled'))
    expect(lockedCheckboxes).toHaveLength(1)
    expect(
      within(dialog).getByText('Cancelar', { selector: 'button' }).className,
    ).toContain('rounded-full')
    expect(
      within(dialog).getByRole('button', { name: 'Adicionar 0 documentos' }).className,
    ).toContain('rounded-full')
    expect(
      within(dialog).getByRole('button', { name: 'Adicionar 0 documentos' }),
    ).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Termo de ciência' }))

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Selecionar Declaração de pobreza' }),
    )

    expect(screen.getByText('1 selecionado')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar 1 documento' }))
    expect(replaceSelection).toHaveBeenCalledWith(['spec-locked-1', 'spec-new'])
  })

  it('allows removing an unversioned package document without adding another', () => {
    const replaceSelection = vi.fn().mockResolvedValue(undefined)
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createSelectionQuery({
        data: {
          selectedDocumentSpecificationIds: ['spec-unversioned'],
          options: [
            {
              documentSpecificationId: 'spec-unversioned',
              name: 'Procuração',
              description: 'Representação contratual.',
              application: { scope: 'global', moment: 'consultation' },
              status: 'available',
              selected: true,
              hasVersion: false,
            },
          ],
        },
      }) as never,
    )
    useReplaceConsultationDocumentSelectionActionMock.mockReturnValue({
      replaceSelection,
      isReplacing: false,
      error: null,
    } as never)

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Selecionar documentos' }))
    const dialog = screen.getByRole('dialog', { name: 'Selecionar documentos' })
    const removeButton = screen.getByRole('checkbox', {
      name: 'Selecionar Procuração',
    })

    expect(removeButton).not.toHaveProperty('disabled', true)
    fireEvent.click(removeButton)

    expect(screen.getByRole('button', { name: 'Salvar seleção' })).toHaveProperty(
      'disabled',
      false,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Salvar seleção' }))

    expect(replaceSelection).toHaveBeenCalledWith([])
    expect(dialog).toBeDefined()
  })

  it('does not render version history details in the document list', () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [
          {
            id: 'document-1',
            title: 'Procuração',
            versions: [
              createVersion({ id: 'version-3', versionNumber: 3, status: 'in_review' }),
              createVersion({ id: 'version-1', versionNumber: 1, status: 'approved' }),
            ],
          },
        ],
      }) as never,
    )

    renderPage()
    const row = screen.getByRole('heading', { name: 'Procuração' }).closest('li')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).queryByText('Ver histórico')).toBeNull()
    expect(
      within(row as HTMLElement).queryByText(/versão\(ões\) no histórico/i),
    ).toBeNull()
    expect(within(row as HTMLElement).queryByText(/Versão \d/)).toBeNull()
  })

  it('shows a recoverable timeout without calling it a generation failure', () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [{ id: 'document-1', title: 'Procuração', versions: [] }],
        refetch,
      }) as never,
    )
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction({ timedOutDocumentIds: ['document-1'] }) as never,
    )

    renderPage()

    expect(screen.getByRole('alert').textContent).toContain(
      'Ainda não foi possível confirmar o resultado da geração.',
    )
    expect(screen.queryByText('Falha na geração')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('renders loading, empty and retry states', () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({ data: undefined, isLoading: true }) as never,
    )
    const { unmount } = renderPage()
    expect(screen.getByLabelText('Carregando documentos da consulta')).toBeDefined()
    unmount()

    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({ data: [] }) as never,
    )
    renderPage()
    expect(screen.getByText('Nenhum documento vinculado')).toBeDefined()
    cleanup()

    const refetch = vi.fn().mockResolvedValue(undefined)
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({ data: undefined, isError: true, refetch }) as never,
    )
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows generating state and disables only its own document action', () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [
          { id: 'document-1', title: 'Gerando', versions: [] },
          { id: 'document-2', title: 'Outro documento', versions: [] },
        ],
      }) as never,
    )
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction({ pendingDocumentIds: ['document-1'] }) as never,
    )

    renderPage()

    const generatingRow = screen.getByRole('heading', { name: 'Gerando' }).closest('li')
    expect(generatingRow).not.toBeNull()
    const generatingStatus = within(generatingRow as HTMLElement).getByText(
      'Aguardando resultado',
    )
    expect(generatingStatus.classList.contains('animate-pulse')).toBe(true)
    expect(
      generatingStatus.querySelector('svg')?.classList.contains('animate-spin'),
    ).toBe(true)
    expect(
      within(generatingRow as HTMLElement).queryByRole('button', {
        name: 'Gerar documento',
      }),
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Gerar documento' }).hasAttribute('disabled'),
    ).toBe(false)
  })

  it('disables cancellation while an active generation is being cancelled', () => {
    const cancellationAction = createCancellationAction({ isCancellingDocument: true })
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      cancellationAction as never,
    )
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [
          {
            id: 'document-1',
            title: 'Gerando',
            generationStatus: 'running',
            versions: [],
          },
        ],
      }) as never,
    )

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar geração' }))

    expect(cancellationAction.cancelDocumentGeneration).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Cancelar geração' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.queryByRole('button', { name: 'Gerar documento' })).toBeNull()
  })
})
