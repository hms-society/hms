import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import type { DocumensoWebhookInput } from '@hms/validation/formalization'
import type { FormalizationSignatureProviderResourcesRepository } from '@hms/core/formalization/interfaces'

import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'

export class UnprocessableDocumensoWebhookError extends Error {}

@Injectable()
export class DocumensoWebhookNormalizer {
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureProviderResources)
    private readonly resources: FormalizationSignatureProviderResourcesRepository,
  ) {}

  async normalize(input: {
    eventName: string
    webhook: DocumensoWebhookInput
    receivedAt: Date
  }) {
    if (input.eventName !== input.webhook.event) {
      throw new UnprocessableDocumensoWebhookError(
        'The Documenso event header does not match the payload.',
      )
    }

    const resource = await this.resources.findByProviderEnvelopeId(
      input.webhook.payload.envelopeId,
    )
    if (!resource) {
      throw new UnprocessableDocumensoWebhookError(
        'The Documenso envelope is not recognized.',
      )
    }

    const canonical = JSON.stringify({
      id: input.webhook.id,
      event: input.webhook.event,
      createdAt: input.webhook.createdAt,
      payload: input.webhook.payload,
    })
    const dedupeKey = createHash('sha256').update(canonical).digest('hex')
    const hint = new TextEncoder().encode(
      JSON.stringify({ kind: 'reconciliation_only', requestId: resource.requestId }),
    )

    return {
      dedupeKey,
      hintKind: 'reconciliation_only' as const,
      hint,
      receivedAt: input.receivedAt,
    }
  }
}
