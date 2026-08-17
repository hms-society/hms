import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { Broker } from '#shared/interfaces/broker'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import { DocumentGenerationCancelledEvent } from '../domain/events'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
} from '../domain/errors'
import { DocumentGenerationStatus } from '../domain/structures'
import type { DocumentGenerationsRepository } from '../interfaces'

type Request = {
  readonly documentGenerationId: string
}

export class CancelDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  constructor(
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute({ documentGenerationId }: Request): Promise<DocumentGeneration> {
    const generation = await this.generationsRepository.findById(documentGenerationId)

    if (!generation) throw new DocumentGenerationNotFoundError()
    if (generation.status === DocumentGenerationStatus.Cancelled) {
      await this.publishCancellation(
        generation,
        generation.cancelledAt ?? this.datetimeProvider.now(),
      )
      return generation
    }
    if (
      generation.status !== DocumentGenerationStatus.Pending &&
      generation.status !== DocumentGenerationStatus.Running
    ) {
      throw new DocumentGenerationConflictError(
        'Somente uma geração pendente ou em andamento pode ser cancelada.',
      )
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

    if (!cancelled) throw new DocumentGenerationConflictError()

    await this.publishCancellation(cancelled, now)
    return cancelled
  }

  private publishCancellation(
    generation: DocumentGeneration,
    occurredAt: Date,
  ): Promise<void> {
    return this.broker.publish(
      new DocumentGenerationCancelledEvent({
        documentGenerationId: generation.id,
        occurredAt,
      }),
    )
  }
}
