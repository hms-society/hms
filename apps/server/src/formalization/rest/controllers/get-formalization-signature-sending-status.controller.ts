import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { formalizationSignatureSendingStatusSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { GetFormalizationSignatureSendingStatusUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'
import { Inject } from '@nestjs/common'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class FormalizationSignatureSendingStatusResponseDto extends createZodDto(
  formalizationSignatureSendingStatusSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignatureSendingStatusController {
  private readonly useCase: GetFormalizationSignatureSendingStatusUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    requestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository,
  ) {
    this.useCase = new GetFormalizationSignatureSendingStatusUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository: requestDocumentsRepository,
    })
  }

  @Get(':formalizationId/signature-sending/status')
  @ApiResponse({
    status: 200,
    description: 'The signature sending status was returned successfully.',
    type: FormalizationSignatureSendingStatusResponseDto,
  })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
