import { Event } from '#shared/domain/events/event'
import type { FormalizationSignatureReconciliationReason } from '../structures'

export class FormalizationSignatureReconciliationRequestedEvent extends Event<{
  readonly version: 1
  readonly requestId: string
  readonly reason: FormalizationSignatureReconciliationReason
  readonly earliestRunAt: Date
}> {
  static readonly _NAME = 'formalization.signature-reconciliation-requested.v1'

  constructor(
    payload: Omit<
      FormalizationSignatureReconciliationRequestedEvent['payload'],
      'version'
    >,
  ) {
    super(FormalizationSignatureReconciliationRequestedEvent._NAME, {
      version: 1,
      ...payload,
    })
  }
}
