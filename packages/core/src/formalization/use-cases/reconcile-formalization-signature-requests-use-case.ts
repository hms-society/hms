import type { Broker, UseCase } from '../../shared/interfaces'
import { FormalizationSignatureReconciliationRequestedEvent } from '../domain/events'
import type { FormalizationSignatureRequestsRepository } from '../interfaces'

type Request = {
  readonly limit: number
  readonly occurredAt: Date
}

type Response = { readonly published: number }

type Dependencies = {
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly broker: Broker
}

export class ReconcileFormalizationSignatureRequestsUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const requests = await this.dependencies.requestsRepository.listReconcilable(
      request.limit,
    )

    for (const signatureRequest of requests) {
      await this.dependencies.broker.publish(
        new FormalizationSignatureReconciliationRequestedEvent({
          requestId: signatureRequest.id,
          reason: 'scheduled',
          earliestRunAt: request.occurredAt,
        }),
      )
    }

    return { published: requests.length }
  }
}
