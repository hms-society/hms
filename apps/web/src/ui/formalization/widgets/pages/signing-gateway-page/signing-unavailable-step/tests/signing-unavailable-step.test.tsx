import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SigningUnavailableStep } from '../index'
import { useSigningUnavailableStep } from '../use-signing-unavailable-step'

vi.mock('../use-signing-unavailable-step', () => ({ useSigningUnavailableStep: vi.fn() }))

describe('SigningUnavailableStep', () => {
  afterEach(cleanup)

  it('fails closed and offers retry only when supplied', () => {
    const handleRetry = vi.fn()
    vi.mocked(useSigningUnavailableStep).mockReturnValue({ handleRetry })
    render(<SigningUnavailableStep reason='provider_unavailable' onRetry={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledOnce()
  })
})
