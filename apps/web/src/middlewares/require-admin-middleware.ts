import { redirect } from '@tanstack/react-router'

import { IdentityService } from '@/rest/services/identity-service'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'
import { BROWSER_ENV, ROUTES } from '@/constants'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { requireAuthMiddleware } from './require-auth-middleware'

const authProvider = SupabaseAuthProvider()
const identityService = IdentityService(
  AxiosRestClient(BROWSER_ENV.hmsServerAppUrl, () => authProvider.getSession()),
)

export async function requireAdminMiddleware() {
  const auth = await requireAuthMiddleware()
  const response = await identityService.getCurrentCollaborator()

  if (
    response.isFailure ||
    response.body.profile !== CollaboratorProfile.Admin ||
    response.body.status !== UserStatus.Active
  ) {
    throw redirect({ to: ROUTES.home })
  }

  return {
    ...auth,
    currentCollaborator: response.body,
  }
}
