import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { CaseCard } from '../index'

const navigateToMock = vi.fn()

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

const intake = {
  id: 'intake-1',
  sequenceNumber: 42,
  clientId: 'client-1',
  responsibleId: 'collaborator-1',
  createdBy: 'collaborator-1',
  updatedBy: 'collaborator-1',
  origin: 'direct' as const,
  contactChannel: 'whatsapp' as const,
  legalAreaId: 'direito-civel',
  legalTopicId: 'topic-1',
  urgency: 'normal' as const,
  demandNotes: 'Notas do caso.',
  status: IntakeStatus.Registered,
  version: 1,
  createdAt: new Date('2026-07-28T14:32:00.000Z'),
  updatedAt: new Date('2026-07-29T15:30:00.000Z'),
}

describe('CaseCard', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders case information and its pending state', () => {
    render(<CaseCard intake={intake} />)

    expect(screen.getByText('Caso #42')).toBeTruthy()
    expect(screen.getByText('Ação Ordinária')).toBeTruthy()
    expect(screen.getByText(/Notas do caso\./)).toBeTruthy()
    expect(screen.getByText('Envio de Docs Pendente')).toBeTruthy()
    expect(screen.getByText('Em análise de documentos')).toBeTruthy()
  })

  it('navigates to the case details page from the footer action', () => {
    render(<CaseCard intake={{ ...intake, status: IntakeStatus.Contracted }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir caso' }))

    expect(navigateToMock).toHaveBeenCalledWith('clientMyCaseDetails', {
      params: { caseId: 'intake-1' },
    })
  })
})
