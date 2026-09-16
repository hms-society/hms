import type { DynamicFormDeleteDialogProps } from '../types'
export function useDynamicFormDeleteDialog(props: DynamicFormDeleteDialogProps) {
  return {
    ...props,
    isDisabled: !props.form || Boolean(props.isDeleting),
  }
}
