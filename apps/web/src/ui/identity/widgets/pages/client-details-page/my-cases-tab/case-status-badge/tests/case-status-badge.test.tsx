import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { CaseStatusBadge } from '../index'

describe('CaseStatusBadge', () => {
  it('renders nothing when the status is missing', () => {
    const { container } = render(<CaseStatusBadge />)

    expect(container.firstChild).toBeNull()
  })

  it('renders the user-facing label for each supported status', () => {
    const labels = [
      [IntakeStatus.Registered, 'Em análise de documentos'],
      [IntakeStatus.ConsultationScheduled, 'Consulta Agendada'],
      [IntakeStatus.ConsultationCompleted, 'Consulta Realizada'],
      [IntakeStatus.ViabilityRegistered, 'Em análise de viabilidade'],
      [IntakeStatus.InFormalization, 'Em formalização'],
      [IntakeStatus.Contracted, 'Contratado'],
      [IntakeStatus.ClosedWithoutContract, 'Encerrado'],
    ] as const

    for (const [status, label] of labels) {
      const { unmount } = render(<CaseStatusBadge status={status} />)
      expect(screen.getByText(label)).toBeTruthy()
      unmount()
    }
  })
})
