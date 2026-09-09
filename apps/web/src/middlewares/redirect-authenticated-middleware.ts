import { redirect } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'

const authProvider = SupabaseAuthProvider()

export async function redirectAuthenticatedMiddleware(input: { returnTo?: string } = {}) {
  const session = await authProvider.getSession()

  if (session && input.returnTo !== ROUTES.signingGateway) {
    throw redirect({ to: ROUTES.home })
  }
}
