import type { ThirdPartyRelationshipType } from '@hms/core/identity/domain/structures'
import type { ThirdPartyRegistration } from '@hms/core/identity/interfaces'
import { useEffect, useState } from 'react'

import { useActiveCollaboratorsQuery } from '@/ui/identity/hooks/use-active-collaborators-query'
import { useRegisterThirdPartyAction } from '@/ui/identity/hooks/use-register-third-party-action'

export type ThirdPartyRegisterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const initialForm: ThirdPartyRegistration = {
  type: 'union',
  legalName: '',
  tradeName: undefined,
  taxId: '',
  taxIdType: 'cnpj',
  taxIdDescription: undefined,
  internalResponsibleId: '',
  relationshipTypes: [],
}

export function useThirdPartyRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
}: ThirdPartyRegisterDialogProps) {
  const [form, setForm] = useState<ThirdPartyRegistration>(initialForm)
  const [validationError, setValidationError] = useState<string>()
  const { collaboratorsPage, isLoadingCollaborators } = useActiveCollaboratorsQuery({
    page: 1,
    limit: 100,
    pageSize: 100,
  })
  const { registerThirdParty, registerThirdPartyError, isRegisteringThirdParty } =
    useRegisterThirdPartyAction()

  useEffect(
    function resetFormWhenClosed() {
      if (!open) {
        setForm(initialForm)
        setValidationError(undefined)
      }
    },
    [open],
  )

  function handleFieldChange(field: keyof ThirdPartyRegistration, value: string) {
    setForm((current) => ({ ...current, [field]: value || undefined }))
  }

  function handleRelationshipToggle(relationship: ThirdPartyRelationshipType) {
    setForm((current) => ({
      ...current,
      relationshipTypes: current.relationshipTypes.includes(relationship)
        ? current.relationshipTypes.filter((item) => item !== relationship)
        : [...current.relationshipTypes, relationship],
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.legalName?.trim())
      return setValidationError('Informe o nome ou razão social.')
    if (!form.taxId?.trim()) return setValidationError('Informe o documento nacional.')
    if (!form.internalResponsibleId)
      return setValidationError('Selecione o responsável interno.')
    if (form.relationshipTypes.length === 0) {
      return setValidationError('Selecione ao menos uma natureza do vínculo.')
    }

    setValidationError(undefined)
    await registerThirdParty({
      ...form,
      legalName: form.legalName.trim(),
      taxId: form.taxId.trim(),
    })
    onOpenChange(false)
    onSuccess?.()
  }

  return {
    collaborators: collaboratorsPage?.items ?? [],
    form,
    handleFieldChange,
    handleRelationshipToggle,
    handleSubmit,
    isLoadingCollaborators,
    isRegisteringThirdParty,
    registerThirdPartyError,
    validationError,
  }
}
