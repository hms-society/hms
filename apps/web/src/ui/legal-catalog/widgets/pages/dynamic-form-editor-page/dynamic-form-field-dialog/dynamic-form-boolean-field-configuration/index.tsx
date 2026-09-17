import { Button } from '@/ui/shadcn/button'
import type { DynamicFormBooleanFieldConfigurationProps } from './types'
import { useDynamicFormBooleanFieldConfiguration } from './use-dynamic-form-boolean-field-configuration'
export function DynamicFormBooleanFieldConfiguration(
  props: DynamicFormBooleanFieldConfigurationProps,
) {
  const value = useDynamicFormBooleanFieldConfiguration(props)
  return (
    <fieldset
      disabled={value.isDisabled}
      className='space-y-2 rounded-lg border border-border bg-transparent p-3'
    >
      <legend className='px-1 text-xs font-medium'>Resposta padrão (opcional)</legend>
      <p className='text-xs text-muted-foreground'>
        Este valor será preenchido automaticamente no formulário.
      </p>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          size='xs'
          variant={value.defaultValue === true ? 'default' : 'outline'}
          className='rounded-full'
          aria-pressed={value.defaultValue === true}
          onClick={() => value.onDefaultValueChange(true)}
        >
          Sim
        </Button>
        <Button
          type='button'
          size='xs'
          variant={value.defaultValue === false ? 'default' : 'outline'}
          className='rounded-full'
          aria-pressed={value.defaultValue === false}
          onClick={() => value.onDefaultValueChange(false)}
        >
          Não
        </Button>
        <Button
          type='button'
          size='xs'
          variant='ghost'
          className='rounded-full'
          aria-pressed={value.defaultValue === undefined}
          onClick={() => value.onDefaultValueChange(undefined)}
        >
          Sem padrão
        </Button>
      </div>
      {value.defaultValueError && (
        <p
          id={`${props.fieldClientId}-boolean-default-error`}
          className='text-xs text-destructive'
        >
          {value.defaultValueError}
        </p>
      )}
    </fieldset>
  )
}
