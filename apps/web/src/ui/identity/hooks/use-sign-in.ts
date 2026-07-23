import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '#/ui/shared/api/client'

export const useSignIn = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      if (data.session) {
        localStorage.setItem('hms:token', data.session.access_token)
        localStorage.setItem('hms:user', JSON.stringify(data.user))
      }
      navigate({ to: '/home' })
    },
  })
}
