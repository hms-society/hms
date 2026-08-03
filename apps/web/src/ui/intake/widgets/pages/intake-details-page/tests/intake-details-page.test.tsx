import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ContactChannel,
  IntakeOrigin,
  IntakeStatus,
  IntakeUrgency,
} from '@hms/core/intake/domain/structures'

import { useIntakeDetailsPage } from '../use-intake-details-page'
import { IntakeDetailsPage } from '../index'

vi.mock('../use-intake-details-page', () => ({ useIntakeDetailsPage: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: PropsWithChildren<Record<string, unknown>>) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}))

const useIntakeDetailsPageMock = vi.mocked(useIntakeDetailsPage)
const intake = {
  id: 'intake-1',
  sequenceNumber: 42,
  clientId: 'client-1',
  responsibleId: 'responsible-1',
  createdBy: 'attendant-1',
  updatedBy: 'attendant-1',
  origin: IntakeOrigin.Direct,
  contactChannel: ContactChannel.Whatsapp,
  legalAreaId: 'area-1',
  legalTopicId: 'topic-1',
  urgency: IntakeUrgency.Normal,
  demandNotes: 'Verbas rescisórias',
  status: IntakeStatus.ConsultationScheduled,
  version: 1,
  createdAt: new Date('2026-07-30T12:00:00.000Z'),
  updatedAt: new Date('2026-07-30T12:00:00.000Z'),
}

describe('IntakeDetailsPage', () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it('renders loading and the authenticated intake details copy', () => {
    useIntakeDetailsPageMock.mockReturnValue({
      intake: null,
      intakeError: null,
      isLoadingIntake: true,
      refetch: vi.fn(),
    })
    const { rerender } = render(<IntakeDetailsPage intakeId='intake-1' />)
    expect(screen.getByRole('status', { name: /carregando detalhe/i })).toBeDefined()

    useIntakeDetailsPageMock.mockReturnValue({
      intake,
      intakeError: null,
      isLoadingIntake: false,
      refetch: vi.fn(),
    })
    rerender(<IntakeDetailsPage intakeId='intake-1' />)
    expect(screen.getByRole('heading', { name: 'Detalhe do intake' })).toBeDefined()
    expect(screen.getByText('intake-1')).toBeDefined()
    expect(screen.getByText('responsible-1')).toBeDefined()
    expect(screen.getByText('WhatsApp')).toBeDefined()
    expect(screen.getByText('Verbas rescisórias')).toBeDefined()
  })

  it('shows an error and retries through the visible keyboard-accessible button', () => {
    const refetch = vi.fn()
    useIntakeDetailsPageMock.mockReturnValue({
      intake: null,
      intakeError: new Error('forbidden'),
      isLoadingIntake: false,
      refetch,
    })
    render(<IntakeDetailsPage intakeId='intake-1' />)

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar o intake',
    )
    fireEvent.keyDown(screen.getByRole('button', { name: 'Tentar novamente' }), {
      key: 'Enter',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetch).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: /voltar para intakes/i })).toBeDefined()
  })
})
