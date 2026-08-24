import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ClientsListPage } from '../index'
import { useClientsListPage } from '../use-clients-list-page'

vi.mock('../use-clients-list-page', () => ({
  useClientsListPage: vi.fn(),
}))

const useClientsListPageMock = vi.mocked(useClientsListPage)

const client = {
  id: 'client-1',
  name: 'Ana Ribeiro',
  taxId: { value: '12345678900' },
  phone: '11999999999',
}

function createController(
  overrides: Partial<ReturnType<typeof useClientsListPage>> = {},
): ReturnType<typeof useClientsListPage> {
  return {
    clients: [],
    handleClientRegisterDialogOpenChange: vi.fn(),
    handleClientSelect: vi.fn(),
    handleClientSelected: vi.fn(),
    handleNextPage: vi.fn(),
    handleOriginChange: vi.fn(),
    handleOpenClientRegisterDialog: vi.fn(),
    handlePreviousPage: vi.fn(),
    handleResponsibleChange: vi.fn(),
    handleSearchChange: vi.fn(),
    handleStatusChange: vi.fn(),
    isClientRegisterDialogOpen: false,
    isLoading: false,
    limit: 20,
    maskPhone: (value = '') => value,
    maskTaxId: (value = '') => value,
    origin: 'origem',
    page: 1,
    responsavel: 'responsavel',
    search: '',
    status: 'status',
    total: 0,
    totalPages: 1,
    ...overrides,
  }
}

describe('ClientsListPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the page heading and loading state', () => {
    useClientsListPageMock.mockReturnValue(createController({ isLoading: true }))

    render(<ClientsListPage />)

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeTruthy()
    expect(screen.getByText('Carregando clientes...')).toBeTruthy()
  })

  it('renders the empty state when no client is returned', () => {
    useClientsListPageMock.mockReturnValue(createController())

    render(<ClientsListPage />)

    expect(screen.getByText('Nenhum cliente encontrado.')).toBeTruthy()
    expect(screen.getByText('Exibindo 0-0 de 0')).toBeTruthy()
  })

  it('renders client data and delegates row and search interactions', () => {
    const handleClientSelect = vi.fn()
    const handleSearchChange = vi.fn()
    useClientsListPageMock.mockReturnValue(
      createController({
        clients: [
          {
            client,
            clientStatus: 'Cliente',
            displayName: 'Ana Ribeiro',
            displayOrigin: 'Direta HMS',
            initials: 'AR',
            intakesCount: 2,
            statusStyle: {
              badge: 'text-emerald-800',
              avatar: 'text-emerald-800',
            },
          },
        ],
        handleClientSelect,
        handleSearchChange,
        total: 1,
      }),
    )

    render(<ClientsListPage />)

    expect(screen.getByText('Ana Ribeiro')).toBeTruthy()
    expect(screen.getByText('Direta HMS')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()

    fireEvent.click(screen.getByText('Ana Ribeiro'))
    fireEvent.change(
      screen.getAllByPlaceholderText('Buscar por nome, CPF, CNPJ ou telefone...')[0],
      { target: { value: 'Ana' } },
    )

    expect(handleClientSelect).toHaveBeenCalledWith('client-1')
    expect(handleSearchChange).toHaveBeenCalledWith('Ana')
  })

  it('opens the client registration dialog from the page action', () => {
    const handleOpenClientRegisterDialog = vi.fn()
    useClientsListPageMock.mockReturnValue(
      createController({ handleOpenClientRegisterDialog }),
    )

    render(<ClientsListPage />)

    fireEvent.click(screen.getByRole('button', { name: /novo cliente/i }))

    expect(handleOpenClientRegisterDialog).toHaveBeenCalledTimes(1)
  })

  it('delegates pagination controls to the page hook', () => {
    const handleNextPage = vi.fn()
    const handlePreviousPage = vi.fn()
    useClientsListPageMock.mockReturnValue(
      createController({
        clients: [],
        handleNextPage,
        handlePreviousPage,
        page: 2,
        total: 40,
        totalPages: 2,
      }),
    )

    render(<ClientsListPage />)

    fireEvent.click(screen.getByRole('link', { name: /previous/i }))
    fireEvent.click(screen.getByRole('link', { name: /next/i }))

    expect(handlePreviousPage).toHaveBeenCalledTimes(1)
    expect(handleNextPage).toHaveBeenCalledTimes(1)
  })
})
