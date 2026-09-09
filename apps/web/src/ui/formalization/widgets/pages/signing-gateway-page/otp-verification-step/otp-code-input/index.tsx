import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/ui/shadcn/input-otp'
import { useOtpCodeInput } from './use-otp-code-input'

const OTP_SLOT_IDS = ['one', 'two', 'three', 'four', 'five', 'six'] as const

export type { OtpCodeInputProps } from './use-otp-code-input'
import type { OtpCodeInputProps } from './use-otp-code-input'

export const OtpCodeInput = (props: OtpCodeInputProps) => {
  const { handleChange } = useOtpCodeInput(props)
  return (
    <InputOTP
      aria-describedby={props.describedBy ?? 'otp-help'}
      aria-invalid={props.invalid}
      autoComplete='one-time-code'
      disabled={props.disabled}
      inputMode='numeric'
      maxLength={6}
      value={props.value}
      onChange={handleChange}
      aria-label='Código de seis dígitos'
      containerClassName='w-full'
    >
      <InputOTPGroup className='w-full justify-between gap-2'>
        {OTP_SLOT_IDS.map((slotId, index) => (
          <InputOTPSlot
            key={slotId}
            className='size-12 flex-1 rounded-lg border text-xl font-mono sm:size-14'
            index={index}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
