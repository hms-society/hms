import { Input } from '@/ui/shadcn/input'
import type { DynamicFormDateFieldConfigurationProps } from './types'
import { useDynamicFormDateFieldConfiguration } from './use-dynamic-form-date-field-configuration'
export function DynamicFormDateFieldConfiguration(
  props: DynamicFormDateFieldConfigurationProps,
) {
  const value = useDynamicFormDateFieldConfiguration(props)
  return (
    <label
      className='block space-y-1 text-xs font-medium'
      htmlFor={`${props.fieldClientId}-default`}
    >
      Resposta padrão (opcional)
      <Input
        id={`${props.fieldClientId}-default`}
        type='date'
        value={value.defaultValue ?? ''}
        disabled={value.isDisabled}
        aria-invalid={Boolean(value.defaultValueError)}
        aria-describedby={
          value.defaultValueError
            ? `${props.fieldClientId}-date-default-error`
            : undefined
        }
        onChange={(event) => value.onDefaultValueChange(event.target.value || undefined)}
      />
      {value.defaultValueError && (
        <span
          id={`${props.fieldClientId}-date-default-error`}
          className='block text-xs text-destructive'
        >
          {value.defaultValueError}
        </span>
      )}
    </label>
  )
}
