import { Inject, Injectable } from '@nestjs/common'
import { FormalizationSignatureRequestProvisioningRequestedEvent } from '@hms/core/formalization/domain'
import { FormalizationSignatureProvisioningFailedError } from '@hms/core/formalization/domain/errors'
import type {
  FormalizationSignatureDocumentContentReader,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderDocumentResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureProvisioningAttemptsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
  FormalizationSignatureSnapshotsRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureSourceReader,
  SensitivePayloadCipherProvider,
  SignatureProvider,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'
import { ProvisionFormalizationSignatureRequestUseCase } from '@hms/core/formalization/use-cases'
import { formalizationSignatureRequestProvisioningRequestedEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction, NonRetriableError } from 'inngest'

import {
  FORMALIZATION_DATABASE_OPERATIONS,
  FORMALIZATION_REPOSITORIES,
} from '@/formalization/constants/formalization-repositories'
import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

const provisioningEvent = eventType(
  FormalizationSignatureRequestProvisioningRequestedEvent._NAME,
  { schema: formalizationSignatureRequestProvisioningRequestedEventSchema },
)

@Injectable()
export class ProvisionFormalizationSignatureRequestDocumentJob extends InngestJob {
  static readonly ID = 'formalization/provision-signature-request-document'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProvisioningAttempts)
    attemptsRepository: FormalizationSignatureProvisioningAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequestDocuments)
    requestDocumentsRepository: FormalizationSignatureRequestDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRequests)
    requestsRepository: FormalizationSignatureRequestsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.formalizations)
    _formalizationsRepository: FormalizationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipientDocuments)
    recipientDocumentsRepository: FormalizationSignatureRecipientDocumentsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderResources)
    providerResourcesRepository: FormalizationSignatureProviderResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderRecipientResources)
    providerRecipientResourcesRepository: FormalizationSignatureProviderRecipientResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderDocumentResources)
    providerDocumentResourcesRepository: FormalizationSignatureProviderDocumentResourcesRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureSnapshots)
    snapshotsRepository: FormalizationSignatureSnapshotsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitationSendAttempts)
    invitationSendAttemptsRepository: FormalizationSignatureInvitationSendAttemptsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureProvider) provider: SignatureProvider,
    @Inject(FORMALIZATION_PROVIDERS.signatureDocumentContentReader)
    contentReader: FormalizationSignatureDocumentContentReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureConfigurationRepository)
    configurationRepository: FormalizationSignatureConfigurationRepository,
    @Inject(FORMALIZATION_PROVIDERS.documentMetadataReader)
    metadataReader: FormalizationSignatureDocumentMetadataReader,
    @Inject(FORMALIZATION_PROVIDERS.signatureSourceReader)
    sourceReader: FormalizationSignatureSourceReader,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    cipher: SensitivePayloadCipherProvider,
    @Inject(FORMALIZATION_DATABASE_OPERATIONS.signatureGatewayTransaction)
    transaction: FormalizationSignatureGatewayTransaction,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
    broker: InngestBroker,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher) hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretGenerator)
    secretGenerator: { generate(): string },
  ) {
    super(inngest)
    const dependencies = {
      attemptsRepository,
      documentsRepository: requestDocumentsRepository,
      requestsRepository,
      recipientsRepository,
      recipientDocumentsRepository,
      providerResourcesRepository,
      providerRecipientResourcesRepository,
      providerDocumentResourcesRepository,
      snapshotsRepository,
      invitationsRepository,
      invitationSendAttemptsRepository,
      provider,
      contentReader,
      configurationRepository,
      metadataReader,
      sourceReader,
      cipher,
      transaction,
      idProvider,
      datetimeProvider,
      broker,
      hasher,
      secretGenerator,
    }
    const useCase = new ProvisionFormalizationSignatureRequestUseCase(dependencies)
    this.function = this.inngest.createFunction(
      {
        id: ProvisionFormalizationSignatureRequestDocumentJob.ID,
        name: 'Provision Formalization Signature Request Document',
        retries: 5,
        triggers: [provisioningEvent],
      },
      ({ event, step }) =>
        step.run('provision-formalization-signature-request-document', async () => {
          try {
            const attempt = await attemptsRepository.findByRequestId(event.data.requestId)
            if (!attempt || attempt.id !== event.data.provisioningAttemptId)
              throw new FormalizationSignatureProvisioningFailedError()
            return await useCase.execute({
              requestId: event.data.requestId,
              attemptToken: attempt.attemptToken,
              occurredAt: new Date(event.data.occurredAt),
            })
          } catch (error) {
            if (this.isNonRetriable(error)) {
              throw new NonRetriableError(error.message, { cause: error })
            }

            throw error
          }
        }),
    )
  }

  private isNonRetriable(
    error: unknown,
  ): error is FormalizationSignatureProvisioningFailedError {
    return error instanceof FormalizationSignatureProvisioningFailedError
  }
}
