import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PieceFilePreviewProps } from '../piece-file-preview'
import type { CaseDocumentResponse } from '@/rest/services/case-document-production-service'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
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
              content: [{ type: 'text', text: 'Conteúdo editável da peça' }],
            },
          ],
        } as unknown as DocumentTemplateContent,
        pendingVariables: [
          {
            marker: '{periodos_contributivos}',
            technicalName: 'periodos_contributivos',
            label: 'Períodos contributivos',
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
    isDocumentError: false,
    isLoadingDocument: false,
    isReviewConfirmed: false,
    mode: 'editor',
    reviewAction: null,
    version: document.versions[0],
    caseId: CASE_ID,
    casePublicCode: 'CASO-20260925-0002',
    handleBackToCase: vi.fn(),
    handleChangeContent: vi.fn(),
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
  usePieceWorkflowRoutePageMock.mockReturnValue(buildPageState())
})

describe('PieceWorkflowRoutePage', () => {
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
    expect(screen.getByText('Não informado nos documentos')).not.toBeNull()

    const toolbar = await screen.findByRole('toolbar', {
      name: 'Formatação do template',
    })
    expect(toolbar).not.toBeNull()
    expect(screen.getByText('Conteúdo editável da peça')).not.toBeNull()
    await waitFor(() => expect(screen.queryByTestId('piece-file-preview')).toBeNull())
  })
})
