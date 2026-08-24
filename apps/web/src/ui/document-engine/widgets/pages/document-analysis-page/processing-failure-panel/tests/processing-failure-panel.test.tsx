import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProcessingFailurePanel } from '..'

describe('ProcessingFailurePanel', () => {
  it('renders the failure guidance and delegates the resend action', () => {
    const onRequestResend = vi.fn()

    render(
      <ProcessingFailurePanel
        failureReason='Arquivo protegido por senha'
        failureInstruction='Envie uma cópia sem proteção.'
        onRequestResend={onRequestResend}
      />,
    )

    expect(screen.getByText('Arquivo protegido por senha')).toBeDefined()
    expect(screen.getByText('Envie uma cópia sem proteção.')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar reenvio' }))

    expect(onRequestResend).toHaveBeenCalledOnce()
  })
})
