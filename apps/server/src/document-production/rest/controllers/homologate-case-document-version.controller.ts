import { HttpStatus, Inject, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import {
  ConfirmCaseDocumentPackageAfterHomologationUseCase,
  GenerateFinalDocumentArtifactUseCase,
  HomologateDocumentVersionUseCase,
  RecordDocumentVersionHomologationAuditUseCase,
} from '@hms/core/document-production/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { DOCUMENT_PRODUCTION_PROVIDERS } from '@/document-production/constants/document-production-providers'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DrizzleAuditLogsRepository } from '@/shared/database/drizzle/repositories/drizzle-audit-logs-repository'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider as ServerDatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class HomologateCaseDocumentVersionController {
  private readonly homologate: HomologateDocumentVersionUseCase
  private readonly generateArtifact: GenerateFinalDocumentArtifactUseCase
  private readonly confirmPackage: ConfirmCaseDocumentPackageAfterHomologationUseCase
  private readonly recordAudit: RecordDocumentVersionHomologationAuditUseCase
  private readonly datetimeProvider: ServerDatetimeProvider

  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    versionsRepository: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versionHomologations)
    homologationsRepository: DocumentVersionHomologationsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter)
    documentFileExporter: DocumentFileExporter,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    datetimeProvider: ServerDatetimeProvider,
    auditEventWriter: DrizzleAuditLogsRepository,
  ) {
    this.datetimeProvider = datetimeProvider
    this.homologate = new HomologateDocumentVersionUseCase(
      versionsRepository,
      homologationsRepository,
      legalCasesRepository,
      caseMembersRepository,
      documentPackagesRepository,
    )
    this.generateArtifact = new GenerateFinalDocumentArtifactUseCase(
      versionsRepository,
      documentsRepository,
      homologationsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
    )
    this.confirmPackage = new ConfirmCaseDocumentPackageAfterHomologationUseCase(
      documentPackagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      homologationsRepository,
      datetimeProvider,
    )
    this.recordAudit = new RecordDocumentVersionHomologationAuditUseCase(
      auditEventWriter,
      datetimeProvider,
    )
  }

  @Post(':caseId/documents/:documentId/versions/:versionId/homologate')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Versão documental homologada.',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Param('versionId', new ParseUUIDPipe()) documentVersionId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const homologation = await this.homologate.execute({
      caseId,
      documentId,
      documentVersionId,
      approvedByCollaboratorId: collaborator.collaboratorId,
      approvedByCollaboratorName: collaborator.professionalName,
      approvedByCollaboratorProfile: collaborator.profile,
      approvedAt: this.datetimeProvider.now(),
    })
    const artifact = await this.generateArtifact.execute({ documentVersionId })
    const documentPackage = await this.confirmPackage.execute({
      caseId,
      documentVersionId,
      collaboratorId: collaborator.collaboratorId,
    })
    await this.recordAudit.execute({
      caseId,
      documentId,
      documentVersionId,
      homologationId: homologation.id,
      collaboratorId: collaborator.collaboratorId,
      collaboratorProfile: collaborator.profile,
    })

    return { homologation: artifact, documentPackage }
  }
}
