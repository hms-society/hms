import type { Broker, DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { DocumentGenerationRequestedEvent } from '../../document-production/domain/events'
import { DocumentGenerationStatus } from '../../document-production/domain/structures'
import type { FormalizationDocumentSourceData } from '../domain/structures'
import {
  FormalizationDocumentStaleError,
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type { FormalizationsRepository, FormalizationSourceReader } from '../interfaces'
import type { FormalizationActor } from '../domain/structures'
import { FormalizationActorAuthorization } from './formalization-actor-authorization'
import { FormalizationDocumentGuard } from './formalization-document-guard'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly documentId: string
  readonly instructions?: string
}

export type FormalizationDocumentGeneration = {
  readonly documentGenerationId: string
  readonly documentId: string
}

export class GenerateFormalizationDocumentUseCase
  implements UseCase<Request, FormalizationDocumentGeneration>
{
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly sourceReader: FormalizationSourceReader,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly specificationsRepository: DocumentSpecificationsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly broker: Broker,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
  ) {}

  async execute(request: Request): Promise<FormalizationDocumentGeneration> {
    const formalization = await this.formalizationsRepository.findById(request.formalizationId)
    if (!formalization) throw new FormalizationNotFoundError()
    FormalizationActorAuthorization.assertAccess(formalization.assignedLawyerId, request)
    FormalizationDocumentGuard.assertWritable(formalization)
    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'formalization',
      formalizationId: formalization.id,
    })
    if (!documentPackage) throw new FormalizationStateConflictError('Selecione um documento antes de gerar uma versão.')
    const packageDocuments = await this.packageDocumentsRepository.findByDocumentPackageId(
      documentPackage.id,
    )
    const packageDocument = packageDocuments.find(
      (candidate) => candidate.documentId === request.documentId,
    )
    if (!packageDocument) throw new FormalizationStateConflictError('O documento não pertence à formalização.')
    const latestGeneration = await this.generationsRepository.findLatestByDocumentId(
      request.documentId,
    )
    if (
      latestGeneration?.status === DocumentGenerationStatus.Pending ||
      latestGeneration?.status === DocumentGenerationStatus.Running
    ) {
      throw new FormalizationStateConflictError('O documento já possui uma geração ativa.')
    }
    const specification = await this.specificationsRepository.findById(
      packageDocument.documentSpecificationId,
    )
    if (!specification) throw new FormalizationStateConflictError('O modelo do documento não foi encontrado.')
    const context = await this.sourceReader.findContext(formalization)
    if (!context) throw new FormalizationNotFoundError()
    const source = this.buildSource(formalization, context)
    if (source.formalization.contractFormRevision !== formalization.contractFormRevision) {
      throw new FormalizationDocumentStaleError()
    }
    const documentGenerationId = this.idProvider.generate()
    const now = this.datetimeProvider.now()
    await this.generationsRepository.addOrGet({
      id: documentGenerationId,
      documentId: request.documentId,
      documentSpecificationVersionId: packageDocument.documentSpecificationId,
      requestedByCollaboratorId: request.actorId,
      source: {
        type: 'formalization',
        id: formalization.id,
        data: source,
      },
      template: {
        name: specification.name,
        content: specification.content,
        variables: specification.variables,
      },
      status: DocumentGenerationStatus.Pending,
      attemptsCount: 0,
      findings: [],
    })
    await this.broker.publish(
      new DocumentGenerationRequestedEvent({
        documentGenerationId,
        documentId: request.documentId,
        documentSpecificationVersionId: packageDocument.documentSpecificationId,
        requestedByCollaboratorId: request.actorId,
        ...(request.instructions?.trim()
          ? { instructions: request.instructions.trim() }
          : {}),
        source: {
          type: 'formalization',
          id: formalization.id,
          data: source,
        },
        occurredAt: now,
      }),
    )
    return { documentGenerationId, documentId: request.documentId }
  }

  private buildSource(
    formalization: import('../domain/entities').Formalization,
    context: import('../interfaces').FormalizationContext,
  ): FormalizationDocumentSourceData {
    const source = {
      formalization: {
        id: formalization.id,
        contractFormRevision: formalization.contractFormRevision,
        contractFormSnapshot: formalization.contractFormSnapshot,
        contractFormAnswers: formalization.contractFormAnswers,
      },
      intake: {
        id: context.intake.id,
        sequenceNumber: context.intake.sequenceNumber,
        legalAreaId: context.intake.legalAreaId,
        legalTopicId: context.intake.legalTopicId,
        demandNotes: context.intake.demandNotes,
      },
      consultation: {
        id: context.consultation.id,
        primaryLegalQuestion: context.consultation.primaryLegalQuestion,
        guidanceProvided: context.consultation.guidanceProvided,
        relevantFacts: context.consultation.relevantFacts,
        potentialLegalRequests: context.consultation.potentialLegalRequests,
        identifiedRisks: context.consultation.identifiedRisks,
        suggestions: context.consultation.suggestions,
        dynamicFormSnapshot: context.consultation.dynamicFormSnapshot,
        dynamicFormAnswers: context.consultation.dynamicFormAnswers,
      },
      client:
        context.client.type === 'natural'
          ? {
              id: context.client.id,
              type: context.client.type,
              name: context.client.name,
              taxId: context.client.taxId,
              email: context.client.email,
              phone: context.client.phone,
              address: context.client.address,
            }
          : {
              id: context.client.id,
              type: context.client.type,
              legalName: context.client.legalName,
              tradeName: context.client.tradeName,
              taxId: context.client.taxId,
              email: context.client.email,
              phone: context.client.phone,
              address: context.client.address,
            },
      assignedLawyer: {
        id: context.assignedLawyer.id,
        professionalName: context.assignedLawyer.professionalName,
        jobTitle: context.assignedLawyer.jobTitle,
        profile: context.assignedLawyer.profile,
        legalExpertises: context.assignedLawyer.legalExpertises,
      },
    }
    return JSON.parse(JSON.stringify(source)) as FormalizationDocumentSourceData
  }
}
