import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CancelSignatureSendingDialog } from '..'

const baseProps = {
  open: true,
  formalizationVersion: 7,
  requestVersion: 9,
  isPending: false,
  error: null,
  onOpenChange: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue({}),
}

describe('CancelSignatureSendingDialog', () => {
  afterEach(cleanup)

  it('announces required reason validation and keeps the destructive action reachable', () => {
    render(<CancelSignatureSendingDialog {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    expect(screen.getByRole('alert').textContent).toContain('Informe o motivo')
    expect(
      screen.getByLabelText('Motivo do cancelamento').getAttribute('aria-invalid'),
    ).toBe('true')
  })

  it('trims the reason and disables duplicate cancellation while pending', () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(
      <CancelSignatureSendingDialog
        {...baseProps}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )
    fireEvent.change(screen.getByLabelText('Motivo do cancelamento'), {
      target: { value: '  Pedido do cliente  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))
    expect(onSubmit).toHaveBeenCalledWith({
      expectedFormalizationVersion: 7,
      expectedRequestVersion: 9,
      reason: 'Pedido do cliente',
    })

    cleanup()
    render(<CancelSignatureSendingDialog {...baseProps} isPending />)
    expect(
      (screen.getByRole('button', { name: 'Cancelando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
