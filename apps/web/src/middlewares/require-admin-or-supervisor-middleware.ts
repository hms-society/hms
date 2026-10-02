import { redirect } from '@tanstack/react-router'

import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IdentityService } from '@/rest/services/identity-service'
import { BROWSER_ENV, ROUTES } from '@/constants'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { requireAuthMiddleware } from './require-auth-middleware'

const authProvider = SupabaseAuthProvider()
const identityService = IdentityService(
  AxiosRestClient(BROWSER_ENV.hmsServerAppUrl, () => authProvider.getSession()),
)

export async function requireAdminOrSupervisorMiddleware() {
  const auth = await requireAuthMiddleware()
  const response = await identityService.getCurrentCollaborator()
  const hasAccess =
    response.body &&
    (response.body.profile === CollaboratorProfile.Admin ||
      response.body.profile === CollaboratorProfile.Supervisor) &&
    response.body.status === UserStatus.Active

  if (response.isFailure || !hasAccess) throw redirect({ to: ROUTES.home })

  return { ...auth, currentCollaborator: response.body }
}
