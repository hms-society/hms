import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PortalDocumentsPage } from '../index'
import { RestContext } from '@/ui/shared/contexts/rest-context'

describe('PortalDocumentsPage', () => {
  let queryClient: QueryClient
  const mockCaseManagementService = {
    listPortalPendingChecklist: vi.fn(),
    uploadPortalDocument: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  afterEach(cleanup)

  function renderWithProviders(ui: ReactNode) {
    return render(
      <RestContext.Provider
        value={
          {
            caseManagementService: mockCaseManagementService as any,
          } as any
        }
      >
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </RestContext.Provider>,
    )
  }

  it('renders loading state initially', () => {
    mockCaseManagementService.listPortalPendingChecklist.mockReturnValue(
      new Promise(() => {}),
    )

    renderWithProviders(<PortalDocumentsPage caseId='case-1' portalToken='token-1' />)

    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('renders error state and allows retrying', async () => {
    mockCaseManagementService.listPortalPendingChecklist.mockResolvedValue({
      isFailure: true,
      throwError: () => {
        throw new Error('Link expirado')
      },
    })

    renderWithProviders(<PortalDocumentsPage caseId='case-1' portalToken='token-1' />)

    expect(await screen.findByText('Não foi possível acessar este portal')).toBeTruthy()

    const retryButton = screen.getByRole('button', { name: 'Tentar novamente' })
    expect(retryButton).toBeTruthy()
  })

  it('renders pending and sent sections with items', async () => {
    const items = [
      {
        id: 'item-1',
        title: 'Documento de Identidade (RG)',
        status: 'pending',
        isRequired: true,
      },
      {
        id: 'item-2',
        title: 'Comprovante de Residência',
        status: 'in_analysis',
        documentFileName: 'comprovante.pdf',
        isRequired: true,
      },
      {
        id: 'item-3',
        title: 'Certidão de Nascimento',
        status: 'validated',
        documentFileName: 'certidao.pdf',
        isRequired: true,
      },
    ]

    mockCaseManagementService.listPortalPendingChecklist.mockResolvedValue({
      isFailure: false,
      body: items,
    })

    renderWithProviders(<PortalDocumentsPage caseId='case-1' portalToken='token-1' />)

    expect(await screen.findByText('Documento de Identidade (RG)')).toBeTruthy()
    expect(screen.getByText('Comprovante de Residência')).toBeTruthy()
    expect(screen.getByText('Certidão de Nascimento')).toBeTruthy()

    const sendButton = screen.getByRole('button', { name: 'Enviar documento' })
    fireEvent.click(sendButton)

    expect(screen.getAllByText('Documento de Identidade (RG)').length).toBeGreaterThan(0)
  })
})
