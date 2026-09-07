import { Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { GetFormalizationDocumentSelectionUseCase } from '@hms/core/formalization/use-cases'
import { FormalizationStateConflictError } from '@hms/core/formalization/domain/errors'
import { FormalizationStatus } from '@hms/core/formalization/domain/structures'
import type {
  FormalizationsRepository,
  FormalizationSourceReader,
} from '@hms/core/formalization/interfaces'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { ServerFormalizationSourceReader } from '@/formalization/provision'
import { FormalizationsController } from '@/formalization/decorators'
import { FormalizationDocumentSelectionResponseDto } from '@/formalization/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { Inject } from '@nestjs/common'

@FormalizationsController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetFormalizationDocumentSelectionController {
  private readonly useCase: GetFormalizationDocumentSelectionUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    private readonly formalizationsRepository: FormalizationsRepository,
    @Inject(ServerFormalizationSourceReader)
    sourceReader: FormalizationSourceReader,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
  ) {
    this.useCase = new GetFormalizationDocumentSelectionUseCase(
      formalizationsRepository,
      sourceReader,
      specificationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
    )
  }

  private async assertDocumentOperationAllowed(formalizationId: string) {
    const formalization = await this.formalizationsRepository.findById(formalizationId)
    if (formalization?.status === FormalizationStatus.Cancelled) {
      throw new FormalizationStateConflictError(
        'A formalização cancelada não pode operar documentos.',
      )
    }
    return formalization
  }

  @Get(':formalizationId/documents/selection')
  async handle(
    @Param('formalizationId', new ParseUUIDPipe()) formalizationId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const formalization = await this.assertDocumentOperationAllowed(formalizationId)
    const selection = await this.useCase.execute({
      formalizationId,
      actorId: collaborator.collaboratorId,
      actorProfile: collaborator.profile,
    })
    return FormalizationDocumentSelectionResponseDto.fromDomain({
      ...selection,
      confirmedAt: formalization?.documentsConfirmedAt,
      confirmedByCollaboratorId: formalization?.documentsConfirmedByCollaboratorId,
    })
  }
}
