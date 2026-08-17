import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

import { DocumentAnalysisPage } from '..'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({
    navigateTo: vi.fn(),
  }),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: PropsWithChildren) => (
    <a href='/caixa-de-documentos'>{children}</a>
  ),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('DocumentAnalysisPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the not linked template for documents without a safe case match', async () => {
    mockDocument(fakeDocument({ status: 'not_linked' }))

    renderDocumentAnalysisPage('document-file-1')

    await waitFor(() => {
      expect(screen.getAllByText('Não vinculado').length).toBeGreaterThan(0)
    })
    expect(screen.getByText(/Sem sugestão segura de caso/)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Salvar decisão' })).toBeDefined()
  })

  it('renders the valid template with checklist and extracted fields', async () => {
    mockDocument(fakeDocument({ status: 'validated' }))

    renderDocumentAnalysisPage('document-file-1')

    await waitFor(() => {
      expect(screen.getAllByText('Válido').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Caso 0089')).toBeDefined()
    expect(screen.getByText('Data de emissão')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Confirmar validação' })).toBeDefined()
  })

  it('renders the illegible template with resend and save actions', async () => {
    mockDocument(fakeDocument({ status: 'illegible' }))

    renderDocumentAnalysisPage('document-file-1')

    await waitFor(() => {
      expect(screen.getAllByText('Ilegível').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Vínculo indisponível')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Solicitar reenvio' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Salvar decisão' })).toBeDefined()
  })

  it('renders the processing failure template with resend guidance', async () => {
    mockDocument(
      fakeDocument({
        status: 'processing_failure',
        failure: {
          reason: 'Arquivo protegido por senha',
          instruction:
            'Solicite ao remetente uma nova cópia do arquivo sem proteção por senha.',
        },
      }),
    )

    renderDocumentAnalysisPage('document-file-1')

    await waitFor(() => {
      expect(screen.getByText('Motivo da falha')).toBeDefined()
    })
    expect(screen.getByText('Arquivo protegido por senha')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Solicitar reenvio' })).toBeDefined()
  })

  it('renders resend requested as a read-only incomplete decision', async () => {
    mockDocument(fakeDocument({ status: 'resend_requested' }))

    renderDocumentAnalysisPage('document-file-1')

    await waitFor(() => {
      expect(screen.getAllByText('Reenvio solicitado').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Somente leitura')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Salvar decisão' })).toBeNull()
  })
})

function mockDocument(document: DocumentValidationDocument) {
  useRestContextMock.mockReturnValue({
    documentValidationService: {
      getDocument: vi.fn().mockResolvedValue(new RestResponse({ body: document })),
      recordDecision: vi.fn().mockResolvedValue(new RestResponse({ body: document })),
      requestResend: vi.fn().mockResolvedValue(new RestResponse({ body: document })),
    },
  } as never)
}

function renderDocumentAnalysisPage(fileId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentAnalysisPage fileId={fileId} />
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
    aiConfidence: 96,
    aiSuggestion: {
      confidenceLabel: 'Sugerido pela IA - Confiança alta',
      documentTypeId: 'comprovante_residencia',
    },
    extractedFields: [
      { label: 'Titular', value: 'Mariana Costa Silva' },
      { label: 'CPF', value: '284.***.***-19' },
      { label: 'Endereço', value: 'Rua das Palmeiras, 147' },
      { label: 'CEP', value: '01452-001' },
      { label: 'Data de emissão', value: '04/08/2026' },
    ],
    missingFields: [],
    checklistLink: {
      caseLabel: 'Caso 0089',
      checklistItemLabel: 'Comprovante de residência',
    },
    ...overrides,
  }
}
