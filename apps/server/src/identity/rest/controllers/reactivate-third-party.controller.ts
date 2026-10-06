import { HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type {
  ThirdPartyAuditLogsRepository,
  ThirdPartiesRepository,
} from '@hms/core/identity/interfaces'
import { ReactivateThirdPartyUseCase } from '@hms/core/identity/use-cases'

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
export class ReactivateThirdPartyController {
  private readonly useCase: ReactivateThirdPartyUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    thirdPartiesRepository: ThirdPartiesRepository,
    @Inject(IDENTITY_REPOSITORIES.thirdPartyAuditLogs)
    auditLogsRepository: ThirdPartyAuditLogsRepository,
  ) {
    this.useCase = new ReactivateThirdPartyUseCase(
      thirdPartiesRepository,
      auditLogsRepository,
    )
  }

  @Patch(':thirdPartyId/reactivate')
  @ApiResponse({ status: HttpStatus.OK, description: 'The third party was reactivated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @CurrentUser() authUser: AuthUser,
    @CurrentCollaborator() collaborator: AuthorizedIdentityRequest['collaborator'],
    @Param('thirdPartyId') thirdPartyId: string,
  ) {
    return this.useCase.execute({
      actorId: authUser.id,
      actorProfile: collaborator.profile as 'admin' | 'supervisor',
      thirdPartyId,
    })
  }
}
