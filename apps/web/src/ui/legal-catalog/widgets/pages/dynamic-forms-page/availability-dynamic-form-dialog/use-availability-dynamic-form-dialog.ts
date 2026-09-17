import type { AvailabilityDynamicFormDialogProps } from './types'

export function useAvailabilityDynamicFormDialog(
  props: AvailabilityDynamicFormDialogProps,
) {
  function handleOpenChange(open: boolean) {
    if (!open && !props.isMutationPending) props.onOpenChange(false)
  }

  async function handleConfirm() {
    await props.onConfirm()
  }

  return {
    handleOpenChange,
    handleConfirm,
    isDisabled: props.isMutationPending,
  }
}
