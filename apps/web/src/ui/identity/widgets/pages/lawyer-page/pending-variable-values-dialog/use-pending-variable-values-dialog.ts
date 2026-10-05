import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import type { PendingMarkerReplacement } from '@/ui/document-production/widgets/components/document-editor'

export type PendingVariable = {
  marker: string
  technicalName: string
  label: string
}

export type PendingVariableValuesDialogProps = {
  open: boolean
  variables: readonly PendingVariable[]
  onOpenChange: (open: boolean) => void
  onApply: (replacements: readonly PendingMarkerReplacement[]) => void
}

export function usePendingVariableValuesDialog({
  open,
  variables,
  onOpenChange,
  onApply,
}: PendingVariableValuesDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(
    function resetValuesWhenOpened() {
      if (open) setValues({})
    },
    [open],
  )

  const canApply =
    variables.length > 0 && variables.every((variable) => values[variable.marker]?.trim())

  function handleValueChange(marker: string, value: string) {
    setValues((currentValues) => ({ ...currentValues, [marker]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canApply) return

    onApply(
      variables.map((variable) => ({
        marker: variable.marker,
        value: values[variable.marker].trim(),
      })),
    )
    onOpenChange(false)
  }

  return { canApply, handleSubmit, handleValueChange, onOpenChange, values }
}
