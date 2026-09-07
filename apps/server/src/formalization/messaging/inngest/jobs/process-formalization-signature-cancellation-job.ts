import { Inject, Injectable } from '@nestjs/common'
import { FormalizationSignatureRequestCancellationRequestedEvent } from '@hms/core/formalization/domain'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  SignatureProvider,
} from '@hms/core/formalization/interfaces'
import { ProcessFormalizationSignatureCancellationUseCase } from '@hms/core/formalization/use-cases'
import { formalizationSignatureRequestCancellationRequestedEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const cancellationEvent = eventType(
  FormalizationSignatureRequestCancellationRequestedEvent._NAME,
  { schema: formalizationSignatureRequestCancellationRequestedEventSchema },
)

@Injectable()
export class ProcessFormalizationSignatureCancellationJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureCancellationAttempts)
    attemptsRepository: FormalizationSignatureCancellationAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderResources)
    resourcesRepository: FormalizationSignatureProviderResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(FORMALIZATION_PROVIDERS.signatureProvider) provider: SignatureProvider,
  ) {
    super(inngest)
    const useCase = new ProcessFormalizationSignatureCancellationUseCase({
      attemptsRepository,
      resourcesRepository,
      requestsRepository,
      recipientsRepository,
      documentsRepository,
      transaction,
      provider,
    })
    this.function = this.inngest.createFunction(
      {
        id: 'formalization/process-signature-cancellation',
        name: 'Process Formalization Signature Cancellation',
        retries: 5,
        triggers: [cancellationEvent],
      },
      ({ event, step }) =>
        step.run('process-formalization-signature-cancellation', async () => {
          const attempt = await attemptsRepository.findById(
            event.data.cancellationAttemptId,
          )
          if (!attempt || attempt.requestId !== event.data.requestId)
            throw new Error('Signature cancellation attempt is unavailable.')
          return useCase.execute({
            cancellationAttemptId: event.data.cancellationAttemptId,
            attemptToken: attempt.attemptToken,
            occurredAt: new Date(event.data.occurredAt),
            processedAt: new Date(),
          })
        }),
    )
  }
}
