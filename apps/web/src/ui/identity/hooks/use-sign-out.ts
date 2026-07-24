import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '#/ui/shared/api/client'

export function useSignOut() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      localStorage.removeItem('hms:token')
      localStorage.removeItem('hms:user')

      navigate({ to: '/sign-in' })
    },
  })
}
