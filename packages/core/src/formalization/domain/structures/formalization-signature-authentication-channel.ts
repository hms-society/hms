import type { FormalizationSignatureChannelKind } from './formalization-signature-channel-kind'

export type FormalizationSignatureAuthenticationChannel = {
  id: string
  kind: FormalizationSignatureChannelKind
  maskedDestination: string
}
