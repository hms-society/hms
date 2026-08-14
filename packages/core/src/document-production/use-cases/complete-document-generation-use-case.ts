import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
  InvalidDocumentGenerationResultError,
} from '../domain/errors'
import { DocumentGenerationStatus } from '../domain/structures'
import type { DocumentGenerationsRepository } from '../interfaces'

type Request = {
  readonly documentGenerationId: string
  readonly documentVersionId: string
  readonly attemptsCount: number
}

export class CompleteDocumentGenerationUseCase
  implements UseCase<Request, DocumentGeneration>
{
  constructor(
    private readonly generationsRepository: DocumentGenerationsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<DocumentGeneration> {
    const generation = await this.generationsRepository.findById(
      request.documentGenerationId,
    )

    if (!generation) throw new DocumentGenerationNotFoundError()
    if (generation.status !== DocumentGenerationStatus.Running) {
      throw new DocumentGenerationConflictError(
        'Somente uma geração em andamento pode ser concluída.',
      )
    }

    const documentVersionId = request.documentVersionId.trim()
    if (!documentVersionId) {
      throw new InvalidDocumentGenerationResultError(
        'A versão documental gerada é obrigatória.',
      )
    }
    this.assertAttemptsCount(request.attemptsCount)

    const now = this.datetimeProvider.now()
    const completed = await this.generationsRepository.replace(
      generation.id,
      {
        status: DocumentGenerationStatus.Completed,
        attemptsCount: request.attemptsCount,
        findings: [],
        documentVersionId,
        completedAt: now,
        updatedAt: now,
      },
      [DocumentGenerationStatus.Running],
    )

    if (!completed) throw new DocumentGenerationConflictError()

    return completed
  }

  private assertAttemptsCount(attemptsCount: number): void {
    if (!Number.isInteger(attemptsCount) || attemptsCount < 1 || attemptsCount > 3) {
      throw new InvalidDocumentGenerationResultError(
        'A quantidade de tentativas deve estar entre 1 e 3.',
      )
    }
  }
}
