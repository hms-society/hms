import type { Broker, DatetimeProvider, UseCase } from '#shared/interfaces'

import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { CancelDocumentGenerationUseCase } from '../../document-production/use-cases'
import type { DocumentGeneration } from '../../document-production/domain/entities'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationDocumentNotFoundError,
  ConsultationNotFoundError,
} from '../domain/errors'
import type { Consultation } from '../domain/entities'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly documentId: string
  readonly requestedByCollaboratorId: string
  readonly requestedByCollaboratorProfile: CollaboratorProfileValue
}

export class CancelConsultationDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  private readonly cancelGenerationUseCase: CancelDocumentGenerationUseCase

  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
    broker: Broker,
  ) {
    this.cancelGenerationUseCase = new CancelDocumentGenerationUseCase(
      generationsRepository,
      datetimeProvider,
      broker,
    )
  }

  async execute(request: Request): Promise<DocumentGeneration> {
    const consultation = await this.loadConsultation(request)
    const packageDocument = await this.findPackageDocument(
      consultation.id,
      request.documentId,
    )
    const generation = await this.generationsRepository.findLatestByDocumentId(
      packageDocument.documentId,
    )

    if (!generation) {
      throw new ConsultationDocumentNotFoundError()
    }

    return this.cancelGenerationUseCase.execute({
      documentGenerationId: generation.id,
    })
  }

  private async loadConsultation(request: Request): Promise<Consultation> {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.requestedByCollaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.requestedByCollaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }
    return consultation
  }

  private async findPackageDocument(consultationId: string, documentId: string) {
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId,
    })
    if (!documentPackage) throw new ConsultationDocumentNotFoundError()

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    const packageDocument = packageDocuments.find(
      (candidate) => candidate.documentId === documentId,
    )
    if (!packageDocument) throw new ConsultationDocumentNotFoundError()

    return packageDocument
  }
}
