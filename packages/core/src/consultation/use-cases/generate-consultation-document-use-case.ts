import type { UseCase } from '#shared/interfaces/use-case'
import type { Broker, DatetimeProvider, IdProvider } from '#shared/interfaces'
import type { Intake } from '../../intake/domain/entities'
import type { IntakesRepository } from '../../intake/interfaces'
import type { Client } from '../../identity/domain/entities'
import type { ClientsRepository } from '../../identity/interfaces'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import type {
  LegalExpertiseCatalogProvider,
  LegalExpertiseCatalogResolution,
} from '../../legal-catalog/interfaces'
import { DocumentGenerationRequestedEvent } from '../../document-production/domain/events'
import {
  DocumentGenerationStatus,
  type DocumentGenerationSource,
} from '../../document-production/domain/structures'
import { DocumentGenerationConflictError } from '../../document-production/domain/errors'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'

import type { Consultation } from '../domain/entities'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationDocumentNotFoundError,
  ConsultationPackageConfirmationError,
  InvalidConsultationDocumentGenerationInstructionsError,
  ConsultationNotFoundError,
} from '../domain/errors'
import type { ConsultationDocumentGeneration } from '../domain/structures'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly documentId: string
  readonly instructions?: string
  readonly requestedByCollaboratorId: string
  readonly requestedByCollaboratorProfile: CollaboratorProfileValue
}

export class GenerateConsultationDocumentUseCase
  implements UseCase<Request, ConsultationDocumentGeneration>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly intakesRepository: IntakesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {}

  async execute(request: Request): Promise<ConsultationDocumentGeneration> {
    const instructions = request.instructions?.trim()
    if (request.instructions !== undefined && !instructions) {
      throw new InvalidConsultationDocumentGenerationInstructionsError()
    }
    const { consultation, intake, client, legalContext } = await this.loadContext(request)
    const packageDocument = await this.findPackageDocument(
      consultation.id,
      request.documentId,
    )
    const latestGeneration = await this.generationsRepository.findLatestByDocumentId(
      request.documentId,
    )

    if (
      latestGeneration?.status === DocumentGenerationStatus.Pending ||
      latestGeneration?.status === DocumentGenerationStatus.Running
    ) {
      throw new DocumentGenerationConflictError(
        'O documento já possui uma geração ativa.',
      )
    }

    const documentGenerationId = this.idProvider.generate()
    const event = new DocumentGenerationRequestedEvent({
      documentGenerationId,
      documentId: request.documentId,
      documentSpecificationVersionId: packageDocument.documentSpecificationId,
      requestedByCollaboratorId: request.requestedByCollaboratorId,
      ...(instructions ? { instructions } : {}),
      source: this.buildGenerationSource(consultation, intake, client, legalContext),
      occurredAt: this.datetimeProvider.now(),
    })

    await this.broker.publish(event)

    return { documentGenerationId, documentId: request.documentId }
  }

  private async loadContext(request: Request): Promise<{
    consultation: Consultation
    intake: Intake
    client: Client
    legalContext?: LegalExpertiseCatalogResolution
  }> {
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

    const [intake, client, legalContexts] = await Promise.all([
      this.intakesRepository.findById(consultation.intakeId),
      this.clientsRepository.findById(consultation.clientId),
      consultation.legalAreaId && consultation.legalTopicId
        ? this.legalExpertiseCatalogProvider.resolve([
            {
              legalAreaId: consultation.legalAreaId,
              legalTopicIds: [consultation.legalTopicId],
            },
          ])
        : Promise.resolve([]),
    ])
    if (!intake) throw new ConsultationNotFoundError()
    if (!client) throw new ConsultationNotFoundError()
    const legalContext = legalContexts[0]

    return { consultation, intake, client, legalContext }
  }

  private buildGenerationSource(
    consultation: Consultation,
    intake: Intake,
    client: Client,
    legalContext?: LegalExpertiseCatalogResolution,
  ): DocumentGenerationSource {
    const legalTopic = legalContext?.legalTopics[0]

    return {
      type: 'consultation',
      id: consultation.id,
      data: {
        consultation,
        intake,
        client: {
          id: client.id,
          type: client.type,
          name: client.type === 'natural' ? client.name : client.legalName,
          taxId: client.taxId,
          email: client.email,
          phone: client.phone,
          address: client.address,
        },
        ...(legalContext && legalTopic
          ? {
              legalContext: {
                area: legalContext.legalArea,
                topic: legalTopic,
              },
            }
          : {}),
      },
    }
  }

  private async findPackageDocument(consultationId: string, documentId: string) {
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId,
    })
    if (!documentPackage) throw new ConsultationDocumentNotFoundError()
    if (documentPackage.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos já foi confirmado e precisa ser reaberto antes de gerar uma nova versão.',
      )
    }

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    const packageDocument = packageDocuments.find(
      (candidate) => candidate.documentId === documentId,
    )
    if (!packageDocument) throw new ConsultationDocumentNotFoundError()

    return packageDocument
  }
}
