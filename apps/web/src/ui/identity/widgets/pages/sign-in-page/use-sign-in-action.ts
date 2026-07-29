import { useMutation } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const useSignInAction = () => {
  const { navigateTo } = useNavigation()
  const { signIn } = useAuthContext()
  const {
    mutate,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return signIn({ identifier: email, password })
    },
    onSuccess: () => {
      navigateTo('home')
    },
  })

  return {
    signIn: mutate,
    isPending: loading,
    error,
  }
}
