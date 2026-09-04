import { Injectable } from '@nestjs/common'
import { CommunicationSignatureInvitationDeliveredEvent } from '@hms/core/communication/domain/events'
import { FormalizationSignatureInvitationReadyEvent } from '@hms/core/formalization/domain'
import { formalizationSignatureInvitationReadyEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import { FormalizationSignatureEmailDeliveryProvider } from '@/communication/provision/formalization-signature-email-delivery-provider'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const invitationReadyEvent = eventType(FormalizationSignatureInvitationReadyEvent._NAME, {
  schema: formalizationSignatureInvitationReadyEventSchema,
})

@Injectable()
export class SendFormalizationSignatureInvitationJob extends InngestJob {
  static readonly ID = 'communication/send-formalization-signature-invitation'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    private readonly delivery: FormalizationSignatureEmailDeliveryProvider,
  ) {
    super(inngest)
    this.function = this.inngest.createFunction(
      {
        id: SendFormalizationSignatureInvitationJob.ID,
        name: 'Send Formalization Signature Invitation',
        retries: 5,
        triggers: [invitationReadyEvent],
      },
      async ({ event, step }) => {
        const result = await step.run('send-formalization-signature-invitation', () =>
          this.delivery.sendInvitation(event.data),
        )
        await step.sendEvent('record-formalization-signature-invitation-delivery', {
          name: CommunicationSignatureInvitationDeliveredEvent._NAME,
          data: {
            version: 1,
            deliveryAttemptId: event.data.deliveryAttemptId,
            invitationId: event.data.invitationId,
            ...(result.outcome === 'delivered'
              ? { communicationMessageId: result.messageId }
              : {}),
            occurredAt: new Date().toISOString(),
            outcome: result.outcome,
          },
        })
      },
    )
  }
}
