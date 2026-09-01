import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useChecklistItemDetailPage } from '../use-checklist-item-detail-page'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useNavigationMock = vi.mocked(useNavigation)
const useRestContextMock = vi.mocked(useRestContext)

describe('useChecklistItemDetailPage', () => {
  const navigateTo = vi.fn()
  const caseManagementService = {
    listCaseChecklist: vi.fn(),
  }
  const documentValidationService = {
    getDocument: vi.fn(),
    listLogs: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigationMock.mockReturnValue({
      navigateCollaboratorsSearch: vi.fn(),
      navigateTo,
    })
    useRestContextMock.mockReturnValue({
      caseManagementService,
      documentValidationService,
    } as never)
  })

  it('shows a requested resend as the current checklist document status and history event', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({
        body: [
          {
            caseId: 'case-1',
            createdAt: '2026-08-30T11:55:00.000Z',
            documentFileId: 'document-file-1',
            documentFileName: 'documento-incompleto.pdf',
            id: 'checklist-item-1',
            isRequired: true,
            status: 'pending',
            templateItemKey: 'identificacao-oficial',
            title: 'Documento de Identificação Oficial',
            updatedAt: '2026-08-30T11:55:00.000Z',
          },
        ],
        statusCode: 200,
      }),
    )
    documentValidationService.getDocument.mockResolvedValue(
      new RestResponse({
        body: {
          batchId: 'batch-1',
          channel: 'whatsapp',
          checklistLink: {
            caseId: 'case-1',
            caseLabel: 'Caso Previdenciário',
            checklistItemId: 'checklist-item-1',
            checklistItemLabel: 'Documento de Identificação Oficial',
          },
          createdAt: '2026-08-30T12:00:00.000Z',
          extractedFields: [],
          fileName: 'documento-incompleto.pdf',
          id: 'document-file-1',
          mimeType: 'application/pdf',
          missingFields: ['Verso do RG'],
          receivedAt: '2026-08-30T12:00:00.000Z',
          reviewedAt: '2026-08-30T12:02:00.000Z',
          reviewedBy: 'lawyer-1',
          reviewedByName: 'Advogado de desenvolvimento',
          sender: 'cliente@exemplo.com',
          sizeBytes: 1024,
          status: DocumentValidationStatus.ResendRequested,
          storagePath: 'documents/documento-incompleto.pdf',
          updatedAt: '2026-08-30T12:02:00.000Z',
        },
        statusCode: 200,
      }),
    )
    documentValidationService.listLogs.mockResolvedValue(
      new RestResponse({
        body: [
          {
            action: 'resend_requested',
            actorId: 'lawyer-1',
            createdAt: '2026-08-30T12:02:00.000Z',
            documentFileId: 'document-file-1',
            id: 'log-1',
            message: 'Envie novamente com o verso do RG.',
            reason: 'Conteúdo incompleto',
            status: DocumentValidationStatus.ResendRequested,
            updatedAt: '2026-08-30T12:02:00.000Z',
          },
        ],
        statusCode: 200,
      }),
    )

    const { result } = renderHook(
      () =>
        useChecklistItemDetailPage({
          caseId: 'case-1',
          checklistItemId: 'checklist-item-1',
        }),
      { wrapper },
    )

    await waitFor(() =>
      expect(result.current.itemView.statusLabel).toBe('Reenvio solicitado'),
    )
    expect(result.current.itemView.historyEvents[0]).toMatchObject({
      badge: 'Reenvio solicitado',
      title: 'Reenvio solicitado',
    })
    expect(result.current.itemView.historyEvents[0]?.description).toContain(
      'Reenvio solicitado por Advogado de desenvolvimento em 30/08/2026,',
    )
    expect(result.current.itemView.historyEvents[0]?.description).toContain(
      'Motivo: Conteúdo incompleto.',
    )
    expect(result.current.itemView.pendingItems).toEqual([])
  })

  it('opens the validation document with case return context', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    caseManagementService.listCaseChecklist.mockResolvedValue(
      new RestResponse({
        body: [
          {
            caseId: 'case-1',
            createdAt: '2026-08-30T11:55:00.000Z',
            documentFileId: 'document-file-1',
            documentFileName: 'documento.pdf',
            id: 'checklist-item-1',
            isRequired: true,
            status: 'pending',
            templateItemKey: 'identificacao-oficial',
            title: 'Documento de Identificação Oficial',
            updatedAt: '2026-08-30T11:55:00.000Z',
          },
        ],
        statusCode: 200,
      }),
    )
    documentValidationService.getDocument.mockResolvedValue(
      new RestResponse({
        body: {
          batchId: 'batch-1',
          channel: 'whatsapp',
          createdAt: '2026-08-30T12:00:00.000Z',
          extractedFields: [],
          fileName: 'documento.pdf',
          id: 'document-file-1',
          mimeType: 'application/pdf',
          missingFields: [],
          receivedAt: '2026-08-30T12:00:00.000Z',
          sender: 'cliente@exemplo.com',
          sizeBytes: 1024,
          status: DocumentValidationStatus.AwaitingValidation,
          storagePath: 'documents/documento.pdf',
          updatedAt: '2026-08-30T12:00:00.000Z',
        },
        statusCode: 200,
      }),
    )
    documentValidationService.listLogs.mockResolvedValue(
      new RestResponse({
        body: [],
        statusCode: 200,
      }),
    )

    const { result } = renderHook(
      () =>
        useChecklistItemDetailPage({
          caseId: 'case-1',
          checklistItemId: 'checklist-item-1',
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.documentFileId).toBe('document-file-1'))

    result.current.handleOpenValidationDesk()

    expect(navigateTo).toHaveBeenCalledWith('documentAnalysis', {
      params: { fileId: 'document-file-1' },
      search: { fromCaseId: 'case-1' },
    })
  })
})
