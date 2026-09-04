import { act, renderHook } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useOtpCodeInput } from '../use-otp-code-input'

describe('useOtpCodeInput', () => {
  it('sanitizes pasted input to the six-digit OTP contract', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useOtpCodeInput({ value: '', onChange }))
    const event = { target: { value: '12a345678' } } as ChangeEvent<HTMLInputElement>

    act(() => result.current.handleChange(event))

    expect(onChange).toHaveBeenCalledWith('123456')
  })

  it('allows clearing the code', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useOtpCodeInput({ value: '123456', onChange }))

    act(() =>
      result.current.handleChange({
        target: { value: '' },
      } as ChangeEvent<HTMLInputElement>),
    )

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('rejects a non-numeric paste without emitting letters', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useOtpCodeInput({ value: '', onChange }))

    act(() =>
      result.current.handleChange({
        target: { value: 'abc-def' },
      } as ChangeEvent<HTMLInputElement>),
    )

    expect(onChange).toHaveBeenCalledWith('')
  })
})
