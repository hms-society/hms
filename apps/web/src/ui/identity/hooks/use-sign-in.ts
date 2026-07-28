import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/ui/shared/api/client'

export const useSignIn = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('http://localhost:3333/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: email, senha: password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao realizar login')
      }

      return await response.json()
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        localStorage.setItem('hms:token', data.accessToken)
        localStorage.setItem('hms:user', JSON.stringify(data.user))
      }
      navigate({ to: '/home' })
    },
  })
}
