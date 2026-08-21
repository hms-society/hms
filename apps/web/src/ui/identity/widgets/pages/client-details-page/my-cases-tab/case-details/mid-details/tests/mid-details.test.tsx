import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MidDetails } from '../index'
import { useCaseDetails } from '../../use-case-details'

vi.mock('../../use-case-details', () => ({
  useCaseDetails: vi.fn(),
}))

const useCaseDetailsMock = vi.mocked(useCaseDetails)

describe('MidDetails', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the loading state', () => {
    useCaseDetailsMock.mockReturnValue({ isLoading: true, error: null } as never)

    render(<MidDetails />)

    expect(screen.queryByText('Jornada do Caso')).toBeNull()
  })

  it('renders the journey and pending document guidance', () => {
    useCaseDetailsMock.mockReturnValue({
      isLoading: false,
      error: null,
      activeStep: 2,
      steps: [
        { label: 'Registro', description: 'Dados cadastrados' },
        { label: 'Consulta', description: 'Consulta realizada' },
        { label: 'Viabilidade', description: 'Análise técnica' },
      ],
      pendingDocuments: [{ name: 'Documento pendente' }],
    } as never)

    render(<MidDetails />)

    expect(screen.getByText('Jornada do Caso')).toBeTruthy()
    expect(screen.getByText('Viabilidade')).toBeTruthy()
    expect(screen.getByText(/Você possui 1 documento\(s\) pendente\(s\)/)).toBeTruthy()
    expect(screen.getByText(/Estamos analisando a viabilidade técnica/)).toBeTruthy()
  })
})
