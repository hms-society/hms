import type { FormalizationSignatureProxyBinding } from '../domain/entities'
import type { FormalizationSignatureProxyBindingChanges } from '../domain/structures'
export interface FormalizationSignatureProxyBindingsRepository {
  add(binding: FormalizationSignatureProxyBinding): Promise<void>
  findByAliasHash(aliasHash: string): Promise<FormalizationSignatureProxyBinding | null>
  findActiveByRecipientId(
    recipientId: string,
  ): Promise<FormalizationSignatureProxyBinding[]>
  replace(input: {
    bindingId: string
    expectedAliasHash?: string
    changes: FormalizationSignatureProxyBindingChanges
  }): Promise<boolean>
}
