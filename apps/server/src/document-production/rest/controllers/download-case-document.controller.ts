import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type {
  CaseAccessProvider,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import {
  DownloadCaseDocumentUseCase,
  GetCaseDocumentUseCase,
  ListCaseDocumentsUseCase,
} from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { StorageProvider } from '@hms/core/shared/interfaces'

import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'

@Controller('cases')
@ApiTags('Case Document Production')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class DownloadCaseDocumentController {
  private readonly useCase: DownloadCaseDocumentUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access) access: CaseAccessProvider,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generations: DocumentGenerationsRepository,
    @Inject(STORAGE_PROVIDER) storage: StorageProvider,
  ) {
    const listCaseDocuments = new ListCaseDocumentsUseCase(
      cases,
      access,
      packages,
      packageDocuments,
      documents,
      versions,
      generations,
    )
    const getCaseDocument = new GetCaseDocumentUseCase(listCaseDocuments)
    this.useCase = new DownloadCaseDocumentUseCase(getCaseDocument, storage)
  }

  @Get(':caseId/documents/:documentId/file')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'O arquivo do documento foi retornado com sucesso.',
  })
  async handle(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Query('versionId') versionId?: string,
  ) {
    const file = await this.useCase.execute({
      caseId,
      documentId,
      versionId,
      actorId: collaborator.collaboratorId,
    })
    return new StreamableFile(Buffer.from(file.content), { type: file.mimeType })
  }
}
