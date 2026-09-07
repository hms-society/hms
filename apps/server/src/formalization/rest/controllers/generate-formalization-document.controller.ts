import {
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { createZodDto, ZodValidationPipe } from 'nestjs-zod'
import { generateFormalizationDocumentSchema } from '@hms/validation/formalization'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { GenerateFormalizationDocumentUseCase } from '@hms/core/formalization/use-cases'
import type {
  FormalizationsRepository,
  FormalizationSourceReader,
} from '@hms/core/formalization/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { ServerFormalizationSourceReader } from '@/formalization/provision'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentGenerationResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { Inject } from '@nestjs/common'

class GenerateBody extends createZodDto(generateFormalizationDocumentSchema) {}

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GenerateFormalizationDocumentController {
  private readonly useCase: GenerateFormalizationDocumentUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader)
    sourceReader: FormalizationSourceReader,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generationsRepository: DocumentGenerationsRepository,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
    idProvider: IdProvider,
  ) {
    this.useCase = new GenerateFormalizationDocumentUseCase(
      formalizationsRepository,
      sourceReader,
      documentPackagesRepository,
      packageDocumentsRepository,
      specificationsRepository,
      generationsRepository,
      broker,
      datetimeProvider,
      idProvider,
    )
  }

  @Post(':formalizationId/documents/:documentId/generations')
  @HttpCode(HttpStatus.ACCEPTED)
  handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body(new ZodValidationPipe(generateFormalizationDocumentSchema)) body: GenerateBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        formalizationId,
        documentId,
        actorId: collaborator.collaboratorId,
        ...body,
        actorProfile: collaborator.profile,
      })
      .then(FormalizationDocumentGenerationResponseDto.fromDomain)
  }
}
