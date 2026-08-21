import { zodResolver } from '@hookform/resolvers/zod'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { updateCollaboratorSchema } from '@hms/validation/identity'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { useCollaboratorLegalAreasQuery } from '@/ui/identity/hooks/use-collaborator-legal-areas-query'
import { useUpdateCollaboratorAction } from '@/ui/identity/hooks/use-update-collaborator-action'
import type { CollaboratorFormValues } from '@/ui/identity/widgets/components/collaborator-expertise-group'

export type CollaboratorEditDialogProps = {
  open: boolean
  collaborator: CollaboratorSummary
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const LEGAL_PROFILES: ReadonlySet<string> = new Set([
  CollaboratorProfile.Lawyer,
  CollaboratorProfile.Paralegal,
  CollaboratorProfile.Supervisor,
])

function getDefaultValues(collaborator: CollaboratorSummary): CollaboratorFormValues {
  return {
    professionalName: collaborator.professionalName,
    jobTitle: collaborator.jobTitle ?? '',
    profile: collaborator.profile,
    legalExpertises: collaborator.legalExpertises?.map(function mapExpertise(expertise) {
      return {
        legalAreaId: expertise.legalArea.id,
        legalTopicIds: expertise.legalTopics.map(function mapTopic(topic) {
          return topic.id
        }),
      }
    }),
  }
}

export function useCollaboratorEditDialog({
  open,
  collaborator,
  onOpenChange,
  onSuccess,
}: CollaboratorEditDialogProps) {
  const [pendingProfile, setPendingProfile] = useState<string>()
  const requestErrorRef = useRef<HTMLParagraphElement>(null)
  const { legalAreas, legalAreasError, isLoadingLegalAreas } =
    useCollaboratorLegalAreasQuery()
  const form = useForm<CollaboratorFormValues>({
    resolver: zodResolver(updateCollaboratorSchema) as never,
    mode: 'onChange',
    defaultValues: getDefaultValues(collaborator),
  })
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'legalExpertises',
  })
  const { updateCollaborator, isUpdatingCollaborator, updateCollaboratorError } =
    useUpdateCollaboratorAction()
  const profile = form.watch('profile')
  const selectedExpertises = form.watch('legalExpertises') ?? []
  const legalAreasUnavailable = isLoadingLegalAreas || Boolean(legalAreasError)
  const [unavailableTopicGroups, setUnavailableTopicGroups] = useState<
    Record<number, boolean>
  >({})
  const legalTopicsUnavailable =
    LEGAL_PROFILES.has(profile) &&
    fields.some(function isTopicGroupUnavailable(_, index) {
      return unavailableTopicGroups[index]
    })

  function handleTopicAvailabilityChange(index: number, unavailable: boolean) {
    setUnavailableTopicGroups(function updateUnavailableTopicGroups(previous) {
      if (previous[index] === unavailable) return previous
      return { ...previous, [index]: unavailable }
    })
  }

  useEffect(
    function resetCollaboratorForm() {
      if (!open) return

      form.reset(getDefaultValues(collaborator))
      setUnavailableTopicGroups({})
      setPendingProfile(undefined)
    },
    [collaborator, form, open],
  )

  useEffect(
    function synchronizeExpertiseGroups() {
      if (!LEGAL_PROFILES.has(profile)) {
        setUnavailableTopicGroups({})
        replace([])
        form.unregister('legalExpertises')
        return
      }

      if (fields.length === 0) append({ legalAreaId: '', legalTopicIds: [] })
    },
    [append, fields.length, form, profile, replace],
  )

  useEffect(
    function focusRequestError() {
      if (updateCollaboratorError) requestErrorRef.current?.focus()
    },
    [updateCollaboratorError],
  )

  function removeExpertise(index: number) {
    const nextAvailability: Record<number, boolean> = {}
    fields.forEach(function mapTopicAvailability(_, fieldIndex) {
      if (fieldIndex !== index) {
        const nextIndex = fieldIndex < index ? fieldIndex : fieldIndex - 1
        nextAvailability[nextIndex] = unavailableTopicGroups[fieldIndex] ?? false
      }
    })
    remove(index)
    setUnavailableTopicGroups(nextAvailability)
  }

  function handleProfileChange(nextProfile: string) {
    const hasExpertiseToDiscard = selectedExpertises.some(
      function hasSelectedExpertise(expertise) {
        return expertise.legalAreaId || expertise.legalTopicIds.length > 0
      },
    )

    if (
      LEGAL_PROFILES.has(profile) &&
      !LEGAL_PROFILES.has(nextProfile) &&
      hasExpertiseToDiscard
    ) {
      setPendingProfile(nextProfile)
      return
    }

    form.setValue('profile', nextProfile, { shouldDirty: true, shouldValidate: true })
  }

  function confirmProfileChange() {
    if (!pendingProfile) return

    form.setValue('profile', pendingProfile, { shouldDirty: true, shouldValidate: true })
    replace([])
    form.unregister('legalExpertises')
    setPendingProfile(undefined)
  }

  function cancelProfileChange() {
    setPendingProfile(undefined)
  }

  function close() {
    if (!isUpdatingCollaborator) onOpenChange(false)
  }

  function handleInvalidSubmit() {
    form.setFocus('professionalName')
  }

  async function submitForm(values: CollaboratorFormValues) {
    const changes = LEGAL_PROFILES.has(values.profile)
      ? {
          professionalName: values.professionalName,
          jobTitle: values.jobTitle,
          profile: values.profile,
          legalExpertises: values.legalExpertises,
        }
      : {
          professionalName: values.professionalName,
          jobTitle: values.jobTitle,
          profile: values.profile,
        }

    await updateCollaborator({
      collaboratorId: collaborator.collaboratorId,
      changes: changes as never,
    })
    onSuccess?.()
    close()
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit(submitForm, handleInvalidSubmit)(event)
  }

  return {
    collaborator,
    fields,
    form,
    legalAreas,
    legalAreasError,
    legalAreasUnavailable,
    legalTopicsUnavailable,
    isLoadingLegalAreas,
    isUpdatingCollaborator,
    pendingProfile,
    profile,
    requestErrorRef,
    selectedExpertises,
    updateCollaboratorError,
    append,
    cancelProfileChange,
    close,
    confirmProfileChange,
    handleProfileChange,
    handleTopicAvailabilityChange,
    onSubmit,
    removeExpertise,
  }
}
