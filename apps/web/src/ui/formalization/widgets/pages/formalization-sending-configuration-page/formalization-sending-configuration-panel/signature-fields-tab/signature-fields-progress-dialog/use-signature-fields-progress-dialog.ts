import { useState } from 'react'
import type {
  FormalizationSignatureFieldView,
  FormalizationSignatureSignatoryView,
} from '@hms/core/formalization/domain/structures'

export type SignatureFieldsProgressDialogSignatory = Pick<
  FormalizationSignatureSignatoryView,
  'signatoryId' | 'name'
>

export type SignatureFieldsProgressDialogProps = {
  documentName: string
  fields: readonly FormalizationSignatureFieldView[]
  signatories: readonly SignatureFieldsProgressDialogSignatory[]
}

export function useSignatureFieldsProgressDialog({
  fields,
  signatories,
}: SignatureFieldsProgressDialogProps) {
  const [open, setOpen] = useState(false)
  const configuredSignatoryIds = new Set(fields.map((field) => field.signatoryId))
  const signatoryStatuses = signatories.map((signatory) => ({
    ...signatory,
    isConfigured: configuredSignatoryIds.has(signatory.signatoryId),
  }))

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
  }

  return {
    handleOpenChange,
    open,
    signatoryStatuses,
    configuredSignatoriesCount: signatoryStatuses.filter(
      (signatory) => signatory.isConfigured,
    ).length,
  }
}
