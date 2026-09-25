import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { SaveManualLegalCaseDocumentVersionUseCase } from '@hms/core/case-management/use-cases'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { saveManualDocumentVersionSchema } from '@hms/validation/document-production'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class SaveManualCaseDocumentVersionController {
  private readonly useCase: SaveManualLegalCaseDocumentVersionUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter)
    exporter: DocumentFileExporter,
    @Inject(PROVISION_PROVIDERS.fileStorage) storage: FileStorageProvider,
    datetime: DatetimeProvider,
    ids: IdProvider,
  ) {
    this.useCase = new SaveManualLegalCaseDocumentVersionUseCase(
      cases,
      packages,
      packageDocuments,
      documents,
      versions,
      exporter,
      storage,
      datetime,
      ids,
    )
  }

  @Post(':caseId/documents/:documentId/versions/:sourceDocumentVersionId/manual')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Nova versão manual criada' })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('sourceDocumentVersionId', new ParseUUIDPipe())
    sourceDocumentVersionId: string,
    @Body(new ZodValidationPipe(saveManualDocumentVersionSchema))
    body: { content: DocumentTemplateContent },
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      documentId,
      sourceDocumentVersionId,
      content: body.content,
      createdByCollaboratorId: collaborator.collaboratorId,
      createdByCollaboratorProfile: collaborator.profile,
    })
  }
}
