import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { TopDetails } from '../index'
import { useCaseDetails } from '../../use-case-details'

vi.mock('../../use-case-details', () => ({
  useCaseDetails: vi.fn(),
}))

const useCaseDetailsMock = vi.mocked(useCaseDetails)

const caseDetails = {
  id: 'intake-1',
  sequenceNumber: 42,
  legalAreaId: 'direito-civel',
  status: IntakeStatus.Contracted,
  updatedAt: new Date('2026-07-29T15:30:00.000Z'),
}

describe('TopDetails', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders loading skeletons', () => {
    useCaseDetailsMock.mockReturnValue({
      isLoading: true,
      caseDetails: undefined,
      error: null,
    } as never)

    render(<TopDetails />)

    expect(screen.queryByText('Caso #42')).toBeNull()
  })

  it('renders the case title, identifier, status, and update date', () => {
    useCaseDetailsMock.mockReturnValue({
      isLoading: false,
      caseDetails,
      error: null,
    } as never)

    render(<TopDetails />)

    expect(screen.getByRole('heading', { name: 'Ação Ordinária' })).toBeTruthy()
    expect(screen.getByText('Caso #42 • ID: intake-1')).toBeTruthy()
    expect(screen.getByText('Contratado')).toBeTruthy()
    expect(screen.getByText(/Última atualização:/)).toBeTruthy()
  })
})
