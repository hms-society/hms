import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignatureSubmittedStep } from '../index'
import { useSignatureSubmittedStep } from '../use-signature-submitted-step'

vi.mock('../use-signature-submitted-step', () => ({ useSignatureSubmittedStep: vi.fn() }))

describe('SignatureSubmittedStep', () => {
  afterEach(cleanup)

  it('shows the server reference and refresh action', () => {
    vi.mocked(useSignatureSubmittedStep).mockReturnValue({
      handleClose: vi.fn(),
      handleRefresh: vi.fn(),
    })
    render(
      <SignatureSubmittedStep
        result={{ status: 'submitted', hmsReference: 'HMS-123' }}
        onRefresh={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/HMS-123/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Atualizar status' })).toBeTruthy()
  })
})
