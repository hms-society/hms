import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { GetCollaboratorProfessionalProfileUseCase } from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import { uuidSchema } from '@hms/validation/shared'
import { ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CollaboratorsController, CurrentUser } from '@/identity/decorators'
import { AuthGuard } from '@/identity/guards'
import { CollaboratorProfessionalProfileResponseDto } from '@/identity/rest/dtos/collaborator-professional-profile-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CollaboratorsController()
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class GetCollaboratorProfessionalProfileController {
  private readonly useCase: GetCollaboratorProfessionalProfileUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
  ) {
    this.useCase = new GetCollaboratorProfessionalProfileUseCase(
      usersRepository,
      collaboratorsRepository,
    )
  }

  @Get(':collaboratorId/professional-profile')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The professional collaborator profile was returned.',
    type: CollaboratorProfessionalProfileResponseDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @CurrentUser() authUser: AuthUser,
    @Param('collaboratorId', new ZodValidationPipe(uuidSchema)) collaboratorId: string,
  ) {
    return this.useCase.execute({ collaboratorId, actorId: authUser.id })
  }
}
