import { Delete, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { AuthUser, ThirdPartyPermission } from '@hms/core/identity/domain/structures'
import type {
  ThirdPartyAuditLogsRepository,
  ThirdPartiesRepository,
  ThirdPartyPermissionsRepository,
} from '@hms/core/identity/interfaces'
import { RevokeThirdPartyPermissionUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  CurrentCollaborator,
  CurrentUser,
  ThirdPartiesController,
} from '@/identity/decorators'
import type { AuthorizedIdentityRequest } from '@/identity/context'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ThirdPartiesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class RevokeThirdPartyPermissionController {
  private readonly useCase: RevokeThirdPartyPermissionUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    thirdPartiesRepository: ThirdPartiesRepository,
    @Inject(IDENTITY_REPOSITORIES.thirdPartyPermissions)
    permissionsRepository: ThirdPartyPermissionsRepository,
    @Inject(IDENTITY_REPOSITORIES.thirdPartyAuditLogs)
    auditLogsRepository: ThirdPartyAuditLogsRepository,
  ) {
    this.useCase = new RevokeThirdPartyPermissionUseCase(
      thirdPartiesRepository,
      permissionsRepository,
      auditLogsRepository,
    )
  }

  @Delete(':thirdPartyId/permissions/:permission')
  @ApiResponse({ status: HttpStatus.OK, description: 'The permission was revoked.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  handle(
    @CurrentUser() authUser: AuthUser,
    @CurrentCollaborator() collaborator: AuthorizedIdentityRequest['collaborator'],
    @Param('thirdPartyId') thirdPartyId: string,
    @Param('permission') permission: string,
  ) {
    return this.useCase.execute({
      actorId: authUser.id,
      actorProfile: collaborator.profile as 'admin' | 'supervisor',
      thirdPartyId,
      permission: permission as ThirdPartyPermission,
    })
  }
}
