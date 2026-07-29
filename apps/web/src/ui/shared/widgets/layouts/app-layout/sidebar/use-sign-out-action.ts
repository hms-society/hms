import { useMutation } from '@tanstack/react-query'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const useSignOutAction = () => {
  const { navigateTo } = useNavigation()
  const { signOut } = useAuthContext()

  return useMutation({
    mutationFn: async () => {
      await signOut()
    },
    onSuccess: () => {
      navigateTo('login')
    },
  })
}
