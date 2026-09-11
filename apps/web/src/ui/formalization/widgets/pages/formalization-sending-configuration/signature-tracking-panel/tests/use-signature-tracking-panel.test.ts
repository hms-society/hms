import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FormalizationSignatureSendingStatusResponse } from '@hms/core/formalization/domain/structures'

import { useSignatureTrackingPanel } from '../use-signature-tracking-panel'

const signatory = {
  recipientId: 'recipient-1',
  recipientVersion: 1,
  displayName: 'Ana',
  actorKind: 'client',
  deliveryChannel: 'email',
  status: 'invited',
  canResend: true,
} as const
const props = {
  formalizationId: 'formalization-1',
  formalizationVersion: 2,
  status: {
    formalizationId: 'formalization-1',
    formalizationStatus: 'in_progress',
    formalizationVersion: 2,
    requestId: 'request-1',
    status: 'sent',
    version: 3,
    totalDocuments: 0,
    completedDocuments: 0,
    failedDocuments: 0,
    progressPercentage: 0,
    canCancel: true,
    canRetry: false,
    canConfirmContracting: false,
    viewerMode: 'operator',
    permissions: { canOperate: true, canViewDocumentContent: true },
    documents: [],
  } satisfies FormalizationSignatureSendingStatusResponse,
  isRefreshing: false,
  isResending: false,
  isCancelling: false,
  resendError: null,
  cancelError: null,
  onRefresh: vi.fn().mockResolvedValue(undefined),
  onResend: vi.fn(),
  onCancel: vi.fn(),
}

describe('useSignatureTrackingPanel', () => {
  it('owns recipient selection and mutually exclusive dialog state', () => {
    const { result } = renderHook(() => useSignatureTrackingPanel(props))

    act(() => result.current.handleRequestResend(signatory))
    expect(result.current.dialog).toBe('resend')
    expect(result.current.selectedSignatory).toBe(signatory)

    act(() => result.current.handleRequestCancel())
    expect(result.current.dialog).toBe('cancel')

    act(() => result.current.handleResendOpenChange(false))
    expect(result.current.dialog).toBeNull()
    expect(result.current.selectedSignatory).toBeNull()
  })

  it('delegates refresh without changing the server-owned status', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useSignatureTrackingPanel({ ...props, onRefresh }),
    )

    await act(async () => result.current.handleRefresh())

    expect(onRefresh).toHaveBeenCalledOnce()
    expect(result.current.status).toBe(props.status)
  })
})
