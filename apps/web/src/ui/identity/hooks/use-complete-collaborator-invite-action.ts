import { useMutation } from '@tanstack/react-query'

import { AppError } from '@hms/core/shared/domain/errors'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useCompleteCollaboratorInviteAction = () => {
  const { getSession, updatePassword } = useAuthContext()
  const { identityService } = useRestContext()
  const {
    error: completeCollaboratorInviteError,
    isPending: isCompletingCollaboratorInvite,
    mutateAsync,
  } = useMutation({
    mutationFn: async (password: string) => {
      const currentSession = await getSession()

      if (!currentSession) {
        throw new AppError('Link de convite inválido ou expirado.')
      }

      await updatePassword(password)
      const response = await identityService.completeSignIn()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  return {
    completeCollaboratorInviteError,
    isCompletingCollaboratorInvite,
    completeCollaboratorInvite: mutateAsync,
  }
}
