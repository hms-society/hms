import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OtpCodeInput } from '../index'
import { useOtpCodeInput } from '../use-otp-code-input'

vi.mock('../use-otp-code-input', () => ({ useOtpCodeInput: vi.fn() }))

describe('OtpCodeInput', () => {
  afterEach(cleanup)

  it('keeps the single input numeric and delegates sanitized changes', () => {
    const handleChange = vi.fn()
    vi.mocked(useOtpCodeInput).mockReturnValue({ handleChange })
    render(<OtpCodeInput value='' onChange={vi.fn()} />)
    const input = screen.getByRole('textbox', { name: 'Código de seis dígitos' })
    expect(input.getAttribute('inputmode')).toBe('numeric')
    expect(input.className).not.toContain('sr-only')
    expect(input.hasAttribute('disabled')).toBe(false)
    expect(input.hasAttribute('readonly')).toBe(false)
    expect(input.style.pointerEvents).toBe('all')
    fireEvent.change(input, { target: { value: '12ab34567' } })
    expect(handleChange).toHaveBeenCalledOnce()
  })
})
