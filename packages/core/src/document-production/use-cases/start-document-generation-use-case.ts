import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
} from '../domain/errors'
import { DocumentGenerationStatus } from '../domain/structures'
import type { DocumentGenerationsRepository } from '../interfaces'

type Request = {
  readonly documentGenerationId: string
}

export class StartDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  constructor(
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute({ documentGenerationId }: Request): Promise<DocumentGeneration> {
    const generation = await this.generationsRepository.findById(documentGenerationId)

    if (!generation) throw new DocumentGenerationNotFoundError()
    if (generation.status === DocumentGenerationStatus.Running) return generation
    if (generation.status !== DocumentGenerationStatus.Pending) {
      throw new DocumentGenerationConflictError(
        'Somente uma geração pendente pode ser iniciada.',
      )
    }

    const now = this.datetimeProvider.now()
    const started = await this.generationsRepository.replace(
      generation.id,
      {
        status: DocumentGenerationStatus.Running,
        attemptsCount: 0,
        findings: [],
        startedAt: now,
        updatedAt: now,
      },
      [DocumentGenerationStatus.Pending],
    )

    if (!started) throw new DocumentGenerationConflictError()

    return started
  }
}
