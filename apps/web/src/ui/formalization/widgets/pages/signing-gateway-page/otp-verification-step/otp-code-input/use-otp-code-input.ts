export type OtpCodeInputProps = {
  value: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  onChange: (value: string) => void
}

export function useOtpCodeInput(props: OtpCodeInputProps) {
  function handleChange(value: string) {
    props.onChange(value.replace(/\D/g, '').slice(0, 6))
  }
  return { handleChange }
}
