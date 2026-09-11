import { Event } from '#shared/domain/events/event'

export class FormalizationSignatureRequestProvisioningRequestedEvent extends Event<{
  readonly version: 1
  readonly requestId: string
  readonly provisioningAttemptId: string
  readonly occurredAt: Date
  readonly correlationId: string
}> {
  static readonly _NAME = 'formalization.signature-request-provisioning-requested.v1'

  constructor(
    payload: Omit<
      FormalizationSignatureRequestProvisioningRequestedEvent['payload'],
      'version'
    >,
  ) {
    super(FormalizationSignatureRequestProvisioningRequestedEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
