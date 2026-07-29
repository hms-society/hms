import { Get, HttpStatus, Inject, Param } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  ClientConsentsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import { GetClientUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'
import { ClientDetailsResponseDto } from '@/identity/rest/dtos/client-details-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@ClientsController()
export class GetClientController {
  private readonly useCase: GetClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    clientConsentsRepository: ClientConsentsRepository,
  ) {
    this.useCase = new GetClientUseCase(clientsRepository, clientConsentsRepository)
  }

  @Get(':clientId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The client and their consents were returned successfully.',
    type: ClientDetailsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The client was not found.',
    type: ErrorResponseDto,
  })
  handle(@Param('clientId') clientId: string) {
    return this.useCase.execute({ clientId })
  }
}
