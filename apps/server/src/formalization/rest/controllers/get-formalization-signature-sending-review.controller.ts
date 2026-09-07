import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import { formalizationSignatureSendingReviewSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { GetFormalizationSignatureSendingReviewUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'
import { Inject } from '@nestjs/common'
import {
  FORMALIZATION_PROVIDERS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class FormalizationSignatureSendingReviewResponseDto extends createZodDto(
  formalizationSignatureSendingReviewSchema,
) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationSignatureSendingReviewController {
  private readonly useCase: GetFormalizationSignatureSendingReviewUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_PROVIDERS.documentMetadataReader)
    metadataReader: FormalizationSignatureDocumentMetadataReader,
  ) {
    this.useCase = new GetFormalizationSignatureSendingReviewUseCase({
      formalizationsRepository,
      configurationRepository,
      sourceReader,
      metadataReader,
      requestsRepository,
    })
  }

  @Get(':formalizationId/signature-sending/review')
  @ApiResponse({
    status: 200,
    description: 'The signature sending review was returned successfully.',
    type: FormalizationSignatureSendingReviewResponseDto,
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
