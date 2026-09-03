import type { Formalization } from '../domain/entities'

type FormalizationDocumentConfirmationResult = {
  readonly formalization: Formalization
  readonly pendingPreviewIds: ReadonlyArray<string>
}

export interface FormalizationDocumentConfirmationTransaction {
  confirm(input: {
    readonly formalizationId: string
    readonly expectedVersion: number
    readonly actorId: string
    readonly occurredAt: Date
  }): Promise<FormalizationDocumentConfirmationResult>
  initializeConfirmed(input: {
    readonly formalizationId: string
    readonly expectedVersion: number
    readonly actorId: string
    readonly occurredAt: Date
  }): Promise<FormalizationDocumentConfirmationResult>
  reopen(input: {
    readonly formalizationId: string
    readonly expectedVersion: number
    readonly occurredAt: Date
  }): Promise<Formalization>
}
