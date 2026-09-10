import type { FormalizationSignatureProviderResource } from '../domain/entities'
import type { FormalizationSignatureProviderResourceChanges } from '../domain/structures'
export interface FormalizationSignatureProviderResourcesRepository {
  add(resource: FormalizationSignatureProviderResource): Promise<void>
  findByRequestId(
    requestId: string,
  ): Promise<FormalizationSignatureProviderResource | null>
  findByProviderEnvelopeId(
    providerEnvelopeId: string,
  ): Promise<FormalizationSignatureProviderResource | null>
  replace(input: {
    resourceId: string
    changes: FormalizationSignatureProviderResourceChanges
  }): Promise<void>
}
