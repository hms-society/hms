import { Input } from '@/ui/shadcn/input'
import type { DynamicFormNumericFieldConfigurationProps } from './types'
import { useDynamicFormNumericFieldConfiguration } from './use-dynamic-form-numeric-field-configuration'
export function DynamicFormNumericFieldConfiguration(
  props: DynamicFormNumericFieldConfigurationProps,
) {
  const value = useDynamicFormNumericFieldConfiguration(props)
  const setRule = (key: 'min' | 'scale', raw: string) =>
    props.onValidationChange({
      ...(props.validation ?? {}),
      [key]: raw === '' ? undefined : Number(raw),
    })
  return (
    <div className='space-y-4'>
      <label
        htmlFor={`${props.fieldClientId}-numeric-placeholder`}
        className='block space-y-1 text-xs font-medium'
      >
        Placeholder (opcional)
        <Input
          id={`${props.fieldClientId}-numeric-placeholder`}
          value={props.placeholder ?? ''}
          disabled={props.isDisabled}
          aria-label='Placeholder'
          aria-invalid={Boolean(props.errors.placeholder)}
          aria-describedby={
            props.errors.placeholder
              ? `${props.fieldClientId}-numeric-placeholder-error`
              : undefined
          }
          onChange={(event) =>
            props.onPlaceholderChange?.(event.target.value || undefined)
          }
        />
        {props.errors.placeholder && (
          <span
            id={`${props.fieldClientId}-numeric-placeholder-error`}
            className='block text-xs text-destructive'
          >
            {props.errors.placeholder}
          </span>
        )}
      </label>
      <div className='grid grid-cols-2 gap-3'>
        <label
          htmlFor={`${props.fieldClientId}-numeric-default`}
          className='space-y-1 text-xs font-medium'
        >
          Resposta padrão (opcional)
          <Input
            type='number'
            value={props.defaultValue ?? ''}
            disabled={props.isDisabled}
            id={`${props.fieldClientId}-numeric-default`}
            aria-label='Valor padrão'
            aria-invalid={Boolean(props.errors.defaultValue)}
            aria-describedby={
              props.errors.defaultValue
                ? `${props.fieldClientId}-numeric-default-error`
                : undefined
            }
            onChange={(event) =>
              props.onDefaultValueChange(
                event.target.value === '' ? undefined : Number(event.target.value),
              )
            }
          />
        </label>
        {value.showMinimum && (
          <label
            htmlFor={`${props.fieldClientId}-numeric-min`}
            className='space-y-1 text-xs font-medium'
          >
            Valor mínimo (opcional)
            <Input
              type='number'
              value={props.validation?.min ?? ''}
              disabled={props.isDisabled}
              id={`${props.fieldClientId}-numeric-min`}
              aria-label='Valor mínimo'
              aria-invalid={Boolean(props.errors.min)}
              aria-describedby={
                props.errors.min ? `${props.fieldClientId}-numeric-min-error` : undefined
              }
              onChange={(event) => setRule('min', event.target.value)}
            />
          </label>
        )}
      </div>
      {value.currencyLabel && (
        <label
          htmlFor={`${props.fieldClientId}-currency`}
          className='block space-y-1 text-xs font-medium'
        >
          Moeda *
          <Input
            id={`${props.fieldClientId}-currency`}
            value='Real brasileiro (BRL)'
            readOnly
            aria-label='Moeda'
          />
        </label>
      )}
      {props.type === 'percentage' && (
        <label
          htmlFor={`${props.fieldClientId}-numeric-scale`}
          className='space-y-1 text-xs font-medium'
        >
          Casas decimais
          <Input
            type='number'
            min={0}
            max={4}
            value={props.validation?.scale ?? 2}
            disabled={props.isDisabled}
            id={`${props.fieldClientId}-numeric-scale`}
            aria-label='Casas decimais'
            aria-invalid={Boolean(props.errors.scale)}
            aria-describedby={
              props.errors.scale
                ? `${props.fieldClientId}-numeric-scale-error`
                : undefined
            }
            onChange={(event) => setRule('scale', event.target.value)}
          />
        </label>
      )}
      {props.errors.defaultValue && (
        <p
          id={`${props.fieldClientId}-numeric-default-error`}
          className='text-xs text-destructive'
        >
          {props.errors.defaultValue}
        </p>
      )}
      {props.errors.validation && (
        <p className='text-xs text-destructive'>{props.errors.validation}</p>
      )}
    </div>
  )
}
