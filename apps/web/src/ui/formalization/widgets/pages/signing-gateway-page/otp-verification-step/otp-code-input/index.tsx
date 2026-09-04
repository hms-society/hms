import { Input } from '@/ui/shadcn/input'
import { useOtpCodeInput } from './use-otp-code-input'

export type { OtpCodeInputProps } from './use-otp-code-input'
import type { OtpCodeInputProps } from './use-otp-code-input'

export const OtpCodeInput = (props: OtpCodeInputProps) => {
  const { handleChange } = useOtpCodeInput(props)
  return (
    <Input
      aria-describedby={props.describedBy ?? 'otp-help'}
      aria-invalid={props.invalid}
      autoComplete='one-time-code'
      disabled={props.disabled}
      inputMode='numeric'
      maxLength={6}
      value={props.value}
      onChange={handleChange}
      aria-label='Código de seis dígitos'
    />
  )
}
