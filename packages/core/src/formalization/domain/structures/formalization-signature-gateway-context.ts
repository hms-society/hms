import type { FormalizationSignatureAuthenticationChannels } from './formalization-signature-authentication-channels'
import type { FormalizationSignatureGatewayDocument } from './formalization-signature-gateway-document'
import type { FormalizationSignaturePendingResultStatus } from './formalization-signature-pending-result-status'
import type { FormalizationSignatureResult } from './formalization-signature-result'
import type { FormalizationSignatureResultStatus } from './formalization-signature-result-status'
import type { FormalizationSignatureUnavailableReason } from './formalization-signature-unavailable-reason'

export type FormalizationSignatureGatewayContext =
  | ({ readonly csrfToken: string } & (
      | { readonly step: 'invitation' }
      | {
          readonly step: 'choose_channel'
          readonly channels: FormalizationSignatureAuthenticationChannels
        }
      | {
          readonly step: 'enter_otp'
          readonly challengeId: string
          readonly expiresAt: Date
          readonly resendAvailableAt: Date
        }
      | { readonly step: 'collaborator_login'; readonly loginPath: string }
      | {
          readonly step: 'reading'
          readonly documents: readonly FormalizationSignatureGatewayDocument[]
          readonly acknowledgedDocumentIds: readonly string[]
          readonly requestVersion: number
        }
      | {
          readonly step: 'submitted'
          readonly result: FormalizationSignatureResult & {
            readonly status: FormalizationSignaturePendingResultStatus
          }
        }
      | {
          readonly step: 'confirmed'
          readonly result: FormalizationSignatureResult & {
            readonly status: typeof FormalizationSignatureResultStatus.confirmed
            readonly protocol: string
          }
        }
    ))
  | {
      readonly step: 'unavailable'
      readonly csrfToken?: string
      readonly reason: FormalizationSignatureUnavailableReason
      readonly result?: FormalizationSignatureResult
      readonly retryAt?: Date
    }
