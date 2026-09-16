import type { DynamicFormStaleVersionDialogProps } from '../types'
export function useDynamicFormStaleVersionDialog(
  props: DynamicFormStaleVersionDialogProps,
) {
  return { ...props, canReload: !props.isReloading }
}
