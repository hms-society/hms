import { useEffect, useState } from 'react'
import { supabase } from '#/ui/shared/api/client'

export function useResetPassword() {
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const resetPassword = async (password: string) => {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      throw new Error('Sessão de recuperação ausente. Utilize o link enviado por e-mail.')
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      throw updateError
    }

    return true
  }

  return {
    resetPassword,
    sessionReady,
  }
}