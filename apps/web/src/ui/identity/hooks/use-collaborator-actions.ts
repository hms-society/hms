import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from './collaborator-query-keys'

type CollaboratorId = Parameters<IdentityService['deactivateCollaborator']>[0]

export function useCollaboratorActions() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function resendCollaboratorInvitation(collaboratorId: CollaboratorId) {
    const response = await identityService.resendCollaboratorInvitation(collaboratorId)
    if (response.isFailure) response.throwError()
    return response.body
  }

  async function deactivateCollaborator(collaboratorId: CollaboratorId) {
    const response = await identityService.deactivateCollaborator(collaboratorId)
    if (response.isFailure) response.throwError()
    return response.body
  }

  async function reactivateCollaborator(collaboratorId: CollaboratorId) {
    const response = await identityService.reactivateCollaborator(collaboratorId)
    if (response.isFailure) response.throwError()
    return response.body
  }

  async function cancelCollaboratorInvitation(collaboratorId: CollaboratorId) {
    const response = await identityService.cancelCollaboratorInvitation(collaboratorId)
    if (response.isFailure) response.throwError()
    return response.body
  }

  async function removeCollaborator(collaboratorId: CollaboratorId) {
    const response = await identityService.removeCollaborator(collaboratorId)
    if (response.isFailure) response.throwError()
  }

  function invalidateCollaboratorQueries(
    _collaborator: unknown,
    collaboratorId: CollaboratorId,
  ) {
    void queryClient.invalidateQueries({ queryKey: collaboratorQueryKeys.all })
    void queryClient.invalidateQueries({
      queryKey: collaboratorQueryKeys.detail(collaboratorId),
    })
  }

  const resend = useMutation({
    mutationFn: resendCollaboratorInvitation,
    onSuccess: invalidateCollaboratorQueries,
  })
  const deactivate = useMutation({
    mutationFn: deactivateCollaborator,
    onSuccess: invalidateCollaboratorQueries,
  })
  const reactivate = useMutation({
    mutationFn: reactivateCollaborator,
    onSuccess: invalidateCollaboratorQueries,
  })
  const cancelInvitation = useMutation({
    mutationFn: cancelCollaboratorInvitation,
    onSuccess: invalidateCollaboratorQueries,
  })
  const remove = useMutation({
    mutationFn: removeCollaborator,
    onSuccess: invalidateCollaboratorQueries,
  })

  return {
    isResendingInvitation: resend.isPending,
    resendInvitationError: resend.error,
    isDeactivatingCollaborator: deactivate.isPending,
    deactivateCollaboratorError: deactivate.error,
    isReactivatingCollaborator: reactivate.isPending,
    reactivateCollaboratorError: reactivate.error,
    isCancellingCollaboratorInvitation: cancelInvitation.isPending,
    cancelCollaboratorInvitationError: cancelInvitation.error,
    isRemovingCollaborator: remove.isPending,
    removeCollaboratorError: remove.error,
    resendInvitation: resend.mutateAsync,
    resetResendInvitation: resend.reset,
    deactivateCollaborator: deactivate.mutateAsync,
    resetDeactivateCollaborator: deactivate.reset,
    reactivateCollaborator: reactivate.mutateAsync,
    resetReactivateCollaborator: reactivate.reset,
    cancelCollaboratorInvitation: cancelInvitation.mutateAsync,
    resetCancelCollaboratorInvitation: cancelInvitation.reset,
    removeCollaborator: remove.mutateAsync,
    resetRemoveCollaborator: remove.reset,
  }
}
