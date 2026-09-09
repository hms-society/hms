import { Inject, Injectable } from '@nestjs/common'
import {
  ReconcileFormalizationSignatureInvitationDeliveriesUseCase,
  ReconcileFormalizationSignatureOtpDeliveriesUseCase,
} from '@hms/core/formalization/use-cases'
import type {
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
  FormalizationSignatureRecipientsRepository,
} from '@hms/core/formalization/interfaces'
import { cron, type InngestFunction } from 'inngest'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ReconcileFormalizationSignatureDeliveriesJob extends InngestJob {
  static readonly ID = 'formalization/reconcile-signature-deliveries'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitationSendAttempts)
    invitationAttemptsRepository: FormalizationSignatureInvitationSendAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureRecipients)
    recipientsRepository: FormalizationSignatureRecipientsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpSendAttempts)
    otpAttemptsRepository: FormalizationSignatureOtpSendAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpChallenges)
    challengesRepository: FormalizationSignatureOtpChallengesRepository,
    broker: InngestBroker,
    datetimeProvider: DatetimeProvider,
  ) {
    super(inngest)
    const reconcileInvitations =
      new ReconcileFormalizationSignatureInvitationDeliveriesUseCase({
        attemptsRepository: invitationAttemptsRepository,
        invitationsRepository,
        recipientsRepository,
        broker,
      })
    const reconcileOtp = new ReconcileFormalizationSignatureOtpDeliveriesUseCase({
      attemptsRepository: otpAttemptsRepository,
      invitationsRepository,
      challengesRepository,
      broker,
    })
    this.function = this.inngest.createFunction(
      {
        id: ReconcileFormalizationSignatureDeliveriesJob.ID,
        name: 'Reconcile Formalization Signature Deliveries',
        retries: 3,
        triggers: [cron('* * * * *')],
      },
      ({ step }) =>
        step.run('reconcile-formalization-signature-deliveries', async () => ({
          invitations: await reconcileInvitations.execute({
            occurredAt: datetimeProvider.now(),
            limit: 100,
          }),
          otp: await reconcileOtp.execute({
            occurredAt: datetimeProvider.now(),
            limit: 100,
          }),
        })),
    )
  }
}
