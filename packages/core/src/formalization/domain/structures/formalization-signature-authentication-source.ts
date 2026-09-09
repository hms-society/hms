import type { FormalizationSignatureAuthenticationChannels } from './formalization-signature-authentication-channels'
import type { FormalizationSignatureRecipientKind } from './formalization-signature-recipient-kind'

export type FormalizationSignatureAuthenticationSource = {
  personId: string
  actorKind: FormalizationSignatureRecipientKind
  active: boolean
  collaboratorRole?: 'lawyer' | 'paralegal' | 'supervisor'
  channels: FormalizationSignatureAuthenticationChannels
}
