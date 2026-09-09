import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { confirmFormalizationDocumentsSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ConfirmFormalizationDocumentsUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationDocumentConfirmationTransaction,
  FormalizationsRepository,
  FormalizationSignatureConfigurationRepository,
} from '@hms/core/formalization/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
  DocumentVersionsRepository,
} from '@hms/core/document-production/interfaces'

import {
  FORMALIZATION_PROVIDERS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { FormalizationsController } from '@/formalization/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { Inject } from '@nestjs/common'

class ConfirmBody extends createZodDto(confirmFormalizationDocumentsSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ConfirmFormalizationDocumentsController {
  private readonly useCase: ConfirmFormalizationDocumentsUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
    @Inject(FORMALIZATION_PROVIDERS.documentConfirmationTransaction)
    confirmationTransaction: FormalizationDocumentConfirmationTransaction,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    signatureConfigurationRepository: FormalizationSignatureConfigurationRepository,
    broker: InngestBroker,
  ) {
    this.useCase = new ConfirmFormalizationDocumentsUseCase(
      formalizationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      generationsRepository,
      datetimeProvider,
      documentsRepository,
      confirmationTransaction,
      signatureConfigurationRepository,
      broker,
    )
  }

  @Patch(':formalizationId/documents/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The document package was confirmed.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Body(new ZodValidationPipe(confirmFormalizationDocumentsSchema)) body: ConfirmBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        actorId: collaborator.collaboratorId,
        ...body,
        actorProfile: collaborator.profile,
      })
      .then((formalization) => ({ ...formalization }))
  }
}
