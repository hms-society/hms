import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OtpVerificationStep } from '../index'
import { useOtpVerificationStep } from '../use-otp-verification-step'

vi.mock('../use-otp-verification-step', () => ({ useOtpVerificationStep: vi.fn() }))

describe('OtpVerificationStep', () => {
  afterEach(cleanup)

  it('renders the verification error with a single accessible input', () => {
    vi.mocked(useOtpVerificationStep).mockReturnValue({
      canResend: false,
      canVerify: false,
      handleCodeChange: vi.fn(),
      handleResend: vi.fn(),
      handleVerify: vi.fn(),
      isExpired: false,
      isPending: false,
      remainingSeconds: 30,
      remainingTimeLabel: '00:30',
      resendTimeLabel: '00:30',
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
    const codeInput = screen.getByRole('textbox', { name: 'Código de seis dígitos' })
    expect(codeInput.getAttribute('autocomplete')).toBe('one-time-code')
    expect(codeInput.hasAttribute('disabled')).toBe(false)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Expira em 00:30')
    expect(
      screen.getByRole('button', { name: 'Reenviar' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('renders the expired state and allows resending when the hook enables it', () => {
    const handleResend = vi.fn()
    vi.mocked(useOtpVerificationStep).mockReturnValue({
      canResend: true,
      canVerify: false,
      handleCodeChange: vi.fn(),
      handleResend,
      handleVerify: vi.fn(),
      isExpired: true,
      isPending: false,
      remainingSeconds: 0,
      remainingTimeLabel: '00:00',
      resendTimeLabel: '00:00',
    })

    render(
      <OtpVerificationStep
        code='123456'
        expiresAt='2026-09-02T12:00:00Z'
        resendAvailableAt='2020-01-01T00:00:00Z'
        isPending={false}
        onCodeChange={vi.fn()}
        onVerify={vi.fn()}
        onResend={vi.fn()}
      />,
    )

    expect(screen.getByRole('status').textContent).toContain('Código expirado')
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar' }))
    expect(handleResend).toHaveBeenCalledOnce()
  })

  it('disables the code input and actions while a request is pending', () => {
    vi.mocked(useOtpVerificationStep).mockReturnValue({
      canResend: false,
      canVerify: false,
      handleCodeChange: vi.fn(),
      handleResend: vi.fn(),
      handleVerify: vi.fn(),
      isExpired: false,
      isPending: true,
      remainingSeconds: 30,
      remainingTimeLabel: '00:30',
      resendTimeLabel: '00:30',
    })

    render(
      <OtpVerificationStep
        code='123456'
        expiresAt='2026-09-02T12:00:00Z'
        resendAvailableAt='2026-09-02T12:00:00Z'
        isPending
        onCodeChange={vi.fn()}
        onVerify={vi.fn()}
        onResend={vi.fn()}
      />,
    )

    expect(
      screen
        .getByRole('textbox', { name: 'Código de seis dígitos' })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Confirmar código' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Reenviar' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
