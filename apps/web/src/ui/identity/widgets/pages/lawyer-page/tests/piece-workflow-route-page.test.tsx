import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PieceFilePreviewProps } from '../piece-file-preview'
import type { CaseDocumentResponse } from '@/rest/services/case-document-production-service'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { DocumentEditorActions } from '@/ui/document-production/widgets/components/document-editor'
import { PieceWorkflowRoutePage } from '../piece-workflow-route-page'
import { usePieceWorkflowRoutePage } from '../use-piece-workflow-route-page'

vi.mock('../use-piece-workflow-route-page', () => ({
  usePieceWorkflowRoutePage: vi.fn(),
}))

vi.mock('../piece-file-preview', async () => {
  const { createElement } = await import('react')

  return {
    PieceFilePreview: (props: PieceFilePreviewProps) =>
      createElement('div', {
        'data-testid': 'piece-file-preview',
        'data-version-id': props.versionId,
      }),
  }
})

const usePieceWorkflowRoutePageMock = vi.mocked(usePieceWorkflowRoutePage)

const DOCUMENT_ID = 'document-id'
const VERSION_ID = 'version-id'
const CASE_ID = 'case-id'

function buildPageState(): ReturnType<typeof usePieceWorkflowRoutePage> {
  const document: CaseDocumentResponse = {
    id: DOCUMENT_ID,
    title: 'Requerimento previdenciário',
    currentVersionId: VERSION_ID,
    generation: {
      id: 'generation-id',
      status: 'completed',
      referenceDocuments: [
        {
          id: 'reference-id',
          fileName: 'cnis.pdf',
          checklistItemLabel: 'Extrato previdenciário (CNIS)',
        },
      ],
    },
    versions: [
      {
        id: VERSION_ID,
        versionNumber: 1,
        source: 'ai',
        status: 'in_review',
        createdAt: '2026-09-25T12:00:00.000Z',
        createdByCollaboratorId: 'collaborator-id',
        storagePath: 'generated/document.pdf',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Períodos: {periodos_contributivos}; benefício: {numero_beneficio}; repetir: {periodos_contributivos}.',
                },
              ],
            },
          ],
        } as unknown as DocumentTemplateContent,
        pendingVariables: [
          {
            marker: '{periodos_contributivos}',
            technicalName: 'periodos_contributivos',
            label: 'Períodos contributivos',
          },
          {
            marker: '{numero_beneficio}',
            technicalName: 'numero_beneficio',
            label: 'Número do benefício',
          },
        ],
      },
    ],
  }

  return {
    document,
    documentError: null,
    documentId: DOCUMENT_ID,
    editedContent: null,
    editorActions: null,
    isDocumentError: false,
    isLoadingDocument: false,
    isAuthor: false,
    isCheckingReviewer: false,
    isPendingVariableDialogOpen: false,
    isReviewConfirmed: false,
    mode: 'editor',
    pendingVariables: document.versions[0].pendingVariables,
    saveState: 'saved',
    reviewAction: null,
    version: document.versions[0],
    caseId: CASE_ID,
    casePublicCode: 'CASO-20260925-0002',
    handleBackToCase: vi.fn(),
    handleChangeContent: vi.fn(),
    handleEditorReady: vi.fn(),
    handleOpenPendingVariableDialog: vi.fn(),
    handlePendingVariableDialogOpenChange: vi.fn(),
    handleApplyPendingVariableValues: vi.fn(),
    handleCloseReviewAction: vi.fn(),
    handleConfirmReviewAction: vi.fn(),
    handleOpenReview: vi.fn(),
    handleOpenReviewAction: vi.fn(),
    handleReviewConfirmationChange: vi.fn(),
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  Range.prototype.getClientRects = () =>
    ({ length: 0, item: () => null }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  usePieceWorkflowRoutePageMock.mockImplementation(() => {
    const pageState = buildPageState()
    const [editedContent, setEditedContent] = useState<DocumentTemplateContent | null>(
      null,
    )
    const [editorActions, setEditorActions] = useState<DocumentEditorActions | null>(null)
    const [isPendingVariableDialogOpen, setPendingVariableDialogOpen] = useState(false)
    const currentContent = editedContent ?? pageState.version?.content
    const serializedContent = currentContent ? JSON.stringify(currentContent) : ''
    const pendingVariables =
      pageState.version?.pendingVariables.filter((variable) =>
        serializedContent.includes(variable.marker),
      ) ?? []

    return {
      ...pageState,
      editedContent,
      editorActions,
      isPendingVariableDialogOpen,
      pendingVariables,
      handleChangeContent: setEditedContent,
      handleEditorReady: setEditorActions,
      handleOpenPendingVariableDialog: () => setPendingVariableDialogOpen(true),
      handlePendingVariableDialogOpenChange: setPendingVariableDialogOpen,
      handleApplyPendingVariableValues: (replacements) => {
        editorActions?.replacePendingMarkers(replacements)
      },
    }
  })
})

describe('PieceWorkflowRoutePage', () => {
  it('prevents the author from deciding the technical review', () => {
    usePieceWorkflowRoutePageMock.mockReturnValue({
      ...buildPageState(),
      mode: 'review',
      isAuthor: true,
      isReviewConfirmed: true,
    })

    render(
      <PieceWorkflowRoutePage mode='review' caseId={CASE_ID} documentId={DOCUMENT_ID} />,
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Quem elaborou esta versão não pode revisá-la',
    )
    expect(
      screen.getByRole('button', { name: 'Aprovar peça' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Solicitar ajustes' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Bloqueio' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('shows generation references and unresolved variables beside the editable document', async () => {
    render(
      <PieceWorkflowRoutePage mode='editor' caseId={CASE_ID} documentId={DOCUMENT_ID} />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Referências usadas na elaboração desta peça',
      }),
    ).not.toBeNull()
    expect(screen.getByText('cnis.pdf')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Variáveis pendentes' })).not.toBeNull()
    expect(screen.getByText('Períodos contributivos')).not.toBeNull()
    expect(screen.getAllByText('Não informado nos documentos')).toHaveLength(2)

    const toolbar = await screen.findByRole('toolbar', {
      name: 'Formatação do template',
    })
    expect(toolbar).not.toBeNull()
    expect(
      screen
        .getByRole('textbox', { name: 'Conteúdo da peça jurídica' })
        .textContent?.includes('Períodos: {periodos_contributivos}'),
    ).toBe(true)
    await waitFor(() => expect(screen.queryByTestId('piece-file-preview')).toBeNull())
  })

  it('opens the pending-values dialog and replaces all matching markers in the piece', async () => {
    render(
      <PieceWorkflowRoutePage mode='editor' caseId={CASE_ID} documentId={DOCUMENT_ID} />,
    )

    const editor = screen.getByRole('textbox', { name: 'Conteúdo da peça jurídica' })
    await waitFor(() =>
      expect(editor.querySelectorAll('[data-pending-marker="true"]')).toHaveLength(3),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Inserir valores' }))

    expect(screen.getByRole('dialog')).not.toBeNull()
    const applyButton = screen.getByRole('button', { name: 'Inserir valores' })
    expect(applyButton.hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByLabelText('Períodos contributivos'), {
      target: { value: '1991 a 2026' },
    })
    expect(applyButton.hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByLabelText('Número do benefício'), {
      target: { value: '987.654.321-0' },
    })
    fireEvent.click(applyButton)

    await waitFor(() =>
      expect(editor.textContent).toBe(
        'Períodos: 1991 a 2026; benefício: 987.654.321-0; repetir: 1991 a 2026.',
      ),
    )
    expect(editor.querySelector('[data-pending-marker="true"]')).toBeNull()
    expect(screen.queryByText('Períodos contributivos')).toBeNull()
  })
})
