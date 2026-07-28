import { useMutation } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'

export const useForgotPasswordAction = () => {
  const { requestPasswordReset } = useAuthContext()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (email: string) => {
      await requestPasswordReset(email, `${window.location.origin}/redefinir-senha`)
    },
  })

  return {
    error,
    forgotPassword: mutate,
    isPending,
  }
}
