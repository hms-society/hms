import type { UseCase } from '#shared/interfaces/use-case'

import type { Document, DocumentVersion } from '../../document-production/domain/entities'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
} from '../domain/errors'
import type { DocumentGenerationStatus } from '../../document-production/domain/structures'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

type Response = readonly {
  readonly document: Document
  readonly generationStatus?: DocumentGenerationStatus
  readonly versions: readonly DocumentVersion[]
}[]

export class ListConsultationDocumentsUseCase implements UseCase<Request, Response> {
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
  ) {}

  async execute(request: Request): Promise<Response> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.collaboratorId
    ) {
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
    const [documents, versions, generations] = await Promise.all([
      this.documentsRepository.findByIds(documentIds),
      this.versionsRepository.findByDocumentIds(documentIds),
      this.generationsRepository.findLatestByDocumentIds(documentIds),
    ])
    const documentsById = new Map(documents.map((document) => [document.id, document]))
    const generationsByDocumentId = new Map(
      generations.map((generation) => [generation.documentId, generation]),
    )

    return packageDocuments.flatMap(({ documentId }) => {
      const document = documentsById.get(documentId)
      if (!document) return []
      const generation = generationsByDocumentId.get(documentId)
      return [
        {
          document,
          ...(generation ? { generationStatus: generation.status } : {}),
          versions: versions.filter((version) => version.documentId === documentId),
        },
      ]
    })
  }
}
