import { Body, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  ThirdPartiesRepository,
  ThirdPartyAuditLogsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { UpdateThirdPartyUseCase } from '@hms/core/identity/use-cases'
import { updateThirdPartyRequestSchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  CurrentCollaborator,
  CurrentUser,
  ThirdPartiesController,
} from '@/identity/decorators'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { AuthorizedIdentityRequest } from '@/identity/context'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class UpdateThirdPartyRequestBody extends createZodDto(updateThirdPartyRequestSchema) {}

@ThirdPartiesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class UpdateThirdPartyController {
  private readonly useCase: UpdateThirdPartyUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    thirdPartiesRepository: ThirdPartiesRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.thirdPartyAuditLogs)
    auditLogsRepository: ThirdPartyAuditLogsRepository,
  ) {
    this.useCase = new UpdateThirdPartyUseCase(
      thirdPartiesRepository,
      collaboratorsRepository,
      usersRepository,
      auditLogsRepository,
    )
  }

  @Patch(':thirdPartyId')
  @ApiBody({ type: UpdateThirdPartyRequestBody })
  @ApiResponse({ status: HttpStatus.OK, description: 'The third party was updated.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  async handle(
    @CurrentUser() authUser: AuthUser,
    @CurrentCollaborator() collaborator: AuthorizedIdentityRequest['collaborator'],
    @Param('thirdPartyId') thirdPartyId: string,
    @Body(new ZodValidationPipe(updateThirdPartyRequestSchema))
    body: UpdateThirdPartyRequestBody,
  ) {
    return this.useCase.execute({
      ...body,
      actorId: authUser.id,
      actorProfile: collaborator.profile as 'admin' | 'supervisor',
      thirdPartyId,
    })
  }
}
