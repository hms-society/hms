import { ForbiddenException, type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { CasePortalAccessGrantsRepository } from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import type { IdentityRequest } from '@/identity/context'
import { ROUTE_ACCESS } from '@/identity/decorators/route-access.decorator'
import { AuthGuard } from '@/identity/guards/auth.guard'
import { ActiveCollaboratorGuard } from '@/identity/guards/active-collaborator.guard'

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

    await this.authGuard.canActivate(context)
    if (access === 'case-portal' || access === 'case-portal-upload') {
      const request = context.switchToHttp().getRequest<IdentityRequest & { params: { caseId?: string } }>()
      const caseId = request.params?.caseId
      if (!caseId || !request.user) throw new ForbiddenException('A case-specific portal grant is required')

      const grant = await this.casePortalAccessGrants.findActiveByUserAndCase(
        request.user.id,
        caseId,
      )
      if (!grant) throw new ForbiddenException('The user is not authorized for this case')
      if (access === 'case-portal-upload' && !grant.canUpload) {
        throw new ForbiddenException('The user is not authorized to upload for this case')
      }
      return true
    }

    return this.collaboratorGuard.canActivate(context)
  }
}
