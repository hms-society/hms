import { Controller, Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import type { DocumentPackagesRepository, DocumentsRepository, DocumentVersionsRepository, PackageDocumentsRepository } from '@hms/core/document-production/interfaces'
import { ListCaseDocumentsUseCase } from '@hms/core/document-production/use-cases'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CaseDocumentResponseDto } from '@/document-production/rest/dtos'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'

@Controller('cases')
@ApiTags('Case Document Production')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseDocumentsController {
  private readonly useCase: ListCaseDocumentsUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages) packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments) packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions) versions: DocumentVersionsRepository,
  ) {
    this.useCase = new ListCaseDocumentsUseCase(cases, packages, packageDocuments, documents, versions)
  }

  @Get(':caseId/documents')
  @ApiResponse({ status: HttpStatus.OK, type: [CaseDocumentResponseDto] })
  handle(@Param('caseId', new ParseUUIDPipe()) caseId: string) {
    return this.useCase.execute({ caseId }).then((documents) => documents.map(CaseDocumentResponseDto.fromDomain))
  }

  @Get(':caseId/documents/:documentId')
  @ApiResponse({ status: HttpStatus.OK, type: CaseDocumentResponseDto })
  async handleDocument(@Param('caseId', new ParseUUIDPipe()) caseId: string, @Param('documentId', new ParseUUIDPipe()) documentId: string) {
    const document = (await this.useCase.execute({ caseId })).find(({ document: item }) => item.id === documentId)
    return document ? CaseDocumentResponseDto.fromDomain(document) : undefined
  }
}
