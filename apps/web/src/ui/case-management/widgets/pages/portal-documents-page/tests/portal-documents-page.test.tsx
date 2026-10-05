import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import { usePortalDocumentsPage } from '../use-portal-documents-page'
import { PortalDocumentsPage } from '../index'

const { caseManagementServiceMock } = vi.hoisted(() => ({
  caseManagementServiceMock: {
    uploadPortalDocument: vi.fn(),
  },
}))

vi.mock('../use-portal-documents-page', () => ({
  usePortalDocumentsPage: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({ caseManagementService: caseManagementServiceMock }),
}))

const usePortalDocumentsPageMock = vi.mocked(usePortalDocumentsPage)

const pendingItem: CaseChecklistItem = {
  id: '00000000-0000-4000-8000-000000000001',
  caseId: '00000000-0000-4000-8000-000000000002',
  templateItemKey: 'identity-document',
  title: 'Documento de identidade',
  isRequired: true,
  status: 'pending',
  createdAt: new Date('2026-09-22T10:00:00.000Z'),
  updatedAt: new Date('2026-09-22T10:00:00.000Z'),
}

const inAnalysisItem: CaseChecklistItem = {
  ...pendingItem,
  id: '00000000-0000-4000-8000-000000000003',
  templateItemKey: 'proof-of-address',
  title: 'Comprovante de endereço',
  status: 'in_analysis',
  documentFileName: 'endereco.pdf',
}

const validatedItem: CaseChecklistItem = {
  ...pendingItem,
  id: '00000000-0000-4000-8000-000000000004',
  templateItemKey: 'income-proof',
  title: 'Comprovante de renda',
  status: 'validated',
  documentFileName: 'renda.pdf',
}

function renderPortalDocumentsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <PortalDocumentsPage caseId='case-1' portalToken='portal-token' />
    </QueryClientProvider>,
  )
}

function selectFile(file: File) {
  const input = screen.getByLabelText('Selecionar arquivo') as HTMLInputElement
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  fireEvent.change(input)
}

describe('PortalDocumentsPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    caseManagementServiceMock.uploadPortalDocument.mockResolvedValue({
      isFailure: false,
      body: { protocol: 'PORTAL-123' },
    })
    usePortalDocumentsPageMock.mockReturnValue({
      checklist: [pendingItem, inAnalysisItem, validatedItem],
      pendingItems: [pendingItem],
      inAnalysisItems: [inAnalysisItem],
      validatedItems: [validatedItem],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('renders checklist items, statuses, and the upload action only for pending items', () => {
    renderPortalDocumentsPage()

    expect(screen.getByRole('heading', { name: 'Meus documentos' })).not.toBeNull()
    expect(screen.getByText('Documento de identidade')).not.toBeNull()
    expect(screen.getByText('Comprovante de endereço')).not.toBeNull()
    expect(screen.getByText('Comprovante de renda')).not.toBeNull()
    expect(screen.getByText('endereco.pdf · aguardando análise')).not.toBeNull()
    expect(screen.getByText('renda.pdf · documento validado')).not.toBeNull()
    expect(screen.getByText('Pendente')).not.toBeNull()
    expect(screen.getByText('Em análise')).not.toBeNull()
    expect(screen.getByText('Validado')).not.toBeNull()
    expect(screen.getAllByRole('button', { name: 'Enviar documento' })).toHaveLength(1)
    expect(usePortalDocumentsPageMock).toHaveBeenCalledWith('case-1', 'portal-token')
  })

  it('shows checklist loading placeholders', () => {
    usePortalDocumentsPageMock.mockReturnValue({
      checklist: [],
      pendingItems: [],
      inAnalysisItems: [],
      validatedItems: [],
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: vi.fn(),
    })
    renderPortalDocumentsPage()

    expect(screen.getByRole('main').querySelectorAll('.animate-pulse')).toHaveLength(3)
  })

  it('shows empty states for pending and previously uploaded documents', () => {
    usePortalDocumentsPageMock.mockReturnValue({
      checklist: [],
      pendingItems: [],
      inAnalysisItems: [],
      validatedItems: [],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    })
    renderPortalDocumentsPage()

    expect(screen.getByText('Não há documentos pendentes no momento.')).not.toBeNull()
    expect(screen.getByText('Nenhum documento foi enviado ainda.')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Enviar documento' })).toBeNull()
  })

  it('opens the upload dialog for the selected pending document and closes it on cancel', () => {
    renderPortalDocumentsPage()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar documento' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Documento de identidade')).not.toBeNull()
    expect(within(dialog).getByLabelText('Selecionar arquivo')).not.toBeNull()

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Cancelar' })[0])

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the protocol after a successful upload', async () => {
    renderPortalDocumentsPage()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar documento' }))
    selectFile(new File(['pdf-content'], 'identidade.pdf', { type: 'application/pdf' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Enviar documento',
      }),
    )

    expect(await screen.findByText('Documento recebido')).not.toBeNull()
    expect(screen.getByText('PORTAL-123')).not.toBeNull()
    expect(caseManagementServiceMock.uploadPortalDocument).toHaveBeenCalledWith(
      'case-1',
      pendingItem.id,
      'portal-token',
      expect.any(FormData),
    )
  })

  it('shows an upload error and keeps the dialog open for recovery', async () => {
    caseManagementServiceMock.uploadPortalDocument.mockResolvedValue({
      isFailure: true,
      throwError() {
        throw new Error('Upload failed')
      },
    })
    renderPortalDocumentsPage()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar documento' }))
    selectFile(new File(['pdf-content'], 'identidade.pdf', { type: 'application/pdf' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Enviar documento',
      }),
    )

    expect((await screen.findByRole('alert')).textContent).toContain('Upload failed')
    expect(screen.getByRole('dialog')).not.toBeNull()
  })

  it('shows a retry action when the portal checklist cannot be loaded', () => {
    const refetch = vi.fn()
    usePortalDocumentsPageMock.mockReturnValue({
      checklist: [],
      pendingItems: [],
      inAnalysisItems: [],
      validatedItems: [],
      isLoading: false,
      isFetching: false,
      error: new Error('Portal unavailable'),
      refetch,
    })
    renderPortalDocumentsPage()

    expect(
      screen.getByRole('heading', { name: 'Não foi possível acessar este portal' }),
    ).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(refetch).toHaveBeenCalledOnce()
  })
})
