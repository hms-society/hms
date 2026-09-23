import {
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { CasePortalAccessGrantsRepository } from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import type { IdentityRequest } from '@/identity/context'
import { ROUTE_ACCESS } from '@/identity/decorators/route-access.decorator'
import { AuthGuard } from '@/identity/guards/auth.guard'
import { ActiveCollaboratorGuard } from '@/identity/guards/active-collaborator.guard'
import {
  hashPortalAccessToken,
  PORTAL_ACCESS_TOKEN_HEADER,
} from '@/case-management/security/portal-access-token'

@Injectable()
export class ApplicationAccessGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthGuard) private readonly authGuard: AuthGuard,
    @Inject(ActiveCollaboratorGuard)
    private readonly collaboratorGuard: ActiveCollaboratorGuard,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    private readonly casePortalAccessGrants: CasePortalAccessGrantsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.getAllAndOverride<string>(ROUTE_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ])

    if (access === 'public') return true

    if (access === 'case-portal' || access === 'case-portal-upload') {
      const request = context.switchToHttp().getRequest<
        IdentityRequest & {
          params: { caseId?: string }
          headers: Record<string, string | undefined>
          query?: { portalToken?: string }
        }
      >()
      const caseId = request.params?.caseId
      const token =
        request.headers[PORTAL_ACCESS_TOKEN_HEADER] ?? request.query?.portalToken
      if (!caseId || !token)
        throw new ForbiddenException('A valid case portal link is required')

      const grant = await this.casePortalAccessGrants.findActiveByTokenHashAndCase(
        hashPortalAccessToken(token),
        caseId,
      )
      if (!grant) throw new ForbiddenException('The portal link is invalid or expired')
      if (access === 'case-portal-upload' && !grant.canUpload) {
        throw new ForbiddenException(
          'The portal link is not authorized to upload for this case',
        )
      }
      request.portalAccessGrant = grant
      return true
    }

    await this.authGuard.canActivate(context)
    return this.collaboratorGuard.canActivate(context)
  }
}
