import { Injectable } from '@nestjs/common'
import { CommunicationSignatureOtpDeliveredEvent } from '@hms/core/communication/domain/events'
import { FormalizationSignatureOtpDeliveryRequestedEvent } from '@hms/core/formalization/domain'
import { formalizationSignatureOtpDeliveryRequestedEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import { FormalizationSignatureEmailDeliveryProvider } from '@/communication/provision/formalization-signature-email-delivery-provider'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const otpDeliveryRequestedEvent = eventType(
  FormalizationSignatureOtpDeliveryRequestedEvent._NAME,
  { schema: formalizationSignatureOtpDeliveryRequestedEventSchema },
)

@Injectable()
export class SendFormalizationSignatureOtpJob extends InngestJob {
  static readonly ID = 'communication/send-formalization-signature-otp'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    private readonly delivery: FormalizationSignatureEmailDeliveryProvider,
  ) {
    super(inngest)
    this.function = this.inngest.createFunction(
      {
        id: SendFormalizationSignatureOtpJob.ID,
        name: 'Send Formalization Signature OTP',
        retries: 5,
        triggers: [otpDeliveryRequestedEvent],
      },
      async ({ event, step }) => {
        const result = await step.run('send-formalization-signature-otp', () =>
          this.delivery.sendOtp(event.data),
        )
        await step.sendEvent('record-formalization-signature-otp-delivery', {
          name: CommunicationSignatureOtpDeliveredEvent._NAME,
          data: {
            version: 1,
            deliveryAttemptId: event.data.deliveryAttemptId,
            ...(result.outcome === 'delivered'
              ? { providerMessageId: result.messageId }
              : {}),
            occurredAt: new Date().toISOString(),
            outcome: result.outcome,
          },
        })
      },
    )
  }
}
