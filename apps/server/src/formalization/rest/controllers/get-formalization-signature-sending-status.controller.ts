import { Get, HttpStatus, Param, ParseUUIDPipe, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { GetFormalizationSignatureSendingStatusUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'
import { Inject } from '@nestjs/common'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

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
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    recipientDocumentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureArtifacts)
    artifactsRepository: FormalizationSignatureArtifactsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
  ) {
    this.useCase = new GetFormalizationSignatureSendingStatusUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository: requestDocumentsRepository,
      configurationRepository,
      recipientsRepository,
      recipientDocumentsRepository,
      invitationsRepository,
      artifactsRepository,
      protocolsRepository,
      sourceReader,
    })
  }

  @Get(':formalizationId/signature-sending/status')
  @ApiResponse({
    status: 200,
    description: 'The signature sending status was returned successfully.',
    type: Object,
  })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  @ApiResponse({ status: 403, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Res() response: Response,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        actorId: collaborator.collaboratorId,
        actorProfile: collaborator.profile,
      })
      .then((result) => response.status(HttpStatus.OK).json(result))
  }
}
