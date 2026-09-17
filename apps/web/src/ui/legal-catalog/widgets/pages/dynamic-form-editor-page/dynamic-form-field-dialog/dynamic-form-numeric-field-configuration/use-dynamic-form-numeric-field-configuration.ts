import type { DynamicFormNumericFieldConfigurationProps } from './types'
export function useDynamicFormNumericFieldConfiguration(
  props: DynamicFormNumericFieldConfigurationProps,
) {
  return {
    ...props,
    currencyLabel: props.type === 'currency' ? 'BRL' : undefined,
    showMinimum: props.type === 'integer',
  }
}
