import type { FormalizationSignatureRequest } from '../domain/entities'
import type { FormalizationSignatureRequestChanges } from '../domain/structures'
export interface FormalizationSignatureRequestsRepository {
  add(request: FormalizationSignatureRequest): Promise<void>
  listReconcilable(limit: number): Promise<FormalizationSignatureRequest[]>
  findById(requestId: string): Promise<FormalizationSignatureRequest | null>
  findByConfirmationKeyHash(
    confirmationKeyHash: string,
  ): Promise<FormalizationSignatureRequest | null>
  findCurrentByFormalizationId(
    formalizationId: string,
  ): Promise<FormalizationSignatureRequest | null>
  findLatestByFormalizationId(
    formalizationId: string,
  ): Promise<FormalizationSignatureRequest | null>
  replace(input: {
    requestId: string
    expectedVersion: number
    changes: FormalizationSignatureRequestChanges
  }): Promise<boolean>
}
