import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContractedOutcomeSection } from '..'

vi.mock('../formalization-completion-card', () => ({
  FormalizationCompletionCard: () => <article>formalization completion card</article>,
}))
vi.mock('../case-summary-card', () => ({
  CaseSummaryCard: () => <article>case summary card</article>,
}))

const props = {
  intake: {
    id: 'intake-1',
    sequenceNumber: 12,
    clientId: 'client-1',
    responsibleId: 'responsible-1',
    createdBy: 'creator-1',
    updatedBy: 'updater-1',
    origin: 'direct',
    contactChannel: 'email',
    urgency: 'normal',
    status: 'contracted',
    version: 1,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-02'),
  },
  formalization: {
    formalizationId: 'formalization-1',
    intakeId: 'intake-1',
    status: 'completed',
    completedAt: new Date('2026-08-03'),
    signatureRequestId: 'request-1',
    signatureStatus: 'confirmed',
  },
  legalCase: {
    caseId: 'case-1',
    intakeId: 'intake-1',
    publicCode: 'CAS-0001',
    status: 'documentation',
    legalAreaId: 'area-1',
    openedAt: new Date('2026-08-04'),
  },
  legalAreaName: 'Cível',
  primaryLawyerName: 'Advogado',
  isFormalizationUnavailable: false,
  isCaseUnavailable: false,
  onRetryFormalization: vi.fn(),
  onRetryCase: vi.fn(),
} as const

describe('ContractedOutcomeSection', () => {
  afterEach(cleanup)

  it('keeps the terminal outcome and both child cards visible in contract order', () => {
    render(<ContractedOutcomeSection {...props} />)

    expect(
      screen.getByRole('heading', { name: 'Resultado da contratação' }),
    ).not.toBeNull()
    expect(
      screen.getByText('Este Intake está em estado terminal: contratado.'),
    ).not.toBeNull()
    expect(screen.getAllByRole('article').map((item) => item.textContent)).toEqual([
      'formalization completion card',
      'case summary card',
    ])
  })
})
