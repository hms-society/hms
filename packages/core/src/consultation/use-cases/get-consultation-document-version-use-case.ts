import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentVersion } from '../../document-production/domain/entities'
import type {
  DocumentPackagesRepository,
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
  readonly collaboratorId: string
}

export class GetConsultationDocumentVersionUseCase
  implements UseCase<Request, DocumentVersion>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<DocumentVersion> {
    await this.assertDocumentAccess(request)
    const version = await this.versionsRepository.findById(request.documentVersionId)
    if (!version || version.documentId !== request.documentId) {
      throw new ConsultationDocumentNotFoundError()
    }
    return version
  }

  private async assertDocumentAccess(request: Request): Promise<void> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (consultation.assignedLawyerId !== request.collaboratorId) {
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
