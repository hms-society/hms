import { Controller, Get, HttpStatus, Inject, Logger, NotFoundException, Param, ParseUUIDPipe, StreamableFile, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import type { DocumentPackagesRepository, DocumentsRepository, DocumentVersionsRepository, PackageDocumentsRepository } from '@hms/core/document-production/interfaces'
import { ListCaseDocumentsUseCase } from '@hms/core/document-production/use-cases'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CaseDocumentResponseDto } from '@/document-production/rest/dtos'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'

@Controller('cases')
@ApiTags('Case Document Production')
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseDocumentsController {
  private readonly logger = new Logger(ListCaseDocumentsController.name)
  private readonly useCase: ListCaseDocumentsUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages) packages: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments) packageDocuments: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents) documents: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions) versions: DocumentVersionsRepository,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {
    this.useCase = new ListCaseDocumentsUseCase(cases, packages, packageDocuments, documents, versions)
  }

  @Get(':caseId/documents/:documentId/file')
  @ApiResponse({ status: HttpStatus.OK, description: 'Arquivo da peça documental' })
  async handleFile(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
  ) {
    this.logger.log(`Solicitando arquivo da peça ${documentId} do caso ${caseId}`)
    const item = (await this.useCase.execute({ caseId })).find(
      ({ document }) => document.id === documentId,
    )
    const version = item?.versions.find(({ id }) => id === item.document.currentVersionId) ?? item?.versions.at(-1)
    if (!version?.storagePath) {
      this.logger.warn(`Versão ${version?.id ?? 'inexistente'} sem storagePath para peça ${documentId}`)
      throw new NotFoundException('O arquivo desta versão ainda não está associado ao Storage.')
    }

    this.logger.log(`Baixando ${version.storagePath}`)
    const content = await this.storageProvider.download(version.storagePath)
    this.logger.log(`Arquivo lido do Storage (${content.byteLength} bytes)`)
    const mimeType = version.storagePath.endsWith('.pdf')
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    return new StreamableFile(Buffer.from(content), { type: mimeType })
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
