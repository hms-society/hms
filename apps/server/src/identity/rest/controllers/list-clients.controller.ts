import { Get, HttpStatus, Inject, Query, UseGuards, UsePipes } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { ListClientsUseCase } from '@hms/core/identity/use-cases'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'
import { AuthGuard } from '@/identity/guards'
import { ListClientsQueryDto } from '@/identity/rest/dtos/list-clients-query.dto'

@ClientsController()
@UseGuards(AuthGuard)
export class ListClientsController {
  private readonly useCase: ListClientsUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clientList)
    clientsRepository: ClientsRepository,
  ) {
    this.useCase = new ListClientsUseCase(clientsRepository)
  }

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The paginated list of clients was returned successfully.',
  })
  @UsePipes(ZodValidationPipe)
  handle(@Query() query: ListClientsQueryDto) {
    return this.useCase.execute(query)
  }
}
