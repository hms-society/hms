import { HttpStatus, Inject, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type {
  DocumentFileExporter,
  DocumentPdfConverter,
  DocumentPdfInspector,
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  FrozenDocumentPdfsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import {
  ConfirmCaseDocumentPackageAfterHomologationUseCase,
  FreezeApprovedDocumentVersionPdfUseCase,
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
import { IdProvider } from '@/shared/provision/id/id-provider'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class HomologateCaseDocumentVersionController {
  private readonly homologate: HomologateDocumentVersionUseCase
  private readonly generateArtifact: GenerateFinalDocumentArtifactUseCase
  private readonly confirmPackage: ConfirmCaseDocumentPackageAfterHomologationUseCase
  private readonly recordAudit: RecordDocumentVersionHomologationAuditUseCase
  private readonly datetimeProvider: ServerDatetimeProvider
  private readonly homologationsRepository: DocumentVersionHomologationsRepository
  private readonly documentPackagesRepository: DocumentPackagesRepository
  private readonly fileStorageProvider: FileStorageProvider
  private readonly freezePdf: FreezeApprovedDocumentVersionPdfUseCase

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
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.finalDocumentFileExporter)
    documentFileExporter: DocumentFileExporter,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    packageDocumentsRepository: PackageDocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specificationsRepository: DocumentSpecificationsRepository,
    datetimeProvider: ServerDatetimeProvider,
    auditEventWriter: DrizzleAuditLogsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.frozenDocumentPdfs)
    frozenPdfsRepository: FrozenDocumentPdfsRepository,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter)
    documentPdfConverter: DocumentPdfConverter,
    @Inject(DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector)
    documentPdfInspector: DocumentPdfInspector,
    idProvider: IdProvider,
  ) {
    this.datetimeProvider = datetimeProvider
    this.homologationsRepository = homologationsRepository
    this.documentPackagesRepository = documentPackagesRepository
    this.fileStorageProvider = fileStorageProvider
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
    this.freezePdf = new FreezeApprovedDocumentVersionPdfUseCase({
      documentsRepository,
      versionsRepository,
      specificationsRepository,
      frozenPdfsRepository,
      fileStorageProvider,
      converter: documentPdfConverter,
      inspector: documentPdfInspector,
      datetimeProvider,
      idProvider,
    })
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
    const initialPackage = await this.documentPackagesRepository.findByContext({
      type: 'case',
      caseId,
    })
    let homologation:
      | Awaited<ReturnType<HomologateDocumentVersionUseCase['execute']>>
      | undefined
    let artifact:
      | Awaited<ReturnType<GenerateFinalDocumentArtifactUseCase['execute']>>
      | undefined
    let documentPackage: Awaited<
      ReturnType<ConfirmCaseDocumentPackageAfterHomologationUseCase['execute']>
    >

    try {
      homologation = await this.homologate.execute({
        caseId,
        documentId,
        documentVersionId,
        approvedByCollaboratorId: collaborator.collaboratorId,
        approvedByCollaboratorName: collaborator.professionalName,
        approvedByCollaboratorProfile: collaborator.profile,
        approvedAt: this.datetimeProvider.now(),
      })
      artifact = await this.generateArtifact.execute({ documentVersionId })
      documentPackage = await this.confirmPackage.execute({
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
        approvedByCollaboratorName: homologation.approvedByCollaboratorName,
        approvedByCollaboratorProfile: homologation.approvedByCollaboratorProfile,
        approvedAt: homologation.approvedAt,
      })
      const packageDocument = documentPackage?.documents.find(
        (item) => item.documentId === documentId,
      )
      if (!packageDocument) {
        throw new Error('A peça homologada não está vinculada ao pacote documental.')
      }
      await this.freezePdf.execute({
        documentId,
        documentVersionId,
        documentSpecificationId: packageDocument.documentSpecificationId,
        traceId: documentVersionId,
      })

      return { homologation: artifact, documentPackage }
    } catch (error) {
      if (documentPackage?.confirmedAt && !initialPackage?.confirmedAt) {
        await this.documentPackagesRepository
          .reopen(documentPackage.id, this.datetimeProvider.now())
          .catch(() => undefined)
      }
      if (artifact?.artifactFileId) {
        await this.fileStorageProvider
          .remove(artifact.artifactFileId)
          .catch(() => undefined)
      }
      if (homologation) {
        await this.homologationsRepository.remove(homologation.id).catch(() => undefined)
      }
      throw error
    }
  }
}
