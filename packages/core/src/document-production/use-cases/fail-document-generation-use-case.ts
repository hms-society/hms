import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentGeneration } from '../domain/entities'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
  InvalidDocumentGenerationResultError,
} from '../domain/errors'
import {
  DocumentGenerationStatus,
  type DocumentGenerationFinding,
} from '../domain/structures'
import type { DocumentGenerationsRepository } from '../interfaces'

type Request = {
  readonly documentGenerationId: string
  readonly attemptsCount: number
  readonly failureMessage: string
  readonly findings: readonly DocumentGenerationFinding[]
}

export class FailDocumentGenerationUseCase
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
    if (
      generation.status !== DocumentGenerationStatus.Pending &&
      generation.status !== DocumentGenerationStatus.Running
    ) {
      throw new DocumentGenerationConflictError(
        'Somente uma geração pendente ou em andamento pode falhar.',
      )
    }

    const failureMessage = request.failureMessage.trim()
    if (!failureMessage) {
      throw new InvalidDocumentGenerationResultError(
        'A mensagem final da falha é obrigatória.',
      )
    }
    this.assertAttemptsCount(request.attemptsCount)

    const now = this.datetimeProvider.now()
    const failed = await this.generationsRepository.replace(
      generation.id,
      {
        status: DocumentGenerationStatus.Failed,
        attemptsCount: request.attemptsCount,
        findings: request.findings,
        failureMessage,
        failedAt: now,
        updatedAt: now,
      },
      [DocumentGenerationStatus.Pending, DocumentGenerationStatus.Running],
    )

    if (!failed) throw new DocumentGenerationConflictError()

    return failed
  }

  private assertAttemptsCount(attemptsCount: number): void {
    if (!Number.isInteger(attemptsCount) || attemptsCount < 0 || attemptsCount > 3) {
      throw new InvalidDocumentGenerationResultError(
        'A quantidade de tentativas deve estar entre 0 e 3.',
      )
    }
  }
}
