import type { FormalizationSignatureProtocol } from '../domain/entities'
export interface FormalizationSignatureProtocolsRepository {
  add(protocol: FormalizationSignatureProtocol): Promise<void>
  findByRecipientAndRequest(input: {
    recipientId: string
    requestId: string
  }): Promise<FormalizationSignatureProtocol | null>
}
