import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BottomDetails } from '../index'
import { useBottomDetails } from '../use-bottom-details'

vi.mock('../use-bottom-details', () => ({
  useBottomDetails: vi.fn(),
}))

const useBottomDetailsMock = vi.mocked(useBottomDetails)

function createController(overrides: Record<string, unknown> = {}) {
  return {
    approvedDocuments: [],
    error: null,
    handleUploadError: vi.fn(),
    isLoading: false,
    messages: [],
    pendingDocuments: [],
    timeline: [],
    ...overrides,
  }
}

describe('BottomDetails', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the loading state', () => {
    useBottomDetailsMock.mockReturnValue(createController({ isLoading: true }) as never)

    render(<BottomDetails />)

    expect(screen.queryByText('Checklist de Documentação')).toBeNull()
  })

  it('renders pending and approved documents and handles upload', () => {
    const handleUploadError = vi.fn()
    useBottomDetailsMock.mockReturnValue(
      createController({
        handleUploadError,
        pendingDocuments: [{ name: 'Contrato pendente', status: 'pending' }],
        approvedDocuments: [
          { name: 'Documento aprovado', status: 'approved', updatedAt: '29/07/2026' },
        ],
        timeline: [
          {
            title: 'Caso registrado',
            desc: 'Registro recebido',
            date: '28/07/2026',
            time: '14:32',
          },
        ],
        messages: [
          {
            sender: 'Secretaria HMS',
            role: 'Atendimento',
            date: 'Hoje',
            content: 'Mensagem de teste',
          },
        ],
      }) as never,
    )

    render(<BottomDetails />)

    expect(screen.getByText('Contrato pendente')).toBeTruthy()
    expect(screen.getByText('Documento aprovado')).toBeTruthy()
    expect(screen.getByText('Caso registrado')).toBeTruthy()
    expect(screen.getByText('Mensagem de teste')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(handleUploadError).toHaveBeenCalledTimes(1)
  })
})
