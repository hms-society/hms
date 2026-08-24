import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { useDocumentValidationDocumentQuery } from '@/ui/document-engine/hooks/use-document-validation-document-query'
import { useRecordDocumentValidationDecisionAction } from '@/ui/document-engine/hooks/use-record-document-validation-decision-action'
import { useRequestDocumentResendAction } from '@/ui/document-engine/hooks/use-request-document-resend-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useDocumentAnalysis } from '../use-document-analysis'

vi.mock('@/ui/document-engine/hooks/use-document-validation-document-query', () => ({
  useDocumentValidationDocumentQuery: vi.fn(),
}))

vi.mock(
  '@/ui/document-engine/hooks/use-record-document-validation-decision-action',
  () => ({
    useRecordDocumentValidationDecisionAction: vi.fn(),
  }),
)

vi.mock('@/ui/document-engine/hooks/use-request-document-resend-action', () => ({
  useRequestDocumentResendAction: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useDocumentValidationDocumentQueryMock = vi.mocked(
  useDocumentValidationDocumentQuery,
)
const useRecordDocumentValidationDecisionActionMock = vi.mocked(
  useRecordDocumentValidationDecisionAction,
)
const useRequestDocumentResendActionMock = vi.mocked(useRequestDocumentResendAction)
const useNavigationMock = vi.mocked(useNavigation)

describe('useDocumentAnalysis', () => {
  const document = DocumentValidationDocumentFaker.fake({
    id: 'document-file-1',
    fileName: 'documento-real.pdf',
    status: DocumentValidationStatus.Valid,
    sender: 'remetente@email.com',
    extractedFields: [{ label: 'Titular', value: 'Titular Real' }],
    aiSuggestion: { confidenceLabel: 'Alta confiança' },
  })
  const recordDecision = vi.fn()
  const requestResend = vi.fn()
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentValidationDocumentQueryMock.mockReturnValue({
      document,
      documentError: null,
      isLoadingDocument: false,
    })
    useRecordDocumentValidationDecisionActionMock.mockReturnValue({
      recordDecision,
      recordDecisionError: null,
      isRecordingDecision: false,
    })
    useRequestDocumentResendActionMock.mockReturnValue({
      requestResend,
      requestResendError: null,
      isRequestingResend: false,
    })
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('maps the real document data to the analysis view', () => {
    const { result } = renderHook(() => useDocumentAnalysis({ fileId: document.id }))

    expect(result.current.documentView).toMatchObject({
      fileName: 'documento-real.pdf',
      receivedFrom: 'Titular Real',
      status: 'Válido',
    })
  })

  it('opens the original document in the viewer', () => {
    const { result } = renderHook(() => useDocumentAnalysis({ fileId: document.id }))

    act(() => result.current.handleOpenDocument('original-file-1'))

    expect(navigateTo).toHaveBeenCalledWith('documentViewer', {
      params: { fileId: 'original-file-1' },
    })
  })

  it('sends the resend request with the form reason', async () => {
    const { result } = renderHook(() => useDocumentAnalysis({ fileId: document.id }))

    act(() => result.current.handleRequestResend())
    await act(async () => {
      await result.current.handleConfirmResend('Envie uma nova cópia.')
    })

    expect(requestResend).toHaveBeenCalledWith({
      message: 'Envie uma nova cópia.',
      reason: 'Documento incompleto',
    })
  })
})
