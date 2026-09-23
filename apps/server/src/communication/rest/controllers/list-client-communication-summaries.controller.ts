import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { PrivateMessagesRepository } from '@hms/core/communication/interfaces'
import { ListClientCommunicationSummariesUseCase } from '@hms/core/communication/use-cases'

import { COMMUNICATION_REPOSITORIES } from '@/communication/constants/communication-repositories'
import { CommunicationsController } from '@/communication/decorators'
import { ClientCommunicationSummaryResponseDto } from '@/communication/rest/dtos/client-communication-summary-response.dto'
import { AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CommunicationsController()
@UseGuards(AuthGuard)
export class ListClientCommunicationSummariesController {
  private readonly useCase: ListClientCommunicationSummariesUseCase

  constructor(
    @Inject(COMMUNICATION_REPOSITORIES.privateMessages)
    privateMessagesRepository: PrivateMessagesRepository,
  ) {
    this.useCase = new ListClientCommunicationSummariesUseCase(privateMessagesRepository)
  }

  @Get('summary')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns inbound message counts and latest message direction by client.',
    type: ClientCommunicationSummaryResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  handle() {
    return this.useCase.execute()
  }
}
