import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DocumentReviewDecisionBar, DocumentReviewHeader } from '..'

const viewModel = {
  title: 'Procuração',
  versionNumber: 2,
  sourceLabel: 'Geração por IA',
  status: 'in_review' as const,
  statusLabel: 'Em revisão',
  isCurrent: false,
  isApproved: false,
  isInReview: true,
  isRejected: false,
  generationState: 'idle' as const,
  isGenerating: false,
  isGenerationFailed: false,
  createdAtLabel: '13/08/2026 09:00',
}

describe('DocumentReview', () => {
  it('exposes keyboard-reachable header actions through accessible names', () => {
    const onBack = vi.fn()
    const onHistory = vi.fn()
    const onPendingMarkers = vi.fn()

    render(
      <DocumentReviewHeader
        viewModel={viewModel}
        pendingMarkersCount={2}
        onBack={onBack}
        onHistory={onHistory}
        onPendingMarkers={onPendingMarkers}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Voltar aos documentos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver versões' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pendências (2)' }))

    expect(onBack).toHaveBeenCalledOnce()
    expect(onHistory).toHaveBeenCalledOnce()
    expect(onPendingMarkers).toHaveBeenCalledOnce()
  })

  it('keeps the decision actions available for an in-review version', () => {
    render(
      <DocumentReviewDecisionBar
        viewModel={viewModel}
        isEditing={false}
        isSaving={false}
        isSubmittingDecision={false}
        isSelectingCurrent={false}
        isRegenerating={false}
        isCancellingGeneration={false}
        onEdit={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onSelectCurrent={vi.fn()}
        onRegenerate={vi.fn()}
        onCancelGeneration={vi.fn()}
        onViewRejectionReason={vi.fn()}
      />,
    )

    expect(screen.getByRole('region', { name: 'Decisão da versão' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Aprovar versão' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Rejeitar versão' })).toBeDefined()
  })
})
