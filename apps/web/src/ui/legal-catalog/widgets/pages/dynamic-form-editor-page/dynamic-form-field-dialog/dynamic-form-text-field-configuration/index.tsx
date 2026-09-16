import { Input } from '@/ui/shadcn/input'
import { Textarea } from '@/ui/shadcn/textarea'
import type { DynamicFormTextFieldConfigurationProps } from './types'
import { useDynamicFormTextFieldConfiguration } from './use-dynamic-form-text-field-configuration'

export function DynamicFormTextFieldConfiguration(
  props: DynamicFormTextFieldConfigurationProps,
) {
  const controller = useDynamicFormTextFieldConfiguration(props)
  return (
    <div className='space-y-4'>
      <label
        className='block space-y-1 text-xs font-medium'
        htmlFor={`${props.fieldClientId}-placeholder`}
      >
        Placeholder (opcional)
        <Input
          id={`${props.fieldClientId}-placeholder`}
          aria-label='Placeholder'
          value={controller.placeholder ?? ''}
          disabled={props.isDisabled}
          aria-invalid={Boolean(props.placeholderError)}
          aria-describedby={
            props.placeholderError
              ? `${props.fieldClientId}-placeholder-error`
              : undefined
          }
          onChange={(event) => props.onPlaceholderChange(event.target.value || undefined)}
        />
      </label>
      {props.placeholderError && (
        <p
          id={`${props.fieldClientId}-placeholder-error`}
          className='text-xs text-destructive'
        >
          {props.placeholderError}
        </p>
      )}
      <label
        className='block space-y-1 text-xs font-medium'
        htmlFor={`${props.fieldClientId}-default`}
      >
        Resposta padrão (opcional)
        {controller.isLongText ? (
          <Textarea
            id={`${props.fieldClientId}-default`}
            value={controller.defaultValue ?? ''}
            disabled={props.isDisabled}
            aria-invalid={Boolean(props.defaultValueError)}
            aria-describedby={
              props.defaultValueError ? `${props.fieldClientId}-default-error` : undefined
            }
            onChange={(event) =>
              props.onDefaultValueChange(event.target.value || undefined)
            }
          />
        ) : (
          <Input
            id={`${props.fieldClientId}-default`}
            value={controller.defaultValue ?? ''}
            disabled={props.isDisabled}
            aria-invalid={Boolean(props.defaultValueError)}
            aria-describedby={
              props.defaultValueError ? `${props.fieldClientId}-default-error` : undefined
            }
            onChange={(event) =>
              props.onDefaultValueChange(event.target.value || undefined)
            }
          />
        )}
      </label>
      {props.defaultValueError && (
        <p
          id={`${props.fieldClientId}-default-error`}
          className='text-xs text-destructive'
        >
          {props.defaultValueError}
        </p>
      )}
    </div>
  )
}
