import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import type { FormalizationSignatureConfigurationRepository } from '@hms/core/formalization/interfaces'
import { ReconcileFormalizationSignaturePreviewsUseCase } from '@hms/core/formalization/use-cases'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

@Injectable()
export class ReconcileFormalizationSignaturePreviewsJob {
  static readonly ID = 'formalization/reconcile-signature-previews'
  static readonly RECONCILIATION_LIMIT = 100

  private readonly useCase: ReconcileFormalizationSignaturePreviewsUseCase

  constructor(
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReconcileFormalizationSignaturePreviewsUseCase(
      configurationRepository,
      fileStorageProvider,
      broker,
      datetimeProvider,
    )
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: ReconcileFormalizationSignaturePreviewsJob.ID,
    waitForCompletion: true,
  })
  execute() {
    return this.useCase.execute({
      limit: ReconcileFormalizationSignaturePreviewsJob.RECONCILIATION_LIMIT,
    })
  }
}
