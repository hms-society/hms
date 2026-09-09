import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvitationAccessStep } from '../index'
import { useInvitationAccessStep } from '../use-invitation-access-step'

vi.mock('../use-invitation-access-step', () => ({ useInvitationAccessStep: vi.fn() }))

describe('InvitationAccessStep', () => {
  afterEach(cleanup)

  it('delegates continuation to its presentation hook', () => {
    const handleContinue = vi.fn()
    vi.mocked(useInvitationAccessStep).mockReturnValue({
      handleContinue,
      isPending: false,
    })
    render(<InvitationAccessStep isPending={false} onContinue={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(handleContinue).toHaveBeenCalledOnce()
  })
})
