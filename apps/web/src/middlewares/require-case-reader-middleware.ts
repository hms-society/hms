import { redirect } from '@tanstack/react-router'

import { BROWSER_ENV, ROUTES } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { CaseManagementService } from '@/rest/services/case-management-service'
import { IdentityService } from '@/rest/services/identity-service'
import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'
import { requireAuthMiddleware } from './require-auth-middleware'

const authProvider = SupabaseAuthProvider()
const restClient = AxiosRestClient(BROWSER_ENV.hmsServerAppUrl, () =>
  authProvider.getSession(),
)
const identityService = IdentityService(restClient)
const caseManagementService = CaseManagementService(restClient)
const CASE_READER_PROFILES = [
  CollaboratorProfile.Lawyer,
  CollaboratorProfile.Paralegal,
  CollaboratorProfile.Supervisor,
] as const

function isLegalReaderProfile(profile: CollaboratorProfile) {
  return CASE_READER_PROFILES.includes(profile as (typeof CASE_READER_PROFILES)[number])
}

async function loadCaseTeam(caseId: string) {
  const response = await caseManagementService.getCaseTeam(caseId)

  if (response.isFailure) {
    if (response.statusCode === 0 || response.statusCode >= 500) {
      throw new AppError('Não foi possível verificar o acesso a este caso.')
    }

    throw redirect({ to: ROUTES.home })
  }

  return response.body
}

function ensureCollaboratorCanReadCase(
  isAdministrator: boolean,
  collaboratorId: string,
  members: Awaited<ReturnType<typeof loadCaseTeam>>['members'],
) {
  if (
    !isAdministrator &&
    !members.some(
      (member) => member.collaboratorId === collaboratorId && member.isEligible,
    )
  ) {
    throw redirect({ to: ROUTES.home })
  }
}

export async function requireCaseReaderMiddleware<
  RouteContext extends {
    params: { caseId?: string }
    legalContentOnly?: boolean
  },
>({ params, legalContentOnly = false }: RouteContext) {
  const auth = await requireAuthMiddleware()
  const collaboratorResponse = await identityService.getCurrentCollaborator()

  if (
    collaboratorResponse.isFailure ||
    collaboratorResponse.body.status !== UserStatus.Active
  ) {
    if (collaboratorResponse.isFailure && collaboratorResponse.statusCode >= 500) {
      throw new AppError('Não foi possível verificar seu perfil.')
    }
    throw redirect({ to: ROUTES.home })
  }

  const collaborator = collaboratorResponse.body
  const isAdministrator = collaborator.profile === CollaboratorProfile.Admin
  const isLegalReader = isLegalReaderProfile(collaborator.profile)

  if (!isAdministrator && !isLegalReader) {
    throw redirect({ to: ROUTES.home })
  }

  if (legalContentOnly && !isLegalReader) {
    throw redirect({ to: ROUTES.home })
  }

  if (!params.caseId) {
    if (!isLegalReader) throw redirect({ to: ROUTES.home })

    return { ...auth, currentCollaborator: collaborator }
  }

  const caseTeam = await loadCaseTeam(params.caseId)
  ensureCollaboratorCanReadCase(
    isAdministrator,
    collaborator.collaboratorId,
    caseTeam.members,
  )

  return {
    ...auth,
    caseTeam,
    currentCollaborator: collaborator,
  }
}
