import { Inject, Injectable } from '@nestjs/common'
import { CommunicationSignatureInvitationDeliveredEvent } from '@hms/core/communication/domain/events'
import { MarkFormalizationSignatureInvitationDeliveryUseCase } from '@hms/core/formalization/use-cases'
import { communicationSignatureInvitationDeliveredEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import type {
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
} from '@hms/core/formalization/interfaces'

const invitationDeliveredEvent = eventType(
  CommunicationSignatureInvitationDeliveredEvent._NAME,
  { schema: communicationSignatureInvitationDeliveredEventSchema },
)

@Injectable()
export class MarkFormalizationSignatureInvitationDeliveryJob extends InngestJob {
  static readonly ID = 'formalization/mark-signature-invitation-delivery'
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitationSendAttempts)
    attemptsRepository: FormalizationSignatureInvitationSendAttemptsRepository,
    @Inject(FORMALIZATION_REPOSITORIES.signatureInvitations)
    invitationsRepository: FormalizationSignatureInvitationsRepository,
  ) {
    super(inngest)
    const useCase = new MarkFormalizationSignatureInvitationDeliveryUseCase({
      attemptsRepository,
      invitationsRepository,
    })
    this.function = this.inngest.createFunction(
      {
        id: MarkFormalizationSignatureInvitationDeliveryJob.ID,
        name: 'Mark Formalization Signature Invitation Delivery',
        retries: 5,
        triggers: [invitationDeliveredEvent],
      },
      ({ event, step }) =>
        step.run('mark-formalization-signature-invitation-delivery', () =>
          useCase.execute({
            deliveryAttemptId: event.data.deliveryAttemptId,
            outcome: event.data.outcome,
            communicationMessageId: event.data.communicationMessageId,
            occurredAt: new Date(event.data.occurredAt),
          }),
        ),
    )
  }
}
