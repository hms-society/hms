import type { ChangeEvent } from 'react'
export type OtpCodeInputProps = {
  value: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  onChange: (value: string) => void
}

export function useOtpCodeInput(props: OtpCodeInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    props.onChange(event.target.value.replace(/\D/g, '').slice(0, 6))
  }
  return { handleChange }
}
