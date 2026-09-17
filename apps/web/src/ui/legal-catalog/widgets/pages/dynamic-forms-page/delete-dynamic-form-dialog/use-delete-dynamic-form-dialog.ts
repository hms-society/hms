import type { DeleteDynamicFormDialogProps } from './types'

export function useDeleteDynamicFormDialog(props: DeleteDynamicFormDialogProps) {
  function handleOpenChange(open: boolean) {
    if (!open && !props.isMutationPending) props.onOpenChange(false)
  }

  async function handleConfirm() {
    await props.onConfirm()
  }

  return {
    handleOpenChange,
    handleConfirm,
    isDisabled: props.isMutationPending || !props.form,
  }
}
