import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'

import { AnalysisFormPanel } from '..'
import { useAnalysisFormPanel } from '../use-analysis-form-panel'

vi.mock('../use-analysis-form-panel', () => ({
  useAnalysisFormPanel: vi.fn(),
}))

const useAnalysisFormPanelMock = vi.mocked(useAnalysisFormPanel)

function renderPanel(onOpenDocument = vi.fn()) {
  function TestPanel() {
    const form = useForm<DocumentReviewFormData>({
      defaultValues: {
        decision: 'duplicate',
        documentTypeId: 'comprovante_residencia',
        checklistRequirementId: 'checklist-item-1',
        originalDocumentId: '',
        reason: '',
      },
    })

    return (
      <AnalysisFormPanel
        form={form}
        currentDecision='duplicate'
        isSubmitting={false}
        confidence='Alta confiança'
        document={DocumentValidationDocumentFaker.fake({
          duplicateMatch: {
            documentFileId: 'original-file-1',
            fileName: 'documento-original.pdf',
            receivedAt: new Date('2026-08-13T14:32:00.000Z'),
            caseLabel: 'Caso 0089',
            checklistItemLabel: 'Comprovante de residência',
            hashSha256: 'hash-1',
          },
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
      handleOpenDuplicateDocument: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('opens the original document from the duplicate decision state', () => {
    const handleOpenDuplicateDocument = vi.fn()
    useAnalysisFormPanelMock.mockReturnValue({ handleOpenDuplicateDocument })

    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Acessar documento original' }))

    expect(handleOpenDuplicateDocument).toHaveBeenCalledWith('original-file-1')
  })
})
