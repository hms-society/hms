import type { DynamicFormSelectionFieldConfigurationProps } from './types'
import { useDynamicFormSelectionFieldConfiguration } from './use-dynamic-form-selection-field-configuration'
import { DynamicFormOptionsEditor } from './dynamic-form-options-editor'
export function DynamicFormSelectionFieldConfiguration(
  props: DynamicFormSelectionFieldConfigurationProps,
) {
  const value = useDynamicFormSelectionFieldConfiguration(props)
  return (
    <div className='space-y-3'>
      <p className='sr-only'>
        {value.mode === 'single_selection'
          ? 'Escolha uma opção'
          : 'Escolha uma ou mais opções'}
      </p>
      <DynamicFormOptionsEditor
        mode={value.mode}
        options={value.options}
        defaultOptionClientIds={value.defaultOptionClientIds}
        isDisabled={value.isDisabled}
        errors={value.optionErrors}
        onChange={value.onChange}
      />
      {value.defaultValueError && (
        <p
          id={`${props.fieldClientId}-selection-default-error`}
          className='text-xs text-destructive'
        >
          {value.defaultValueError}
        </p>
      )}
    </div>
  )
}
