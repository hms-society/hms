import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import type { AnalysisFormPanelProps } from '../analysis-form-panel'
import type { PdfViewerPanelProps } from '../pdf-viewer-panel'
import type { ProcessingFailurePanelProps } from '../processing-failure-panel'
import type { ReadOnlyIncompletePanelProps } from '../read-only-incomplete-panel'
import type { ReadOnlyValidatedPanelProps } from '../read-only-validated-panel'
import type { RequestResendModalProps } from '../request-resend-modal'
import { DocumentAnalysisPage } from '..'
import { useDocumentAnalysis } from '../use-document-analysis'

vi.mock('../use-document-analysis', () => ({
  useDocumentAnalysis: vi.fn(),
}))

vi.mock('../analysis-form-panel', () => ({
  AnalysisFormPanel: ({ currentDecision }: AnalysisFormPanelProps) => (
    <div data-testid='analysis-form-panel'>{currentDecision}</div>
  ),
}))

vi.mock('../pdf-viewer-panel', () => ({
  PdfViewerPanel: ({ fileSize }: PdfViewerPanelProps) => (
    <div data-testid='pdf-viewer-panel'>{fileSize}</div>
  ),
}))

vi.mock('../processing-failure-panel', () => ({
  ProcessingFailurePanel: ({ failureReason }: ProcessingFailurePanelProps) => (
    <div data-testid='processing-failure-panel'>{failureReason}</div>
  ),
}))

vi.mock('../read-only-incomplete-panel', () => ({
  ReadOnlyIncompletePanel: ({ document }: ReadOnlyIncompletePanelProps) => (
    <div data-testid='read-only-incomplete-panel'>{document.id}</div>
  ),
}))

vi.mock('../read-only-validated-panel', () => ({
  ReadOnlyValidatedPanel: ({ document }: ReadOnlyValidatedPanelProps) => (
    <div data-testid='read-only-validated-panel'>{document.id}</div>
  ),
}))

vi.mock('../request-resend-modal', () => ({
  RequestResendModal: ({ isOpen }: RequestResendModalProps) => (
    <div data-testid='request-resend-modal'>{isOpen ? 'open' : 'closed'}</div>
  ),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))

const useDocumentAnalysisMock = vi.mocked(useDocumentAnalysis)
const document = DocumentValidationDocumentFaker.fake({
  id: 'document-file-1',
  fileName: 'comprovante-residencia.pdf',
  checklistLink: {
    caseId: 'case-1',
    caseLabel: 'Caso Vinicius Lopes Machado',
    checklistItemId: 'checklist-item-1',
    checklistItemLabel: 'Documento teste 1',
  },
})

describe('DocumentAnalysisPage', () => {
  beforeEach(() => {
    useDocumentAnalysisMock.mockReturnValue(getDocumentAnalysisController())
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the loading state from the page hook', () => {
    useDocumentAnalysisMock.mockReturnValue(
      getDocumentAnalysisController({ isLoading: true }),
    )

    render(<DocumentAnalysisPage fileId={document.id} />)

    expect(screen.getByText('Carregando documento para validação...')).toBeDefined()
  })

  it('renders a recovery link when the page hook returns an error', () => {
    useDocumentAnalysisMock.mockReturnValue(
      getDocumentAnalysisController({
        error: new Error('Not found'),
        document: undefined,
      }),
    )

    render(<DocumentAnalysisPage fileId={document.id} />)

    expect(
      screen.getByRole('heading', { name: 'Não foi possível carregar o documento' }),
    ).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'Voltar aos documentos' }).getAttribute('href'),
    ).toBe(ROUTES.documentInbox)
  })

  it('renders the form and viewer widgets for a regular validation state', () => {
    useDocumentAnalysisMock.mockReturnValue(
      getDocumentAnalysisController({
        documentView: {
          ...getDocumentAnalysisController().documentView,
          status: 'Aguardando validação',
        },
      }),
    )

    render(<DocumentAnalysisPage fileId={document.id} />)

    expect(screen.getByTestId('pdf-viewer-panel')).toBeDefined()
    expect(screen.getByTestId('analysis-form-panel').textContent).toContain('validate')
    expect(screen.getByTestId('request-resend-modal').textContent).toContain('closed')
  })

  it('renders the read-only widget after the document is validated', () => {
    render(<DocumentAnalysisPage fileId={document.id} />)

    expect(screen.getByTestId('read-only-validated-panel').textContent).toContain(
      document.id,
    )
    expect(screen.queryByTestId('analysis-form-panel')).toBeNull()
  })

  it('renders the processing failure widget for failed documents', () => {
    useDocumentAnalysisMock.mockReturnValue(
      getDocumentAnalysisController({
        documentView: {
          ...getDocumentAnalysisController().documentView,
          status: 'Falha no processamento',
          failureReason: 'Arquivo protegido por senha',
        },
      }),
    )

    render(<DocumentAnalysisPage fileId={document.id} />)

    expect(screen.getByTestId('processing-failure-panel').textContent).toContain(
      'Arquivo protegido por senha',
    )
    expect(screen.queryByTestId('analysis-form-panel')).toBeNull()
  })

  it('renders the read-only widget after a resend request', () => {
    useDocumentAnalysisMock.mockReturnValue(
      getDocumentAnalysisController({
        documentView: {
          ...getDocumentAnalysisController().documentView,
          status: 'Reenvio solicitado',
        },
      }),
    )

    render(<DocumentAnalysisPage fileId={document.id} />)

    expect(screen.getByTestId('read-only-incomplete-panel').textContent).toContain(
      document.id,
    )
    expect(screen.queryByTestId('analysis-form-panel')).toBeNull()
  })
})

function getDocumentAnalysisController(
  overrides: Partial<ReturnType<typeof useDocumentAnalysis>> = {},
) {
  const defaultController = {
    form: null as never,
    currentDecision: 'validate',
    document,
    documentView: {
      id: document.id,
      fileName: document.fileName,
      confidence: 'Alta confiança',
      type: 'comprovante_residencia',
      fileSize: '1 KB',
      receivedFrom: 'Mariana Costa Silva',
      contactInfo: 'internal_upload - remetente@email.com',
      receivedDate: 'Hoje',
      receivedTime: '14:32',
      integrity: 'Confirmada',
      duplicity: 'Nenhuma correspondência',
      status: 'Válido',
      statusClasses: 'bg-success',
    },
    isLoading: false,
    error: null,
    isSubmitting: false,
    isResendModalOpen: false,
    onSubmit: vi.fn(),
    handleRequestResend: vi.fn(),
    handleCloseResendModal: vi.fn(),
    handleConfirmResend: vi.fn(),
    handleOpenDocument: vi.fn(),
  }

  return { ...defaultController, ...overrides } as ReturnType<typeof useDocumentAnalysis>
}
