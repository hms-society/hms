import { Body, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { confirmFormalizationContractingSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ConfirmFormalizationContractingUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationContractingTransaction,
} from '@hms/core/formalization/interfaces'
import type { DatetimeProvider } from '@hms/core/shared/interfaces'
import { Inject } from '@nestjs/common'
import {
  FORMALIZATION_PROVIDERS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

class ConfirmFormalizationContractingBody extends createZodDto(
  confirmFormalizationContractingSchema,
) {}
type RequestBody = Parameters<ConfirmFormalizationContractingUseCase['execute']>[0]

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ConfirmFormalizationContractingController {
  private readonly useCase: ConfirmFormalizationContractingUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureArtifacts)
    artifactsRepository: FormalizationSignatureArtifactsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_PROVIDERS.contractingTransaction)
    transaction: FormalizationContractingTransaction,
    @Inject(ServerDatetimeProvider) datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ConfirmFormalizationContractingUseCase({
      formalizationsRepository,
      requestsRepository,
      documentsRepository,
      recipientsRepository,
      artifactsRepository,
      protocolsRepository,
      transaction,
      datetimeProvider,
    })
  }

  @Post(':formalizationId/contracting/confirm')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The Formalization was contracted successfully.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(confirmFormalizationContractingSchema))
    body: ConfirmFormalizationContractingBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...(body as RequestBody),
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
  }
}
