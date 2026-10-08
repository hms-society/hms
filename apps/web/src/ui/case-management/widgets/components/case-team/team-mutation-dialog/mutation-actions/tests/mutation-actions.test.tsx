import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MutationActions } from '..'

afterEach(cleanup)

describe('MutationActions', () => {
  it('renders and invokes the enabled confirmation action', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(
      <MutationActions
        isPending={false}
        isRemove={false}
        isDisabled={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('shows pending removal state and disables both actions', () => {
    render(
      <MutationActions
        isPending
        isRemove
        isDisabled
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Cancelar' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Salvando…' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
