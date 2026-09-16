import type { DynamicFormFieldRemovalDialogProps } from '../types'
import { useDynamicFormFieldUsageImpactQuery } from '@/ui/legal-catalog/hooks'

export function useDynamicFormFieldRemovalDialog(
  props: DynamicFormFieldRemovalDialogProps,
) {
  const usageQuery = useDynamicFormFieldUsageImpactQuery(
    props.dynamicFormId,
    props.field?.fieldId,
    props.open,
  )

  return {
    ...props,
    canConfirm: Boolean(props.field),
    usageQuery,
  }
}
