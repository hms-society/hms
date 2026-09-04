import { useMutation } from '@tanstack/react-query'

import { AppError } from '@hms/core/shared/domain/errors'

import { ROUTES } from '@/constants/routes'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const useSignInAction = (returnTo?: typeof ROUTES.signingGateway) => {
  const { navigateTo } = useNavigation()
  const { getSession, signIn: authenticate, signOut } = useAuthContext()
  const { identityService } = useRestContext()
  const {
    mutate,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: async function signInRequest({
      email,
      password,
    }: {
      email: string
      password: string
    }) {
      try {
        await authenticate({ identifier: email, password })

        const session = await getSession()
        if (!session?.accessToken) {
          throw new AppError('Não foi possível confirmar a sessão de acesso.')
        }

        const response = await identityService.completeSignIn()
        if (response.isFailure) response.throwError()

        return response.body
      } catch (error) {
        await signOut().catch(function ignoreSignOutError() {
          return undefined
        })
        throw error
      }
    },
    onSuccess: function navigateAfterSignIn() {
      void navigateTo(returnTo === ROUTES.signingGateway ? 'signingGateway' : 'home')
    },
  })

  return {
    isPending: loading,
    error,
    signIn: mutate,
  }
}
