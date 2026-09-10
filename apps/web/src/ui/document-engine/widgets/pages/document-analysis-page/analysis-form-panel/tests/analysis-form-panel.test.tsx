import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'
import type { ChecklistLinkFieldsProps } from '../../checklist-link-fields'

import { AnalysisFormPanel } from '..'
import { useAnalysisFormPanel } from '../use-analysis-form-panel'

vi.mock('../use-analysis-form-panel', () => ({
  useAnalysisFormPanel: vi.fn(),
}))

vi.mock('../../checklist-link-fields', () => ({
  ChecklistLinkFields: (_props: ChecklistLinkFieldsProps) => (
    <div>Checklist link fields</div>
  ),
}))

const useAnalysisFormPanelMock = vi.mocked(useAnalysisFormPanel)

function renderPanel(
  onOpenDocument = vi.fn(),
  documentOverrides: Partial<DocumentValidationDocument> = {},
  currentDecision: DocumentReviewFormData['decision'] = 'duplicate',
) {
  function TestPanel() {
    const form = useForm<DocumentReviewFormData>({
      defaultValues: {
        decision: currentDecision,
        documentTypeId: 'comprovante_residencia',
        checklistRequirementId: 'checklist-item-1',
        originalDocumentId: '',
        reason: '',
      },
    })

    return (
      <AnalysisFormPanel
        form={form}
        currentDecision={currentDecision}
        isSubmitting={false}
        document={DocumentValidationDocumentFaker.fake({
          duplicateMatch: {
            documentFileId: 'original-file-1',
            fileName: 'documento-original.pdf',
            receivedAt: new Date('2026-08-13T14:32:00.000Z'),
            caseLabel: 'Caso 0089',
            checklistItemLabel: 'Comprovante de residência',
            hashSha256: 'hash-1',
          },
          ...documentOverrides,
        })}
        onSubmit={vi.fn()}
        onRequestResend={vi.fn()}
        onOpenDocument={onOpenDocument}
      />
    )
  }

  render(<TestPanel />)
}

describe('AnalysisFormPanel', () => {
  beforeEach(() => {
    useAnalysisFormPanelMock.mockReturnValue({
      isDuplicateAlreadyConfirmed: false,
      savedDecisionNotice: null,
      handleOpenDuplicateDocument: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('opens the original document from the duplicate decision state', () => {
    const handleOpenDuplicateDocument = vi.fn()
    useAnalysisFormPanelMock.mockReturnValue({
      isDuplicateAlreadyConfirmed: false,
      savedDecisionNotice: null,
      handleOpenDuplicateDocument,
    })

    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Acessar documento original' }))

    expect(handleOpenDuplicateDocument).toHaveBeenCalledWith('original-file-1')
  })

  it('does not expose technical hash details in the duplicate decision state', () => {
    renderPanel()

    expect(
      screen.getByText('Foi encontrado um arquivo igual já recebido.', {
        exact: false,
      }),
    ).toBeTruthy()
    expect(screen.getByText('documento-original.pdf')).toBeTruthy()
    expect(screen.queryByText('Hash SHA-256')).toBeNull()
    expect(screen.queryByText('hash-1')).toBeNull()
  })

  it('does not allow confirming an already reviewed duplicate again', () => {
    useAnalysisFormPanelMock.mockReturnValue({
      isDuplicateAlreadyConfirmed: true,
      savedDecisionNotice: {
        title: 'Duplicidade já confirmada',
        description:
          'Este documento já foi registrado como duplicado. O documento original permanece como referência.',
      },
      handleOpenDuplicateDocument: vi.fn(),
    })

    renderPanel(vi.fn(), {
      status: 'duplicate',
      reviewedAt: new Date('2026-09-10T12:00:00.000Z'),
    })

    expect(
      (screen.getByRole('button', {
        name: 'Duplicidade já confirmada',
      }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })

  it('shows saved not linked notice and keeps saving available', () => {
    useAnalysisFormPanelMock.mockReturnValue({
      isDuplicateAlreadyConfirmed: false,
      savedDecisionNotice: {
        title: 'Decisão salva: não vinculado',
        description:
          'Registrado por Advogado de desenvolvimento em 10/09/2026, 09:00. Você ainda pode alterar o resultado, selecionar caso e checklist, e salvar uma nova decisão.',
      },
      handleOpenDuplicateDocument: vi.fn(),
    })

    renderPanel(
      vi.fn(),
      {
        status: 'not_linked',
        reviewedAt: new Date('2026-09-10T12:00:00.000Z'),
      },
      'not_linked',
    )

    expect(screen.getByRole('status').textContent).toContain(
      'Decisão salva: não vinculado',
    )
    expect(screen.getByRole('status').textContent).toContain(
      'Registrado por Advogado de desenvolvimento',
    )
    expect(
      (screen.getByRole('button', { name: 'Salvar decisão' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })
})
