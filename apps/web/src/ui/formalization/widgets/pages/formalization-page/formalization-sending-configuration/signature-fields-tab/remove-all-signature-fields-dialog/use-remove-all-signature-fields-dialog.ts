export type RemoveAllSignatureFieldsDialogProps = {
  open: boolean
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function useRemoveAllSignatureFieldsDialog({
  onOpenChange,
  onConfirm,
}: Pick<RemoveAllSignatureFieldsDialogProps, 'onOpenChange' | 'onConfirm'>) {
  function handleConfirm() {
    onConfirm()
    onOpenChange(false)
  }

  return { handleConfirm }
}
