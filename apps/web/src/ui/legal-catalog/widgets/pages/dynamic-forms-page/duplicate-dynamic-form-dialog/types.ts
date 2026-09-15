import type {
  DynamicFormListItem,
  FindDynamicFormNameConflictResult,
} from '@hms/core/legal-catalog/domain/structures'
import type { DuplicateDynamicFormInput } from '@hms/validation/legal-catalog'

export type DuplicateDynamicFormDialogProps = {
  form: DynamicFormListItem | null
  open: boolean
  isPending: boolean
  conflict: FindDynamicFormNameConflictResult | null
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (input: DuplicateDynamicFormInput) => Promise<void>
  onOpenExisting: (dynamicFormId: string) => void
}
