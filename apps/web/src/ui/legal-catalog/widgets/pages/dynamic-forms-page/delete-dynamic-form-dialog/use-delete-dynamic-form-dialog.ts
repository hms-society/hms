import type { DeleteDynamicFormDialogProps } from './types'

export function useDeleteDynamicFormDialog(props: DeleteDynamicFormDialogProps) {
  function handleOpenChange(open: boolean) {
    if (!open && !props.isMutationPending) props.onOpenChange(false)
  }

  async function handleConfirm() {
    await props.onConfirm()
  }

  function handleRetryImpact() {
    return props.onRetryImpact()
  }

  function formatImpact() {
    if (props.isImpactPending) return 'Os impactos estão sendo calculados…'
    if (props.isImpactError) return 'Não foi possível calcular os impactos.'
    if (!props.impact) return 'Os impactos estão sendo calculados…'
    return (
      'Consultas: ' +
      props.impact.consultation.total +
      ' (' +
      props.impact.consultation.inProgress +
      ' em andamento); Formalizações: ' +
      props.impact.formalization.total +
      ' (' +
      props.impact.formalization.inProgress +
      ' em andamento).'
    )
  }

  return {
    handleOpenChange,
    handleRetryImpact,
    handleConfirm,
    formatImpact,
    isDisabled:
      props.isImpactPending ||
      props.isImpactError ||
      props.isMutationPending ||
      !props.impact,
  }
}
