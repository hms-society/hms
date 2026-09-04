import { Inject, Injectable } from '@nestjs/common'
import { FormalizationSignatureReconciliationRequestedEvent } from '@hms/core/formalization/domain'
import type {
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureProviderDocumentResourcesRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSnapshotsRepository,
  FormalizationsRepository,
  SignatureProvider,
} from '@hms/core/formalization/interfaces'
import { ReconcileSignatureRequestUseCase } from '@hms/core/formalization/use-cases'
import { AppError } from '@hms/core/shared/domain/errors'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { formalizationSignatureReconciliationRequestedEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { IdProvider } from '@/shared/provision/id/id-provider'

const reconciliationEvent = eventType(
  FormalizationSignatureReconciliationRequestedEvent._NAME,
  { schema: formalizationSignatureReconciliationRequestedEventSchema },
)

@Injectable()
export class ReconcileFormalizationSignatureRequestJob extends InngestJob {
  static readonly ID = 'formalization/reconcile-signature-request'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderResources)
    resourcesRepository: FormalizationSignatureProviderResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderRecipientResources)
    recipientResourcesRepository: FormalizationSignatureProviderRecipientResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderDocumentResources)
    documentResourcesRepository: FormalizationSignatureProviderDocumentResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    documentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProtocols)
    protocolsRepository: FormalizationSignatureProtocolsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureArtifacts)
    artifactsRepository: FormalizationSignatureArtifactsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureSnapshots)
    snapshotsRepository: FormalizationSignatureSnapshotsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    @Inject(PROVISION_PROVIDERS.fileStorage)
    fileStorageProvider: FileStorageProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureProvider)
    provider: SignatureProvider,
    idProvider: IdProvider,
  ) {
    super(inngest)
    const useCase = new ReconcileSignatureRequestUseCase({
      requestsRepository,
      resourcesRepository,
      recipientResourcesRepository,
      documentResourcesRepository,
      documentsRepository,
      recipientsRepository,
      assignmentsRepository,
      protocolsRepository,
      artifactsRepository,
      snapshotsRepository,
      formalizationsRepository,
      transaction,
      fileStorageProvider,
      provider,
      idProvider,
    })

    this.function = this.inngest.createFunction(
      {
        id: ReconcileFormalizationSignatureRequestJob.ID,
        name: 'Reconcile Formalization Signature Request',
        retries: 5,
        triggers: [reconciliationEvent],
      },
      async ({ event, step }) => {
        const earliestRunAt = new Date(event.data.earliestRunAt)
        if (earliestRunAt.getTime() > Date.now()) {
          await step.sleepUntil(
            'wait-for-formalization-signature-reconciliation',
            earliestRunAt,
          )
        }
        const outcome = await step.run('reconcile-formalization-signature-request', () =>
          useCase.execute({
            requestId: event.data.requestId,
            reason: event.data.reason,
            occurredAt: new Date(),
          }),
        )
        if (outcome.outcome === 'retry_required') {
          throw new AppError(
            'Signature request reconciliation must be retried.',
            'Signature Reconciliation Required',
          )
        }
        return outcome
      },
    )
  }
}
