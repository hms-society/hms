import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ClientCommunicationsTab } from '../index'
import { useClientCommunicationsTab } from '../use-client-communications-tab'

vi.mock('../use-client-communications-tab', () => ({
  useClientCommunicationsTab: vi.fn(),
}))

const useClientCommunicationsTabMock = vi.mocked(useClientCommunicationsTab)

const communication = {
  id: 'communication-1',
  channel: 'whatsapp',
  direction: 'inbound',
  content: 'Olá, preciso de ajuda com meu atendimento.',
  author: 'Mariana Costa',
  createdAt: '2026-08-10T12:00:00.000Z',
}

function fakeHook(
  overrides: Partial<ReturnType<typeof useClientCommunicationsTab>> = {},
): ReturnType<typeof useClientCommunicationsTab> {
  return {
    channelFilter: 'all',
    filteredCommunications: [],
    handleChannelFilterChange: vi.fn(),
    handlePeriodFilterChange: vi.fn(),
    handleTypeFilterChange: vi.fn(),
    isErrorCommunications: false,
    isLoadingCommunications: false,
    periodFilter: 'all',
    typeFilter: 'all',
    ...overrides,
  }
}

describe('ClientCommunicationsTab', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the loading state', () => {
    useClientCommunicationsTabMock.mockReturnValue(
      fakeHook({ isLoadingCommunications: true }),
    )

    render(<ClientCommunicationsTab clientId='client-1' />)

    expect(screen.getByText('Carregando histórico...')).toBeTruthy()
  })

  it('renders the error state', () => {
    useClientCommunicationsTabMock.mockReturnValue(
      fakeHook({ isErrorCommunications: true }),
    )

    render(<ClientCommunicationsTab clientId='client-1' />)

    expect(screen.getByText('Erro ao se conectar com a API de histórico.')).toBeTruthy()
  })

  it('renders the empty state when no communication matches the filters', () => {
    useClientCommunicationsTabMock.mockReturnValue(fakeHook())

    render(<ClientCommunicationsTab clientId='client-1' />)

    expect(
      screen.getByText('Nenhuma comunicação encontrada com os filtros selecionados.'),
    ).toBeTruthy()
  })

  it('renders communication content and metadata', () => {
    useClientCommunicationsTabMock.mockReturnValue(
      fakeHook({ filteredCommunications: [communication] }),
    )

    render(<ClientCommunicationsTab clientId='client-1' />)

    expect(screen.getByText(communication.content)).toBeTruthy()
    expect(screen.getByText('Recebida')).toBeTruthy()
    expect(screen.getByText('Cliente')).toBeTruthy()
    expect(screen.getByText(communication.author)).toBeTruthy()
  })
})
