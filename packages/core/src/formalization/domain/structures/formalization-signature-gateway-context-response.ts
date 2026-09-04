import type { FormalizationSignatureAuthenticationChannels } from './formalization-signature-authentication-channels'
import type { FormalizationSignatureGatewayDocumentResponse } from './formalization-signature-gateway-document-response'
import type { FormalizationSignatureGatewayResultResponse } from './formalization-signature-gateway-result-response'
import type { FormalizationSignaturePendingResultStatus } from './formalization-signature-pending-result-status'
import type { FormalizationSignatureUnavailableReason } from './formalization-signature-unavailable-reason'

export type FormalizationSignatureGatewayContextResponse =
  | ({ readonly csrfToken: string } & (
      | { readonly step: 'invitation' }
      | {
          readonly step: 'choose_channel'
          readonly channels: FormalizationSignatureAuthenticationChannels
        }
      | {
          readonly step: 'enter_otp'
          readonly challengeId: string
          readonly expiresAt: string
          readonly resendAvailableAt: string
        }
      | { readonly step: 'collaborator_login'; readonly loginPath: string }
      | {
          readonly step: 'reading'
          readonly documents: readonly FormalizationSignatureGatewayDocumentResponse[]
          readonly acknowledgedDocumentIds: readonly string[]
          readonly requestVersion: number
        }
      | {
          readonly step: 'submitted'
          readonly result: FormalizationSignatureGatewayResultResponse & {
            readonly status: FormalizationSignaturePendingResultStatus
          }
        }
      | {
          readonly step: 'confirmed'
          readonly result: FormalizationSignatureGatewayResultResponse & {
            readonly status: 'confirmed'
            readonly protocol: string
          }
        }
    ))
  | {
      readonly step: 'unavailable'
      readonly csrfToken?: string
      readonly reason: FormalizationSignatureUnavailableReason
      readonly result?: FormalizationSignatureGatewayResultResponse
      readonly retryAt?: string
    }
