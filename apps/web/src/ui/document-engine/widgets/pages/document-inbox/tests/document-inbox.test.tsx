import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentInboxPage } from '..'
import { useDocumentInbox } from '../use-document-inbox'

vi.mock('../use-document-inbox', () => ({
  useDocumentInbox: vi.fn(),
}))

const useDocumentInboxMock = vi.mocked(useDocumentInbox)

describe('DocumentInboxPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders inbox documents returned by its page hook', () => {
    useDocumentInboxMock.mockReturnValue({
      currentPage: 1,
      totalPages: 1,
      totalItems: 2,
      paginatedData: [
        {
          id: 'document-file-1',
          fileName: 'comprovante-residencia.pdf',
          fileSize: '2 KB',
          receivedFromIcon: 'user',
          receivedFrom: 'Mariana Costa Silva',
          contactInfo: 'Portal do cliente · mariana@example.com',
          caseId: 'Caso 0089',
          caseDesc: 'Comprovante de residência',
          receivedDate: 'Hoje',
          receivedTime: '14:32',
          status: 'Validado',
          badgeClasses: 'bg-success',
          dotClasses: 'bg-success',
        },
        {
          id: 'document-file-2',
          fileName: 'rg-frente-verso.jpg',
          fileSize: '1 KB',
          receivedFromIcon: 'user',
          receivedFrom: 'João da Silva',
          contactInfo: 'Portal do cliente · joao@example.com',
          caseId: 'Sem vínculo seguro',
          caseDesc: 'Escolha manual necessária',
          receivedDate: 'Ontem',
          receivedTime: '10:00',
          status: 'Ilegível',
          badgeClasses: 'bg-destructive',
          dotClasses: 'bg-destructive',
        },
      ],
      dateRange: undefined,
      setDateRange: vi.fn(),
      clientFilter: '',
      setClientFilter: vi.fn(),
      statusFilter: '',
      setStatusFilter: vi.fn(),
      uniqueStatuses: ['Validado', 'Ilegível'],
      uniqueClients: ['Mariana Costa Silva', 'João da Silva'],
      error: null,
      isFetching: false,
      handlePageChange: vi.fn(),
      handleAnalyze: vi.fn(),
      handleRefresh: vi.fn(),
      handleApplyFilters: vi.fn(),
      handleClearFilters: vi.fn(),
    } as never)

    render(<DocumentInboxPage />)

    expect(screen.getByText('comprovante-residencia.pdf')).toBeDefined()
    expect(screen.getByText('rg-frente-verso.jpg')).toBeDefined()
    expect(screen.getAllByText('Validado').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ilegível').length).toBeGreaterThan(0)
  })
})
