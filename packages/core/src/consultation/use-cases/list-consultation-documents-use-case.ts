import type { UseCase } from '#shared/interfaces/use-case'

import type { Document, DocumentVersion } from '../../document-production/domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
}

type Response = readonly {
  readonly document: Document
  readonly versions: readonly DocumentVersion[]
}[]

export class ListConsultationDocumentsUseCase implements UseCase<Request, Response> {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
  ) {}

  async execute(request: Request): Promise<Response> {
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
    if (!documentPackage) return []

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    const documentIds = packageDocuments.map(({ documentId }) => documentId)
    const [documents, versions] = await Promise.all([
      this.documentsRepository.findByIds(documentIds),
      this.versionsRepository.findByDocumentIds(documentIds),
    ])
    const documentsById = new Map(documents.map((document) => [document.id, document]))

    return packageDocuments.flatMap(({ documentId }) => {
      const document = documentsById.get(documentId)
      if (!document) return []
      return [
        {
          document,
          versions: versions.filter((version) => version.documentId === documentId),
        },
      ]
    })
  }
}
