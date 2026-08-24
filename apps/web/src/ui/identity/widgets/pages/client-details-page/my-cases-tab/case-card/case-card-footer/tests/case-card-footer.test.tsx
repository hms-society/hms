import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { CaseCardFooter } from '../index'

describe('CaseCardFooter', () => {
  it('renders the status and delegates case navigation', () => {
    const onNavigate = vi.fn()

    render(<CaseCardFooter status={IntakeStatus.Contracted} onNavigate={onNavigate} />)

    expect(screen.getByText('Contratado')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir caso' }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
