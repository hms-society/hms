import { Inject, Injectable } from '@nestjs/common'
import type { FormalizationSignatureConfigurationRepository } from '@hms/core/formalization/interfaces'
import type { Broker, FileStorageProvider } from '@hms/core/shared/interfaces'
import { ReconcileFormalizationSignaturePreviewsUseCase } from '@hms/core/formalization/use-cases'
import { cron, type InngestFunction } from 'inngest'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

@Injectable()
export class ReconcileFormalizationSignaturePreviewsJob extends InngestJob {
  static readonly ID = 'formalization/reconcile-signature-previews'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)

    const reconcilePreviews = new ReconcileFormalizationSignaturePreviewsUseCase(
      configurationRepository,
      fileStorageProvider,
      broker as Broker,
      datetimeProvider,
    )

    this.function = this.inngest.createFunction(
      {
        id: ReconcileFormalizationSignaturePreviewsJob.ID,
        name: 'Reconcile Formalization Signature Previews',
        triggers: [cron('* * * * *')],
      },
      ({ step }) =>
        step.run('reconcile-formalization-signature-previews', () =>
          reconcilePreviews.execute({ limit: 100 }),
        ),
    )
  }
}
