import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentVersionFaker } from '@hms/core/document-production/domain/entities/fakers'
import type { DocumentEditorProps } from '@/ui/document-production/widgets/components/document-editor'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import {
  useConsultationDocumentVersionPage,
  type ConsultationDocumentVersionPageProps,
} from '../use-consultation-document-version-page'
import { ConsultationDocumentVersionPage } from '../index'

vi.mock('../use-consultation-document-version-page', () => ({
  useConsultationDocumentVersionPage: vi.fn(),
}))

vi.mock('@/ui/document-production/widgets/components/document-editor', () => ({
  DocumentEditor: ({ content, editable, onChange }: DocumentEditorProps) => (
    <div role='document' aria-label='Conteúdo do documento' data-editable={editable}>
      Conteúdo do documento
      <button type='button' onClick={() => onChange(content)}>
        Simular alteração no editor
      </button>
    </div>
  ),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, params, ...props }: AnchorProps) => (
    <a href={`/${route}/${params?.consultationId ?? ''}`} {...props}>
      {children}
    </a>
  ),
}))

const useConsultationDocumentVersionPageMock = vi.mocked(
  useConsultationDocumentVersionPage,
)
const handleApproveMock = vi.fn().mockResolvedValue(undefined)
const handleOpenRejectDialogMock = vi.fn()
const handleRejectMock = vi.fn().mockResolvedValue(undefined)
const handleRejectDialogOpenChangeMock = vi.fn()
const setRejectionReasonMock = vi.fn()

const pageProps: ConsultationDocumentVersionPageProps = {
  consultationId: 'consultation-1',
  documentId: 'document-1',
  documentVersionId: 'version-1',
}

function createPageController(
  overrides: Partial<ReturnType<typeof useConsultationDocumentVersionPage>> = {},
): ReturnType<typeof useConsultationDocumentVersionPage> {
  return {
    document: undefined,
    handleApprove: handleApproveMock,
    handleOpenRejectDialog: handleOpenRejectDialogMock,
    handleReject: handleRejectMock,
    handleRejectDialogOpenChange: handleRejectDialogOpenChangeMock,
    isError: false,
    isLoading: false,
    isRejectDialogOpen: false,
    isReviewable: true,
    isReviewing: false,
    rejectionReason: '',
    setRejectionReason: setRejectionReasonMock,
    version: DocumentVersionFaker.fake({
      id: 'version-1',
      documentId: 'document-1',
      versionNumber: 2,
      status: 'in_review',
    }),
    ...overrides,
  }
}

describe('ConsultationDocumentVersionPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useConsultationDocumentVersionPageMock.mockReturnValue(createPageController())
  })

  it('shows a loading placeholder while the version is loading', () => {
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({ isLoading: true }),
    )
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(screen.getByRole('main').className).toContain('animate-pulse')
    expect(screen.queryByRole('heading', { name: 'Documento' })).toBeNull()
  })

  it('shows a recovery link when the version is missing or the query fails', () => {
    const { rerender } = render(<ConsultationDocumentVersionPage {...pageProps} />)
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({ version: undefined }),
    )
    rerender(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(
      screen.getByRole('heading', { name: 'Versão não encontrada' }).textContent,
    ).toBe('Versão não encontrada')
    expect(
      screen.getByRole('link', { name: 'Voltar para documentos' }).getAttribute('href'),
    ).toBe('/consultationDocuments/consultation-1')

    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({ isError: true }),
    )
    rerender(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(
      screen.getByRole('heading', { name: 'Versão não encontrada' }).textContent,
    ).toBe('Versão não encontrada')
    expect(
      screen.getByText(
        'Não foi possível localizar esta versão do documento na consulta.',
      ),
    ).toBeDefined()
  })

  it('renders a reviewable version and delegates approve and reject actions', () => {
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(screen.getByRole('heading', { name: 'Documento' }).textContent).toBe(
      'Documento',
    )
    expect(screen.getByText('Versão 2 · Gerada por IA').textContent).toBe(
      'Versão 2 · Gerada por IA',
    )
    expect(
      screen
        .getByRole('document', { name: 'Conteúdo do documento' })
        .getAttribute('data-editable'),
    ).toBe('false')

    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar geração' }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar documento' }))

    expect(handleOpenRejectDialogMock).toHaveBeenCalledOnce()
    expect(handleApproveMock).toHaveBeenCalledOnce()
  })

  it('keeps the version view unchanged when the editor change callback fires', () => {
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Simular alteração no editor' }))

    expect(screen.getByRole('document', { name: 'Conteúdo do documento' })).toBeDefined()
    expect(screen.getByText('Versão 2 · Gerada por IA').textContent).toBe(
      'Versão 2 · Gerada por IA',
    )
  })

  it('shows the rejection dialog reason and pending controls accessibly', () => {
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({
        isRejectDialogOpen: true,
        isReviewing: true,
        rejectionReason: 'Conteúdo incompleto',
      }),
    )
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(
      (screen.getByRole('textbox', { name: 'Motivo da rejeição' }) as HTMLTextAreaElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Rejeitando...' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getAllByRole('button', { name: 'Cancelar' })[0] as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('disables review actions while a decision is pending', () => {
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({ isReviewing: true }),
    )
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(
      (screen.getByRole('button', { name: 'Aprovando...' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Rejeitar geração' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('shows the rejection reason and delegates cancel and confirm actions', () => {
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({
        isRejectDialogOpen: true,
        rejectionReason: 'Falta a assinatura.',
      }),
    )
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    const rejectionDialog = screen.getByRole('dialog')
    expect(
      (screen.getByRole('textbox', { name: 'Motivo da rejeição' }) as HTMLTextAreaElement)
        .value,
    ).toBe('Falta a assinatura.')
    expect(
      (
        within(rejectionDialog).getByRole('button', {
          name: 'Rejeitar geração',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false)

    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo da rejeição' }), {
      target: { value: 'A cláusula precisa ser revisada.' },
    })

    expect(setRejectionReasonMock).toHaveBeenCalledWith(
      'A cláusula precisa ser revisada.',
    )

    fireEvent.click(
      within(rejectionDialog).getAllByRole('button', { name: 'Cancelar' })[0],
    )
    fireEvent.click(
      within(rejectionDialog).getByRole('button', { name: 'Rejeitar geração' }),
    )

    expect(handleRejectDialogOpenChangeMock).toHaveBeenCalledWith(false)
    expect(handleRejectMock).toHaveBeenCalledOnce()
  })

  it('hides review actions for a read-only rejected version', () => {
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({
        isReviewable: false,
        version: DocumentVersionFaker.fake({
          id: 'version-1',
          documentId: 'document-1',
          status: 'rejected',
          source: 'manual',
          versionNumber: 3,
        }),
      }),
    )
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(screen.getByText('Rejeitado').textContent).toBe('Rejeitado')
    expect(screen.getByText('Versão 3 · Preenchimento manual').textContent).toBe(
      'Versão 3 · Preenchimento manual',
    )
    expect(screen.queryByRole('button', { name: 'Aprovar documento' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rejeitar geração' })).toBeNull()
  })

  it('shows the approved status without review actions', () => {
    useConsultationDocumentVersionPageMock.mockReturnValue(
      createPageController({
        isReviewable: false,
        version: DocumentVersionFaker.fake({
          id: 'version-1',
          documentId: 'document-1',
          status: 'approved',
          source: 'ai',
          versionNumber: 2,
        }),
      }),
    )
    render(<ConsultationDocumentVersionPage {...pageProps} />)

    expect(screen.getByText('Aprovado').textContent).toBe('Aprovado')
    expect(screen.queryByRole('button', { name: 'Aprovar documento' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rejeitar geração' })).toBeNull()
  })
})
