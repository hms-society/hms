import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'

export type AvailabilityDynamicFormDialogProps = {
  form: DynamicFormListItem | null
  open: boolean
  isMutationPending: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
