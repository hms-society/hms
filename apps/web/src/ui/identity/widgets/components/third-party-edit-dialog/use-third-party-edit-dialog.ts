import type { ThirdParty } from '@hms/core/identity/domain/entities'
import type { ThirdPartyRelationshipType } from '@hms/core/identity/domain/structures'
import type { ThirdPartyRegistration } from '@hms/core/identity/interfaces'
import { useEffect, useState } from 'react'

import { useActiveCollaboratorsQuery } from '@/ui/identity/hooks/use-active-collaborators-query'
import { useUpdateThirdPartyAction } from '@/ui/identity/hooks/use-update-third-party-action'

export type ThirdPartyEditDialogProps = {
  open: boolean
  thirdParty?: ThirdParty
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type EditForm = Partial<ThirdPartyRegistration>

export function useThirdPartyEditDialog({
  open,
  thirdParty,
  onOpenChange,
  onSuccess,
}: ThirdPartyEditDialogProps) {
  const [form, setForm] = useState<EditForm>({})
  const [validationError, setValidationError] = useState<string>()
  const { collaboratorsPage, isLoadingCollaborators } = useActiveCollaboratorsQuery({
    page: 1,
    limit: 100,
    pageSize: 100,
  })
  const { updateThirdParty, updateThirdPartyError, isUpdatingThirdParty } =
    useUpdateThirdPartyAction()
  useEffect(
    function syncThirdPartyForm() {
      if (thirdParty && open) {
        setForm({
          type: thirdParty.type,
          legalName: thirdParty.legalName,
          tradeName: thirdParty.tradeName,
          taxId: thirdParty.taxId.value,
          taxIdType: thirdParty.taxId.type,
          taxIdDescription: thirdParty.taxId.description,
          internalResponsibleId: thirdParty.internalResponsibleId,
          relationshipTypes: thirdParty.relationshipTypes,
        })
      }
    },
    [open, thirdParty],
  )

  function handleFieldChange(field: keyof EditForm, value: string) {
    setForm((current) => ({ ...current, [field]: value || undefined }))
  }

  function handleRelationshipToggle(relationship: ThirdPartyRelationshipType) {
    const relationships = form.relationshipTypes ?? []
    setForm((current) => ({
      ...current,
      relationshipTypes: relationships.includes(relationship)
        ? relationships.filter((item) => item !== relationship)
        : [...relationships, relationship],
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!thirdParty) return
    if (!form.legalName?.trim())
      return setValidationError('Informe o nome ou razão social.')
    if (!form.taxId?.trim()) return setValidationError('Informe o documento nacional.')
    if (!form.internalResponsibleId)
      return setValidationError('Selecione o responsável interno.')
    if (!form.relationshipTypes?.length)
      return setValidationError('Selecione ao menos uma natureza do vínculo.')
    setValidationError(undefined)
    await updateThirdParty({
      thirdPartyId: thirdParty.id,
      changes: { ...form, legalName: form.legalName.trim(), taxId: form.taxId.trim() },
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
    isUpdatingThirdParty,
    updateThirdPartyError,
    validationError,
  }
}
