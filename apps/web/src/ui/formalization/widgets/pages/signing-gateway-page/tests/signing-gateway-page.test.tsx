import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SigningGatewayPage } from '../index'
import { useSigningGatewayPage } from '../use-signing-gateway-page'

vi.mock('../use-signing-gateway-page', () => ({ useSigningGatewayPage: vi.fn() }))

describe('SigningGatewayPage', () => {
  afterEach(cleanup)

  it('dispatches the discriminated state to the matching leaf widget', () => {
    vi.mocked(useSigningGatewayPage).mockReturnValue({
      step: 'invitation',
      props: { isPending: false, onContinue: vi.fn() },
    })

    render(<SigningGatewayPage />)

    expect(
      screen.getByRole('heading', { name: 'Documento para assinatura' }),
    ).toBeTruthy()
  })
})
