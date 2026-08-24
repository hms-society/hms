import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentVersion } from '../../document-production/domain/entities'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import { DocumentVersionConflictError } from '../../document-production/domain/errors'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  DocumentVersionStatus,
  type DocumentVersionStatus as DocumentVersionStatusType,
} from '../../document-production/domain/structures'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationDocumentNotFoundError,
  ConsultationNotFoundError,
  ConsultationPackageConfirmationError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly documentId: string
  readonly documentVersionId: string
  readonly reviewedByCollaboratorId: string
  readonly reviewedByCollaboratorProfile: CollaboratorProfileValue
  readonly decision: Extract<DocumentVersionStatusType, 'approved' | 'rejected'>
  readonly rejectionReason?: string
}

export class ReviewConsultationDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.reviewedByCollaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.reviewedByCollaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }

    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    if (!documentPackage) throw new ConsultationDocumentNotFoundError()
    if (documentPackage.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos já foi confirmado e precisa ser reaberto antes de revisar uma versão.',
      )
    }
    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (!packageDocuments.some((item) => item.documentId === request.documentId)) {
      throw new ConsultationDocumentNotFoundError()
    }

    const version = await this.versionsRepository.findById(request.documentVersionId)
    if (!version || version.documentId !== request.documentId) {
      throw new ConsultationDocumentNotFoundError()
    }

    const reviewed = await this.versionsRepository.review(
      version.id,
      request.decision,
      request.reviewedByCollaboratorId,
      this.datetimeProvider.now(),
      request.decision === DocumentVersionStatus.Rejected
        ? request.rejectionReason
        : undefined,
    )
    if (!reviewed) throw new DocumentVersionConflictError()
    return reviewed
  }
}
