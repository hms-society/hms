import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import type { FormalizationSignatureRequestsRepository } from '@hms/core/formalization/interfaces'
import { ReconcileFormalizationSignatureRequestsUseCase } from '@hms/core/formalization/use-cases'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ReconcileFormalizationSignatureRequestsJob {
  static readonly ID = 'formalization/reconcile-signature-requests'
  static readonly RECONCILIATION_LIMIT = 100

  private readonly useCase: ReconcileFormalizationSignatureRequestsUseCase

  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    broker: InngestBroker,
    private readonly datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReconcileFormalizationSignatureRequestsUseCase({
      requestsRepository,
      broker,
    })
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: ReconcileFormalizationSignatureRequestsJob.ID,
    waitForCompletion: true,
  })
  execute() {
    return this.useCase.execute({
      limit: ReconcileFormalizationSignatureRequestsJob.RECONCILIATION_LIMIT,
      occurredAt: this.datetimeProvider.now(),
    })
  }
}
