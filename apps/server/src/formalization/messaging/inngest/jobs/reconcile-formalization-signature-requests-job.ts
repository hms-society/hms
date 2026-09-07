import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationSignatureRequestsRepository } from '@hms/core/formalization/interfaces'
import { ReconcileFormalizationSignatureRequestsUseCase } from '@hms/core/formalization/use-cases'
import type { Broker } from '@hms/core/shared/interfaces'
import { cron, type InngestFunction } from 'inngest'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ReconcileFormalizationSignatureRequestsJob extends InngestJob {
  static readonly ID = 'formalization/reconcile-signature-requests'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)

    const reconcileRequests = new ReconcileFormalizationSignatureRequestsUseCase({
      requestsRepository,
      broker: broker as Broker,
    })

    this.function = this.inngest.createFunction(
      {
        id: ReconcileFormalizationSignatureRequestsJob.ID,
        name: 'Reconcile Formalization Signature Requests',
        triggers: [cron('* * * * *')],
      },
      ({ step }) =>
        step.run('reconcile-formalization-signature-requests', () =>
          reconcileRequests.execute({
            limit: 100,
            occurredAt: datetimeProvider.now(),
          }),
        ),
    )
  }
}
