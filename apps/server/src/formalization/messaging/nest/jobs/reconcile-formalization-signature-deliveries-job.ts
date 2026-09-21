import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import type {
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
  FormalizationSignatureRecipientsRepository,
} from '@hms/core/formalization/interfaces'
import {
  ReconcileFormalizationSignatureInvitationDeliveriesUseCase,
  ReconcileFormalizationSignatureOtpDeliveriesUseCase,
} from '@hms/core/formalization/use-cases'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

@Injectable()
export class ReconcileFormalizationSignatureDeliveriesJob {
  static readonly ID = 'formalization/reconcile-signature-deliveries'
  static readonly RECONCILIATION_LIMIT = 100

  private readonly reconcileInvitations: ReconcileFormalizationSignatureInvitationDeliveriesUseCase
  private readonly reconcileOtp: ReconcileFormalizationSignatureOtpDeliveriesUseCase

  constructor(
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
    private readonly datetimeProvider: DatetimeProvider,
  ) {
    this.reconcileInvitations =
      new ReconcileFormalizationSignatureInvitationDeliveriesUseCase({
        attemptsRepository: invitationAttemptsRepository,
        invitationsRepository,
        recipientsRepository,
        broker,
      })
    this.reconcileOtp = new ReconcileFormalizationSignatureOtpDeliveriesUseCase({
      attemptsRepository: otpAttemptsRepository,
      invitationsRepository,
      challengesRepository,
      broker,
    })
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: ReconcileFormalizationSignatureDeliveriesJob.ID,
    waitForCompletion: true,
  })
  async execute() {
    const occurredAt = this.datetimeProvider.now()

    return {
      invitations: await this.reconcileInvitations.execute({
        occurredAt,
        limit: ReconcileFormalizationSignatureDeliveriesJob.RECONCILIATION_LIMIT,
      }),
      otp: await this.reconcileOtp.execute({
        occurredAt,
        limit: ReconcileFormalizationSignatureDeliveriesJob.RECONCILIATION_LIMIT,
      }),
    }
  }
}
