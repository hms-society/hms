import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ClientDocumentsTab } from '../index'
import { useClientDocumentsTab } from '../use-client-documents-tab'

vi.mock('../use-client-documents-tab', () => ({
  useClientDocumentsTab: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: vi.fn() }),
}))

const useClientDocumentsTabMock = vi.mocked(useClientDocumentsTab)

const batch = {
  id: 'batch-1',
  readableId: 'LOTE-0001',
  channel: 'upload',
  createdAt: '2026-08-10T12:00:00.000Z',
  files: [],
}

describe('ClientDocumentsTab', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the loading state', () => {
    useClientDocumentsTabMock.mockReturnValue({
      batches: [],
      isError: false,
      isLoading: true,
    })

    render(<ClientDocumentsTab clientId='client-1' />)

    expect(screen.getByText('Carregando documentos...')).toBeTruthy()
  })

  it('renders the error state', () => {
    useClientDocumentsTabMock.mockReturnValue({
      batches: [],
      isError: true,
      isLoading: false,
    })

    render(<ClientDocumentsTab clientId='client-1' />)

    expect(screen.getByText('Erro ao carregar os documentos.')).toBeTruthy()
  })

  it('renders the empty state', () => {
    useClientDocumentsTabMock.mockReturnValue({
      batches: [],
      isError: false,
      isLoading: false,
    })

    render(<ClientDocumentsTab clientId='client-1' />)

    expect(screen.getByText('Nenhum lote de documentos encontrado.')).toBeTruthy()
  })

  it('renders returned document batches', () => {
    useClientDocumentsTabMock.mockReturnValue({
      batches: [batch],
      isError: false,
      isLoading: false,
    })

    render(<ClientDocumentsTab clientId='client-1' />)

    expect(screen.getByText('LOTE-0001')).toBeTruthy()
    expect(screen.getByText('LOTE-0001').parentElement?.textContent).toContain(
      'Upload interno',
    )
  })
})
