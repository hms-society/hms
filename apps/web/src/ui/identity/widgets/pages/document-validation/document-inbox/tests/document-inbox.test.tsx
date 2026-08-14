import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

import { DocumentInboxPage } from '..'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({
    navigateTo: vi.fn(),
  }),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('DocumentInboxPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders inbox documents returned by the backend', async () => {
    useRestContextMock.mockReturnValue({
      documentValidationService: {
        listDocuments: vi.fn().mockResolvedValue(
          new RestResponse({
            body: [
              fakeDocument({
                fileName: 'comprovante-residencia.pdf',
                status: 'validated',
              }),
              fakeDocument({
                id: 'document-file-2',
                fileName: 'rg-frente-verso.jpg',
                status: 'illegible',
              }),
            ],
          }),
        ),
      },
    } as never)

    renderDocumentInboxPage()

    await waitFor(() => {
      expect(screen.getByText('comprovante-residencia.pdf')).toBeDefined()
    })
    expect(screen.getByText('rg-frente-verso.jpg')).toBeDefined()
    expect(screen.getAllByText('Validado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ilegível').length).toBeGreaterThan(0)
  })
})

function renderDocumentInboxPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentInboxPage />
    </QueryClientProvider>,
  )
}

function fakeDocument(
  overrides: Partial<DocumentValidationDocument> = {},
): DocumentValidationDocument {
  return {
    id: 'document-file-1',
    batchId: 'document-batch-1',
    fileName: 'comprovante-residencia.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    storagePath: 'seed/comprovante-residencia.pdf',
    status: 'awaiting_validation',
    channel: DocumentBatchChannel.InternalUpload,
    sender: 'mariana.silva@email.com',
    receivedAt: new Date('2026-08-14T14:32:00.000Z'),
    createdAt: new Date('2026-08-14T14:32:00.000Z'),
    extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
    missingFields: [],
    checklistLink: {
      caseLabel: 'Caso 0089',
      checklistItemLabel: 'Comprovante de residência',
    },
    ...overrides,
  }
}
