import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type {
  LegalCasesRepository,
  CaseAccessProvider,
} from '@hms/core/case-management/interfaces'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import { ListCaseDocumentsUseCase } from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { CurrentCollaborator } from '@/identity/decorators'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CaseDocumentResponseDto } from '@/document-production/rest/dtos'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

@Controller('cases')
@ApiTags('Case Document Production')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseDocumentsController {
  private readonly useCase: ListCaseDocumentsUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versions: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    generations: DocumentGenerationsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access) caseAccessProvider: CaseAccessProvider,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    private readonly collaborators: CollaboratorsRepository,
  ) {
    this.useCase = new ListCaseDocumentsUseCase(
      cases,
      caseAccessProvider,
      packages,
      packageDocuments,
      documents,
      versions,
      generations,
    )
  }

  @Get(':caseId/documents')
  @ApiResponse({ status: HttpStatus.OK, type: [CaseDocumentResponseDto] })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({ caseId, actorId: collaborator.collaboratorId })
      .then(async (documents) => {
        const collaboratorIds = [
          ...new Set(
            documents.flatMap(({ versions }) =>
              versions.flatMap((version) => [
                version.createdByCollaboratorId,
                ...(version.reviewedByCollaboratorId
                  ? [version.reviewedByCollaboratorId]
                  : []),
              ]),
            ),
          ),
        ]
        const summaries = await Promise.all(
          collaboratorIds.map((id) => this.collaborators.findSummaryById(id)),
        )
        const names = new Map(
          summaries.flatMap((summary) =>
            summary ? [[summary.collaboratorId, summary.professionalName] as const] : [],
          ),
        )
        return documents.map((document) =>
          CaseDocumentResponseDto.fromDomain({ ...document, collaboratorNames: names }),
        )
      })
  }

  @Get(':caseId/documents/:documentId')
  @ApiResponse({ status: HttpStatus.OK, type: CaseDocumentResponseDto })
  async handleDocument(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const document = (
      await this.useCase.execute({
        caseId,
        actorId: collaborator.collaboratorId,
      })
    ).find(({ document: item }) => item.id === documentId)
    if (!document) return undefined
    const collaboratorIds = [
      ...new Set(
        document.versions.flatMap((version) => [
          version.createdByCollaboratorId,
          ...(version.reviewedByCollaboratorId ? [version.reviewedByCollaboratorId] : []),
        ]),
      ),
    ]
    const summaries = await Promise.all(
      collaboratorIds.map((id) => this.collaborators.findSummaryById(id)),
    )
    const names = new Map(
      summaries.flatMap((summary) =>
        summary ? [[summary.collaboratorId, summary.professionalName] as const] : [],
      ),
    )
    return CaseDocumentResponseDto.fromDomain({ ...document, collaboratorNames: names })
  }
}
