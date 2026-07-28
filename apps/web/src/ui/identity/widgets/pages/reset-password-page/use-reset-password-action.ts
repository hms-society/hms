import { useMutation } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'

export const useResetPasswordAction = () => {
  const { getSession, isLoading, session, updatePassword } = useAuthContext()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (password: string) => {
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
    resetPassword: mutate,
    sessionReady: Boolean(session),
    sessionChecked: !isLoading,
  }
}
