import type { Broker, DatetimeProvider, UseCase } from '#shared/interfaces'

import type { DocumentGeneration } from '../domain/entities'
import type { DocumentGenerationsRepository } from '../interfaces'
import { CancelDocumentGenerationUseCase } from './cancel-document-generation-use-case'

type Request = {
  readonly documentGenerationIds: readonly string[]
}

export class CancelDocumentGenerationsUseCase
  implements UseCase<Request, readonly DocumentGeneration[]>
{
  private readonly cancelGenerationUseCase: CancelDocumentGenerationUseCase

  constructor(
    generationsRepository: DocumentGenerationsRepository,
    datetimeProvider: DatetimeProvider,
    broker: Broker,
  ) {
    this.cancelGenerationUseCase = new CancelDocumentGenerationUseCase(
      generationsRepository,
      datetimeProvider,
      broker,
    )
  }

  execute({ documentGenerationIds }: Request): Promise<readonly DocumentGeneration[]> {
    const uniqueGenerationIds = [...new Set(documentGenerationIds)]

    return Promise.all(
      uniqueGenerationIds.map((documentGenerationId) =>
        this.cancelGenerationUseCase.execute({ documentGenerationId }),
      ),
    )
  }
}
