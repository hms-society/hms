import type { Broker, DatetimeProvider } from '../../shared/interfaces'
import type { DocumentGeneration } from '../../document-production/domain/entities'
import { DocumentGenerationCancelledEvent } from '../../document-production/domain/events'
import { DocumentGenerationStatus } from '../../document-production/domain/structures'
import type { DocumentGenerationsRepository } from '../../document-production/interfaces'
import {
  FormalizationAccessDeniedError,
  FormalizationNotFoundError,
  FormalizationStateConflictError,
} from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'
import type { FormalizationsRepository } from '../interfaces'
import { FormalizationUseCase } from './formalization-use-case'

type Request = FormalizationActor & {
  readonly formalizationId: string
  readonly generationId: string
}
export class CancelFormalizationDocumentGenerationUseCase extends FormalizationUseCase<
  Request,
  DocumentGeneration
> {
  constructor(
    private readonly formalizationsRepository: FormalizationsRepository,
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {
    super()
  }

  async execute(request: Request): Promise<DocumentGeneration> {
    const formalization = await this.formalizationsRepository.findById(
      request.formalizationId,
    )

    if (!formalization) throw new FormalizationNotFoundError()
    this.assertAccess(formalization.assignedLawyerId, request)
    this.assertWritable(formalization)
    const generation = await this.generationsRepository.findById(request.generationId)
    if (
      generation?.source.type !== 'formalization' ||
      generation?.source.id !== formalization.id
    ) {
      throw new FormalizationStateConflictError('A geração não pertence à formalização.')
    }
    if (
      generation.requestedByCollaboratorId !== request.actorId &&
      !this.isAdmin(request.actorProfile)
    ) {
      throw new FormalizationAccessDeniedError()
    }

    if (
      generation.status !== DocumentGenerationStatus.Pending &&
      generation.status !== DocumentGenerationStatus.Running
    ) {
      return generation
    }

    const now = this.datetimeProvider.now()
    const cancelled = await this.generationsRepository.replace(
      generation.id,
      {
        status: DocumentGenerationStatus.Cancelled,
        attemptsCount: generation.attemptsCount,
        findings: generation.findings,
        cancelledAt: now,
        updatedAt: now,
      },
      [DocumentGenerationStatus.Pending, DocumentGenerationStatus.Running],
    )
    if (!cancelled)
      throw new FormalizationStateConflictError('A geração já foi alterada.')
    await this.broker.publish(
      new DocumentGenerationCancelledEvent({
        documentGenerationId: generation.id,
        occurredAt: now,
      }),
    )
    return cancelled
  }
}
