import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MutationFeedback } from '..'

afterEach(cleanup)

describe('MutationFeedback', () => {
  it('shows an optional reason and reports edits', () => {
    const onReasonChange = vi.fn()
    render(
      <MutationFeedback
        showReason
        isReasonRequired={false}
        reason='contexto'
        error={null}
        hasVersionConflict={false}
        isLastManagerRemoval={false}
        onReasonChange={onReasonChange}
      />,
    )

    const reason = screen.getByRole('textbox', { name: 'Justificativa administrativa' })
    expect(reason.getAttribute('aria-required')).toBe('false')
    expect(screen.getByText(/Opcional/)).toBeTruthy()
    fireEvent.change(reason, { target: { value: 'novo contexto' } })
    expect(onReasonChange).toHaveBeenCalledWith('novo contexto')
  })

  it('shows required validation, last-manager guard, conflict and mutation error', () => {
    render(
      <MutationFeedback
        showReason
        isReasonRequired
        reason='  '
        error='Falha ao salvar.'
        hasVersionConflict
        isLastManagerRemoval
        onReasonChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText(/Obrigatória/)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Confirme novamente')
    expect(screen.getAllByRole('alert')).toHaveLength(2)
  })

  it('omits the reason editor when the mutation does not require it', () => {
    render(
      <MutationFeedback
        showReason={false}
        isReasonRequired={false}
        reason=''
        error={null}
        hasVersionConflict={false}
        isLastManagerRemoval={false}
        onReasonChange={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText('Justificativa administrativa')).toBeNull()
  })
})
