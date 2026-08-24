import type { Broker, DatetimeProvider, IdProvider, UseCase } from '#shared/interfaces'
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
import { DocumentBatchGenerationRequestedEvent } from '../../document-production/domain/events'
import type { DocumentGenerationSource } from '../../document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'

import type { Consultation } from '../domain/entities'
import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
  ConsultationPackageConfirmationError,
} from '../domain/errors'
import type { ConsultationDocumentGeneration } from '../domain/structures'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly requestedByCollaboratorId: string
  readonly requestedByCollaboratorProfile: CollaboratorProfileValue
}

export class GenerateConsultationDocumentsUseCase
  implements UseCase<Request, readonly ConsultationDocumentGeneration[]>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly intakesRepository: IntakesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly legalExpertiseCatalogProvider: LegalExpertiseCatalogProvider,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly versionsRepository: DocumentVersionsRepository,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {}

  async execute(request: Request): Promise<readonly ConsultationDocumentGeneration[]> {
    const { consultation, intake, client, legalContext } = await this.loadContext(request)
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: consultation.id,
    })
    if (!documentPackage) return []
    if (documentPackage.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos já foi confirmado e precisa ser reaberto antes de gerar novas versões.',
      )
    }

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    const eligibleDocuments = (
      await Promise.all(
        packageDocuments.map(async (packageDocument) => {
          const [latestGeneration, latestVersion] = await Promise.all([
            this.generationsRepository.findLatestByDocumentId(packageDocument.documentId),
            this.versionsRepository.findLatestByDocumentId(packageDocument.documentId),
          ])
          return latestGeneration || latestVersion ? undefined : packageDocument
        }),
      )
    ).filter((document) => document !== undefined)

    if (eligibleDocuments.length === 0) return []

    const documents = eligibleDocuments.map((packageDocument) => ({
      documentGenerationId: this.idProvider.generate(),
      documentId: packageDocument.documentId,
      documentSpecificationVersionId: packageDocument.documentSpecificationId,
    }))
    await this.broker.publish(
      new DocumentBatchGenerationRequestedEvent({
        documents,
        requestedByCollaboratorId: request.requestedByCollaboratorId,
        source: this.buildGenerationSource(consultation, intake, client, legalContext),
        occurredAt: this.datetimeProvider.now(),
      }),
    )

    return documents.map(({ documentGenerationId, documentId }) => ({
      documentGenerationId,
      documentId,
    }))
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
}
