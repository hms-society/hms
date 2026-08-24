import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { UserStatus } from '@hms/core/identity/domain/structures'
import { useState, type MouseEvent } from 'react'
import { toast } from 'sonner'

import { useDeactivateCollaboratorAction } from '@/ui/identity/hooks/use-deactivate-collaborator-action'
import { useReactivateCollaboratorAction } from '@/ui/identity/hooks/use-reactivate-collaborator-action'
import {
  COLLABORATOR_PROFILE_LABELS,
  COLLABORATOR_STATUS_LABELS,
  formatCollaboratorLastAccess,
} from '../collaborators-page/collaborators-page-constants'
import { useCollaboratorDetailsQuery } from '@/ui/identity/hooks/use-collaborator-details-query'

export function useCollaboratorDetailsPage(collaboratorId: string) {
  const { collaborator, collaboratorError, isLoadingCollaborator, refetch } =
    useCollaboratorDetailsQuery(collaboratorId)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false)
  const {
    deactivateCollaborator,
    deactivateCollaboratorError,
    isDeactivatingCollaborator,
    resetDeactivateCollaborator,
  } = useDeactivateCollaboratorAction()
  const {
    isReactivatingCollaborator,
    reactivateCollaborator,
    reactivateCollaboratorError,
    resetReactivateCollaborator,
  } = useReactivateCollaboratorAction()

  function getLegalExpertises(collaboratorValue: CollaboratorSummary) {
    if (!collaboratorValue.legalExpertises) return []

    return collaboratorValue.legalExpertises.map(function mapLegalExpertise({
      legalArea,
      legalTopics,
    }) {
      return {
        areaName: legalArea.name,
        topicNames: legalTopics.map(function getLegalTopicName(topic) {
          return topic.name
        }),
      }
    })
  }

  function getProfileLabel(profile: string) {
    return COLLABORATOR_PROFILE_LABELS[profile] ?? profile
  }

  function getStatusLabel(status: string) {
    return COLLABORATOR_STATUS_LABELS[status] ?? status
  }

  function handleOpenEdit() {
    setIsEditDialogOpen(true)
  }

  function handleEditDialogOpenChange(open: boolean) {
    setIsEditDialogOpen(open)
  }

  function handleEditSuccess() {
    setIsEditDialogOpen(false)
    toast.success('Colaborador atualizado com sucesso.')
  }

  function handleOpenDeactivate() {
    resetDeactivateCollaborator()
    setIsDeactivateDialogOpen(true)
  }

  function handleOpenReactivate() {
    resetReactivateCollaborator()
    setIsReactivateDialogOpen(true)
  }

  function handleDeactivateDialogOpenChange(open: boolean) {
    if (!isDeactivatingCollaborator) setIsDeactivateDialogOpen(open)
  }

  function handleReactivateDialogOpenChange(open: boolean) {
    if (!isReactivatingCollaborator) setIsReactivateDialogOpen(open)
  }

  async function handleConfirmDeactivate(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (isDeactivatingCollaborator) return

    try {
      await deactivateCollaborator(collaboratorId)
      setIsDeactivateDialogOpen(false)
      toast.success('Colaborador inativado com sucesso.')
    } catch {
      // The mutation error remains available to the confirmation dialog for retry.
    }
  }

  async function handleConfirmReactivate(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (isReactivatingCollaborator) return

    try {
      await reactivateCollaborator(collaboratorId)
      setIsReactivateDialogOpen(false)
      toast.success('Colaborador reativado com sucesso.')
    } catch {
      // The mutation error remains available to the confirmation dialog for retry.
    }
  }

  return {
    collaborator,
    collaboratorError,
    deactivateCollaboratorError,
    isCollaboratorDisabled: collaborator?.status === UserStatus.Disabled,
    isDeactivateDialogOpen,
    isDeactivatingCollaborator,
    isEditDialogOpen,
    isLoadingCollaborator,
    isReactivateDialogOpen,
    isReactivatingCollaborator,
    reactivateCollaboratorError,
    refetch,
    formatCollaboratorLastAccess,
    getLegalExpertises,
    getProfileLabel,
    getStatusLabel,
    handleConfirmDeactivate,
    handleConfirmReactivate,
    handleDeactivateDialogOpenChange,
    handleEditDialogOpenChange,
    handleEditSuccess,
    handleOpenDeactivate,
    handleOpenEdit,
    handleOpenReactivate,
    handleReactivateDialogOpenChange,
  }
}

export type CollaboratorDetailsPageController = ReturnType<
  typeof useCollaboratorDetailsPage
>
