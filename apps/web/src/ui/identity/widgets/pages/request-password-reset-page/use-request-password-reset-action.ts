import { useMutation } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'

export const useForgotPasswordAction = () => {
  const { requestPasswordReset: sendPasswordReset } = useAuthContext()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async function sendPasswordResetRequest(email: string) {
      await sendPasswordReset(email, `${window.location.origin}/redefinir-senha`)
    },
  })

  return {
    error,
    isPending,
    forgotPassword: mutate,
  }
}
