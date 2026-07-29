import { redirect } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'

const authProvider = SupabaseAuthProvider()

export async function requireAuthMiddleware() {
  const session = await authProvider.getSession()

  if (!session) {
    throw redirect({ to: ROUTES.login })
  }

  return { authSession: session }
}
