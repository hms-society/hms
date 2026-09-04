import type { FormalizationSignatureProviderRecipientResource } from '../domain/entities'
import type { FormalizationSignatureProviderRecipientResourceChanges } from '../domain/structures'
export interface FormalizationSignatureProviderRecipientResourcesRepository {
  addMany(
    resources: readonly FormalizationSignatureProviderRecipientResource[],
  ): Promise<FormalizationSignatureProviderRecipientResource[]>
  listByProviderResourceId(
    providerResourceId: string,
  ): Promise<FormalizationSignatureProviderRecipientResource[]>
  findByRecipientId(
    recipientId: string,
  ): Promise<FormalizationSignatureProviderRecipientResource | null>
  findByProviderRecipientId(
    providerRecipientId: string,
  ): Promise<FormalizationSignatureProviderRecipientResource | null>
  replace(input: {
    resourceId: string
    changes: FormalizationSignatureProviderRecipientResourceChanges
  }): Promise<void>
}
