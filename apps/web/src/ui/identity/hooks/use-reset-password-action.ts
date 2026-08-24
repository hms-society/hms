import { useMutation } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'

export const useResetPasswordAction = () => {
  const { getSession, isLoading, session, updatePassword } = useAuthContext()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async function resetPasswordRequest(password: string) {
      const currentSession = await getSession()

      if (!currentSession) {
        throw new Error(
          'Sessão de recuperação ausente. Utilize o link enviado por e-mail.',
        )
      }

      await updatePassword(password)
    },
  })

  return {
    error,
    isLoading: isPending,
    sessionReady: Boolean(session),
    sessionChecked: !isLoading,
    resetPassword: mutate,
  }
}
