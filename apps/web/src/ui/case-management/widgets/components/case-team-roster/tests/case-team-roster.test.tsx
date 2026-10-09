import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseTeamRoster } from '..'
import { useCaseTeamRoster } from '../use-case-team-roster'

vi.mock('../use-case-team-roster', () => ({ useCaseTeamRoster: vi.fn() }))

const useCaseTeamRosterMock = vi.mocked(useCaseTeamRoster)

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  useCaseTeamRosterMock.mockReturnValue({
    caseTeam: { caseId: 'case-1', members: [], total: 1 },
    error: null,
    handleRetry: vi.fn(),
    isLoading: false,
    members: [
      {
        membershipId: 'membership-1',
        collaboratorId: 'collaborator-1',
        professionalName: 'Beatriz Oliveira',
        email: 'beatriz@example.test',
        profile: 'lawyer',
        role: 'manager',
        assignedAt: new Date('2026-01-01T00:00:00.000Z'),
        isEligible: true,
      },
    ],
    total: 1,
  } as never)
})

describe('CaseTeamRoster', () => {
  it('shows active members, their role, and the read-only membership status', () => {
    render(<CaseTeamRoster caseId='case-1' />)

    expect(screen.getByRole('heading', { name: 'Equipe do caso' })).toBeDefined()
    expect(screen.getByText('1 integrante ativo')).toBeDefined()
    expect(screen.getByText('Beatriz Oliveira')).toBeDefined()
    expect(screen.getByText('beatriz@example.test')).toBeDefined()
    expect(screen.getByText('Gestor')).toBeDefined()
    expect(screen.getByText('Ativo')).toBeDefined()
    expect(
      screen.queryByRole('button', { name: /adicionar|remover|alterar/i }),
    ).toBeNull()
  })
})
