import { Body, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'
import type { ClientsRepository, CollaboratorsRepository, UsersRepository } from '@hms/core/identity/interfaces'
import { UpdateClientUseCase } from '@hms/core/identity/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import { updateClientSchema } from '@hms/validation/identity'
import { ZodValidationPipe } from 'nestjs-zod'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController, CurrentUser } from '@/identity/decorators'
import { AuthGuard } from '@/identity/guards'
import { UpdateClientRequestDto, ClientDetailsResponseDto } from '@/identity/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ClientsController()
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class UpdateClientController {
  private readonly useCase: UpdateClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients) clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators) collaboratorsRepository: CollaboratorsRepository,
  ) {
    this.useCase = new UpdateClientUseCase(
      clientsRepository,
      usersRepository,
      collaboratorsRepository,
    )
  }

  @Patch(':clientId')
  @ApiBody({ type: UpdateClientRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The client was updated successfully.',
    type: ClientDetailsResponseDto, 
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The client data are invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User profile does not have permission for this change.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Document duplicated.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The client was not found.',
    type: ErrorResponseDto,
  })
  async handle(
    @CurrentUser() authUser: AuthUser,
    @Param('clientId') clientId: string,
    @Body(new ZodValidationPipe(updateClientSchema)) body: UpdateClientRequestDto,
  ) {
    const changes = { ...body }
    delete changes.duplicityOverrideJustification

    const client = await this.useCase.execute({
      authUser,
      clientId,
      changes: changes as any,
      duplicityOverrideJustification: body.duplicityOverrideJustification,
    })

    return client
  }
}
