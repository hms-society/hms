import { Inject, Injectable } from '@nestjs/common'
import { CommunicationSignatureOtpDeliveredEvent } from '@hms/core/communication/domain/events'
import { MarkSignatureOtpDeliveryUseCase } from '@hms/core/formalization/use-cases'
import { communicationSignatureOtpDeliveredEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import type {
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
} from '@hms/core/formalization/interfaces'

const otpDeliveredEvent = eventType(CommunicationSignatureOtpDeliveredEvent._NAME, {
  schema: communicationSignatureOtpDeliveredEventSchema,
})

@Injectable()
export class MarkFormalizationSignatureOtpDeliveryJob extends InngestJob {
  static readonly ID = 'formalization/mark-signature-otp-delivery'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpSendAttempts)
    attemptsRepository: FormalizationSignatureOtpSendAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureOtpChallenges)
    challengesRepository: FormalizationSignatureOtpChallengesRepository,
  ) {
    super(inngest)
    const useCase = new MarkSignatureOtpDeliveryUseCase({
      attemptsRepository,
      challengesRepository,
    })
    this.function = this.inngest.createFunction(
      {
        id: MarkFormalizationSignatureOtpDeliveryJob.ID,
        name: 'Mark Formalization Signature OTP Delivery',
        retries: 5,
        triggers: [otpDeliveredEvent],
      },
      ({ event, step }) =>
        step.run('mark-formalization-signature-otp-delivery', () =>
          useCase.execute({
            deliveryAttemptId: event.data.deliveryAttemptId,
            outcome: event.data.outcome,
            providerMessageId: event.data.providerMessageId,
            occurredAt: new Date(event.data.occurredAt),
          }),
        ),
    )
  }
}
