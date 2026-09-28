import { Body, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type {
  CollaboratorsRepository,
  ThirdPartiesRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { RegisterThirdPartyUseCase } from '@hms/core/identity/use-cases'
import { registerThirdPartyRequestSchema } from '@hms/validation/identity'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator, ThirdPartiesController } from '@/identity/decorators'
import type { AuthorizedIdentityRequest } from '@/identity/context'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class RegisterThirdPartyRequestBody extends createZodDto(
  registerThirdPartyRequestSchema,
) {}

@ThirdPartiesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class RegisterThirdPartyController {
  private readonly useCase: RegisterThirdPartyUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.thirdParties)
    thirdPartiesRepository: ThirdPartiesRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaboratorsRepository: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users)
    usersRepository: UsersRepository,
  ) {
    this.useCase = new RegisterThirdPartyUseCase(
      thirdPartiesRepository,
      collaboratorsRepository,
      usersRepository,
    )
  }

  @Post()
  @ApiBody({ type: RegisterThirdPartyRequestBody })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The third party was registered successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The third party data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only administrators and supervisors can register third parties.',
    type: ErrorResponseDto,
  })
  handle(
    @CurrentCollaborator() collaborator: AuthorizedIdentityRequest['collaborator'],
    @Body(new ZodValidationPipe(registerThirdPartyRequestSchema))
    body: RegisterThirdPartyRequestBody,
  ) {
    return this.useCase.execute({
      ...body,
      actorProfile: collaborator.profile as 'admin' | 'supervisor',
    })
  }
}
