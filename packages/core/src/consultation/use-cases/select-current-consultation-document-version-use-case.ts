import type { UseCase } from '#shared/interfaces/use-case'

import type { Document } from '../../document-production/domain/entities'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import { DocumentVersionNotApprovedError } from '../../document-production/domain/errors'
import { DocumentVersionStatus } from '../../document-production/domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationDocumentNotFoundError,
  ConsultationNotFoundError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly documentId: string
  readonly documentVersionId: string
  readonly selectedByCollaboratorId: string
  readonly selectedByCollaboratorProfile: CollaboratorProfileValue
}

export class SelectCurrentConsultationDocumentVersionUseCase
  implements UseCase<Request, Document>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<Document> {
    await this.assertDocumentAccess(request)
    const version = await this.versionsRepository.findById(request.documentVersionId)
    if (!version || version.documentId !== request.documentId) {
      throw new ConsultationDocumentNotFoundError()
    }
    if (version.status !== DocumentVersionStatus.Approved) {
      throw new DocumentVersionNotApprovedError()
    }
    const document = await this.documentsRepository.replace(request.documentId, {
      currentVersionId: version.id,
    })
    if (!document) throw new ConsultationDocumentNotFoundError()
    return document
  }

  private async assertDocumentAccess(request: Request): Promise<void> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.selectedByCollaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.selectedByCollaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    if (!documentPackage) throw new ConsultationDocumentNotFoundError()
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (!packageDocuments.some(({ documentId }) => documentId === request.documentId)) {
      throw new ConsultationDocumentNotFoundError()
    }
  }
}
