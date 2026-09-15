import type {
  DynamicFormListItem,
  DynamicFormUsageImpact,
} from '@hms/core/legal-catalog/domain/structures'

export type AvailabilityDynamicFormDialogProps = {
  form: DynamicFormListItem | null
  open: boolean
  impact: DynamicFormUsageImpact | null
  isImpactPending: boolean
  isImpactError: boolean
  isMutationPending: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onRetryImpact: () => undefined | Promise<unknown>
  onConfirm: () => Promise<void>
}
