import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignatureConfirmedStep } from '../index'
import { useSignatureConfirmedStep } from '../use-signature-confirmed-step'

vi.mock('../use-signature-confirmed-step', () => ({ useSignatureConfirmedStep: vi.fn() }))

describe('SignatureConfirmedStep', () => {
  afterEach(cleanup)

  it('renders the immutable confirmation protocol', () => {
    vi.mocked(useSignatureConfirmedStep).mockReturnValue({ handleClose: vi.fn() })
    render(
      <SignatureConfirmedStep
        result={{ status: 'confirmed', hmsReference: 'HMS-123', protocol: 'PROTO-1' }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/PROTO-1/)).toBeTruthy()
  })
})
