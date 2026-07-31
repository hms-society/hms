import { zodResolver } from '@hookform/resolvers/zod'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { registerCollaboratorSchema } from '@hms/validation/identity'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

import { useCollaboratorLegalAreasQuery } from '@/ui/identity/hooks/use-collaborator-legal-areas-query'
import { useRegisterCollaboratorAction } from './use-register-collaborator-action'

import type { CollaboratorFormValues } from '../collaborator-expertise-group'

export type CollaboratorRegisterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type FormValues = CollaboratorFormValues

const legalProfiles = new Set(['lawyer', 'paralegal', 'supervisor'])

export function useCollaboratorRegisterDialog({
  open,
  onOpenChange,
  onSuccess,
}: CollaboratorRegisterDialogProps) {
  const [pendingProfile, setPendingProfile] = useState<string>()
  const [unavailableTopicGroups, setUnavailableTopicGroups] = useState<
    Record<number, boolean>
  >({})
  const requestErrorRef = useRef<HTMLParagraphElement>(null)
  const { legalAreas, legalAreasError, isLoadingLegalAreas } =
    useCollaboratorLegalAreasQuery()
  const form = useForm<FormValues>({
    resolver: zodResolver(registerCollaboratorSchema) as never,
    mode: 'onChange',
    defaultValues: { profile: CollaboratorProfile.Attendant },
  })
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'legalExpertises',
  })
  const { registerCollaborator, isRegisteringCollaborator, registerCollaboratorError } =
    useRegisterCollaboratorAction()
  const profile = form.watch('profile')
  const isLegalProfile = legalProfiles.has(profile)
  const selectedExpertises = form.watch('legalExpertises') ?? []
  const legalAreasUnavailable = isLoadingLegalAreas || Boolean(legalAreasError)
  const legalTopicsUnavailable =
    isLegalProfile &&
    fields.some(function isTopicGroupUnavailable(_, index) {
      return unavailableTopicGroups[index]
    })
  const firstError = Object.keys(form.formState.errors)[0] as keyof FormValues | undefined

  const handleTopicAvailabilityChange = useCallback(
    function handleTopicAvailabilityChange(index: number, unavailable: boolean) {
      setUnavailableTopicGroups(function updateUnavailableTopicGroups(previous) {
        if (previous[index] === unavailable) return previous
        return { ...previous, [index]: unavailable }
      })
    },
    [],
  )

  useEffect(
    function focusRequestError() {
      if (registerCollaboratorError) requestErrorRef.current?.focus()
    },
    [registerCollaboratorError],
  )

  useEffect(
    function synchronizeLegalExpertises() {
      if (!isLegalProfile) {
        setUnavailableTopicGroups({})
        replace([])
        form.unregister('legalExpertises')
        return
      }

      if (fields.length === 0) {
        append({ legalAreaId: '', legalTopicIds: [] })
      }
    },
    [append, fields.length, form, isLegalProfile, replace],
  )

  function handleRemoveExpertise(index: number) {
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

  function handleClose() {
    if (!isRegisteringCollaborator) {
      form.reset({ profile: CollaboratorProfile.Attendant })
      setPendingProfile(undefined)
      onOpenChange(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    handleClose()
  }

  function handleProfileChange(nextProfile: string) {
    const hasExpertiseToDiscard = selectedExpertises.some(
      function hasSelectedExpertise(expertise) {
        return expertise.legalAreaId || expertise.legalTopicIds.length > 0
      },
    )

    if (
      legalProfiles.has(profile) &&
      !legalProfiles.has(nextProfile) &&
      hasExpertiseToDiscard
    ) {
      setPendingProfile(nextProfile)
      return
    }

    form.setValue('profile', nextProfile, { shouldDirty: true, shouldValidate: true })
  }

  function handlePendingProfileChange(isOpen: boolean) {
    if (!isOpen) setPendingProfile(undefined)
  }

  function handleConfirmProfileChange() {
    if (!pendingProfile) return

    form.setValue('profile', pendingProfile, { shouldDirty: true, shouldValidate: true })
    replace([])
    form.unregister('legalExpertises')
    setPendingProfile(undefined)
  }

  function handleInvalidSubmit() {
    if (firstError && firstError !== 'legalExpertises') {
      form.setFocus(firstError)
    } else {
      form.setFocus('email')
    }
  }

  function handleAreaChange(index: number, value: string) {
    form.setValue(
      `legalExpertises.${index}`,
      { legalAreaId: value, legalTopicIds: [] },
      { shouldValidate: true },
    )
  }

  function handleTopicsChange(index: number, topicIds: string[]) {
    form.setValue(`legalExpertises.${index}.legalTopicIds`, topicIds, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleAddExpertise() {
    append({ legalAreaId: '', legalTopicIds: [] })
  }

  async function handleSubmit(values: FormValues) {
    const request = legalProfiles.has(values.profile)
      ? {
          email: values.email,
          professionalName: values.professionalName,
          jobTitle: values.jobTitle,
          profile: values.profile,
          legalExpertises: values.legalExpertises,
        }
      : {
          email: values.email,
          professionalName: values.professionalName,
          jobTitle: values.jobTitle,
          profile: values.profile,
        }

    await registerCollaborator(request as never)
    onSuccess?.()
    handleClose()
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit(handleSubmit, handleInvalidSubmit)(event)
  }

  return {
    fields,
    firstError,
    form,
    isLoadingLegalAreas,
    isLegalProfile,
    isRegisteringCollaborator,
    legalAreas,
    legalAreasError,
    legalAreasUnavailable,
    legalTopicsUnavailable,
    open,
    pendingProfile,
    profile,
    registerCollaboratorError,
    requestErrorRef,
    selectedExpertises,
    onSubmit,
    handleAddExpertise,
    handleAreaChange,
    handleClose,
    handleConfirmProfileChange,
    handleOpenChange,
    handlePendingProfileChange,
    handleProfileChange,
    handleRemoveExpertise,
    handleTopicAvailabilityChange,
    handleTopicsChange,
  }
}
