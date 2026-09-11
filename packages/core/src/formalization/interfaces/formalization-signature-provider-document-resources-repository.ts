import type { FormalizationSignatureProviderDocumentResource } from '../domain/entities'

export interface FormalizationSignatureProviderDocumentResourcesRepository {
  addMany(
    resources: readonly FormalizationSignatureProviderDocumentResource[],
  ): Promise<FormalizationSignatureProviderDocumentResource[]>
  listByProviderResourceId(
    providerResourceId: string,
  ): Promise<FormalizationSignatureProviderDocumentResource[]>
  findByRequestDocumentId(
    requestDocumentId: string,
  ): Promise<FormalizationSignatureProviderDocumentResource | null>
  findByProviderEnvelopeItemId(
    providerEnvelopeItemId: string,
  ): Promise<FormalizationSignatureProviderDocumentResource | null>
}
