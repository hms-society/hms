import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { CaseSection } from '../index'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: vi.fn() }),
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
  status: IntakeStatus.Contracted,
  version: 1,
  createdAt: new Date('2026-07-28T14:32:00.000Z'),
  updatedAt: new Date('2026-07-29T15:30:00.000Z'),
}

describe('CaseSection', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders loading skeletons while cases are loading', () => {
    render(<CaseSection isLoading error={null} clientIntakes={[]} />)

    expect(screen.queryByText('Nenhum caso encontrado')).toBeNull()
  })

  it('renders the error state when cases cannot be loaded', () => {
    render(
      <CaseSection isLoading={false} error={new Error('failure')} clientIntakes={[]} />,
    )

    expect(screen.getByText(/Não foi possível carregar seus casos/)).toBeTruthy()
  })

  it('renders the empty state when the client has no cases', () => {
    render(<CaseSection isLoading={false} error={null} clientIntakes={[]} />)

    expect(screen.getByText('Nenhum caso encontrado')).toBeTruthy()
  })

  it('renders one card for each client case', () => {
    render(<CaseSection isLoading={false} error={null} clientIntakes={[intake]} />)

    expect(screen.getByText('Caso #42')).toBeTruthy()
    expect(screen.getByText('Contratado')).toBeTruthy()
  })
})
