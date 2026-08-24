import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { IntakeFormData } from '@hms/validation/intake'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

export function useClientStep() {
  const form = useFormContext<IntakeFormData>()
  const clientId = form.watch('clientId')
  const [clientDetails, setClientDetails] = useState<ClientDetails>()
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const client = clientDetails?.client
  const clientName =
    client?.type === 'natural'
      ? client.name
      : client?.tradeName || client?.legalName || ''
  const clientInitials = clientName
    .split(' ')
    .slice(0, 2)
    .map(function getInitial(part) {
      return part.charAt(0)
    })
    .join('')
    .toUpperCase()
  const formattedTaxId = client?.taxId.value.replace(
    client.taxId.type === 'cpf'
      ? /(\d{3})(\d{3})(\d{3})(\d{2})/
      : /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    client.taxId.type === 'cpf' ? '$1.$2.$3-$4' : '$1.$2.$3/$4-$5',
  )

  function handleClientDialogChange(isOpen: boolean) {
    if (isOpen) form.clearErrors('clientId')
    setIsClientDialogOpen(isOpen)
  }

  function handleClientSelected(details: ClientDetails) {
    setClientDetails(details)
    form.setValue('clientId', details.client.id, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleChangeClient() {
    form.clearErrors('clientId')
    setIsClientDialogOpen(true)
  }

  return {
    client,
    clientId,
    clientInitials,
    clientName,
    error: form.formState.errors.clientId,
    formattedTaxId,
    isClientDialogOpen,
    handleChangeClient,
    handleClientDialogChange,
    handleClientSelected,
  }
}
