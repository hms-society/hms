import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OtpVerificationStep } from '../index'
import { useOtpVerificationStep } from '../use-otp-verification-step'

vi.mock('../use-otp-verification-step', () => ({ useOtpVerificationStep: vi.fn() }))

describe('OtpVerificationStep', () => {
  afterEach(cleanup)

  it('renders the verification error with a single accessible input', () => {
    vi.mocked(useOtpVerificationStep).mockReturnValue({
      handleCodeChange: vi.fn(),
      handleResend: vi.fn(),
      handleVerify: vi.fn(),
      isPending: false,
    })
    render(
      <OtpVerificationStep
        code='123'
        expiresAt='2026-09-02T12:00:00Z'
        resendAvailableAt='2020-01-01T00:00:00Z'
        error='invalid'
        isPending={false}
        onCodeChange={vi.fn()}
        onVerify={vi.fn()}
        onResend={vi.fn()}
      />,
    )
    expect(
      screen
        .getByRole('textbox', { name: 'Código de seis dígitos' })
        .getAttribute('autocomplete'),
    ).toBe('one-time-code')
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
