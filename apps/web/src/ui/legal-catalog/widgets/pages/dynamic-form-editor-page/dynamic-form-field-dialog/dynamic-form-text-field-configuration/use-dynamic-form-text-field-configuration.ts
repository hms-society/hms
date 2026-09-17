import type { DynamicFormTextFieldConfigurationProps } from './types'
export function useDynamicFormTextFieldConfiguration(
  props: DynamicFormTextFieldConfigurationProps,
) {
  return { ...props, isLongText: props.type === 'long_text' }
}
