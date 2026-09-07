import { redirect } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'

const authProvider = SupabaseAuthProvider()

export async function redirectAuthenticatedMiddleware(input: { returnTo?: string } = {}) {
  const session = await authProvider.getSession()

  const returnTo =
    input.returnTo ??
    (typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('returnTo') ?? undefined)
      : undefined)

  if (session && returnTo !== ROUTES.signingGateway) {
    throw redirect({ to: ROUTES.home })
  }
}
