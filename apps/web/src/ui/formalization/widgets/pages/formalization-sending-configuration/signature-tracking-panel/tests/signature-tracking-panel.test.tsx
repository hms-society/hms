import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormalizationSignatureSendingStatusResponse } from '@hms/core/formalization/domain/structures'
import type { SignatureTrackingPanelProps } from '../use-signature-tracking-panel'

import { SignatureTrackingPanel } from '..'

vi.mock('../signature-progress-summary', () => ({
  SignatureProgressSummary: () => <p>progress summary</p>,
}))
vi.mock('../signature-document-group', () => ({
  SignatureDocumentGroup: ({ document }: { document: { title: string } }) => (
    <p>document: {document.title}</p>
  ),
}))
vi.mock('../resend-signature-invitation-dialog', () => ({
  ResendSignatureInvitationDialog: () => null,
}))
vi.mock('../cancel-signature-sending-dialog', () => ({
  CancelSignatureSendingDialog: () => null,
}))

const status: FormalizationSignatureSendingStatusResponse = {
  formalizationId: 'formalization-1',
  formalizationStatus: 'in_progress',
  formalizationVersion: 4,
  requestId: 'request-1',
  status: 'sent',
  version: 7,
  totalDocuments: 1,
  completedDocuments: 0,
  failedDocuments: 0,
  progressPercentage: 0,
  canCancel: true,
  canRetry: false,
  canConfirmContracting: false,
  viewerMode: 'operator',
  permissions: { canOperate: true, canViewDocumentContent: true },
  documents: [],
}

function renderPanel(overrides: Partial<SignatureTrackingPanelProps> = {}) {
  return render(
    <SignatureTrackingPanel
      formalizationId='formalization-1'
      formalizationVersion={4}
      status={status}
      isRefreshing={false}
      isResending={false}
      isCancelling={false}
      resendError={null}
      cancelError={null}
      onRefresh={vi.fn().mockResolvedValue(undefined)}
      onResend={vi.fn().mockResolvedValue({})}
      onCancel={vi.fn().mockResolvedValue({})}
      {...overrides}
    />,
  )
}

describe('SignatureTrackingPanel', () => {
  afterEach(cleanup)

  it('renders refresh, cancel, progress and empty-document states', () => {
    renderPanel()

    expect(screen.getByRole('region', { name: 'Acompanhar assinaturas' })).not.toBeNull()
    expect(screen.getByText('progress summary')).not.toBeNull()
    expect(
      screen.getByText('Nenhum documento foi retornado para esta solicitação.'),
    ).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar envio' }))
    expect(screen.getByRole('button', { name: 'Cancelar envio' })).not.toBeNull()
  })

  it('disables refresh/cancel while their corresponding operations are pending and announces errors', () => {
    renderPanel({
      isRefreshing: true,
      isCancelling: true,
      cancelError: new Error('failed'),
    })

    expect(
      (screen.getByRole('button', { name: 'Atualizar' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Cancelando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível cancelar')
  })

  it('reflects persisted cancellation and removes the cancel action while pending', () => {
    renderPanel({
      status: {
        ...status,
        status: 'reconciliation_required',
        canCancel: false,
        cancellationRequestedAt: new Date('2026-09-01T10:00:00.000Z'),
      },
      isCancelling: true,
    })

    expect(screen.queryByRole('button', { name: 'Cancelar envio' })).toBeNull()
    expect(screen.getByRole('status').textContent).toContain(
      'aguarda confirmação do provedor',
    )
  })
})
