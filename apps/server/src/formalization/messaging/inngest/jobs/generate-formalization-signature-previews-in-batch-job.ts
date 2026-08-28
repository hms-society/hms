import { Injectable } from '@nestjs/common'
import {
  FormalizationSignaturePreviewBatchGenerationRequestedEvent,
  FormalizationSignaturePreviewGenerationRequestedEvent,
} from '@hms/core/formalization/domain'
import { formalizationSignaturePreviewBatchEventSchema } from '@hms/validation/formalization'
import { eventType, type InngestFunction } from 'inngest'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const batchEvent = eventType(
  FormalizationSignaturePreviewBatchGenerationRequestedEvent._NAME,
  {
    schema: formalizationSignaturePreviewBatchEventSchema,
  },
)

@Injectable()
export class GenerateFormalizationSignaturePreviewsInBatchJob extends InngestJob {
  readonly function: InngestFunction.Like

  constructor(inngest: InngestClient) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'formalization/generate-signature-previews-in-batch',
        name: 'Generate Formalization Signature Previews In Batch',
        triggers: [batchEvent],
      },
      async ({ event, step }) =>
        step.sendEvent(
          'fan-out-formalization-signature-previews',
          event.data.items.map((item) => {
            const requestedEvent =
              new FormalizationSignaturePreviewGenerationRequestedEvent({
                formalizationId: event.data.formalizationId,
                previewId: item.previewId,
                attemptToken: item.attemptToken,
                occurredAt: event.data.occurredAt,
              })

            return {
              name: requestedEvent.name,
              data: requestedEvent.payload,
            }
          }),
        ),
    )
  }
}
