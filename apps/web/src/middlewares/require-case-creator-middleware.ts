import { redirect } from '@tanstack/react-router'

import { BROWSER_ENV, ROUTES } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IdentityService } from '@/rest/services/identity-service'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'
import { requireAuthMiddleware } from './require-auth-middleware'

const authProvider = SupabaseAuthProvider()
const identityService = IdentityService(
  AxiosRestClient(BROWSER_ENV.hmsServerAppUrl, () => authProvider.getSession()),
)

export async function requireCaseCreatorMiddleware() {
  const auth = await requireAuthMiddleware()
  const response = await identityService.getCurrentCollaborator()

  if (response.isFailure && (response.statusCode === 0 || response.statusCode >= 500)) {
    throw new AppError('Não foi possível verificar seu perfil.')
  }

  if (
    response.isFailure ||
    response.body.status !== UserStatus.Active ||
    !(
      response.body.profile === CollaboratorProfile.Admin ||
      response.body.profile === CollaboratorProfile.Lawyer
    )
  ) {
    throw redirect({ to: ROUTES.home })
  }

  return { ...auth, currentCollaborator: response.body }
}
