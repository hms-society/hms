import type { RestResponse } from '../../shared/responses/rest-response'
import type {
  FormalizationSignatureAuthenticationChannels,
  FormalizationSignatureGatewayContextResponse,
  FormalizationSignatureGatewayDocumentsResponse,
  FormalizationSignatureGatewayResultResponse,
} from '../domain/structures'
import type {
  ExchangeSignatureInvitationCommand,
  RequestSignatureOtpCommand,
  StartFormalizationSigningCommand,
  VerifySignatureOtpCommand,
} from '../domain/structures'

export interface SigningGatewayService {
  exchangeInvitation(
    input: ExchangeSignatureInvitationCommand,
  ): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  getContext(): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  listChannels(): Promise<RestResponse<FormalizationSignatureAuthenticationChannels>>
  requestOtp(input: RequestSignatureOtpCommand): Promise<
    RestResponse<{
      readonly challengeId: string
      readonly expiresAt: string
      readonly resendAvailableAt: string
    }>
  >
  verifyOtp(
    input: VerifySignatureOtpCommand,
  ): Promise<RestResponse<FormalizationSignatureGatewayContextResponse>>
  establishCollaboratorSession(): Promise<
    RestResponse<FormalizationSignatureGatewayContextResponse>
  >
  getDocuments(): Promise<RestResponse<FormalizationSignatureGatewayDocumentsResponse>>
  getDocumentContent(requestDocumentId: string): Promise<RestResponse<ArrayBuffer>>
  acknowledgeDocument(
    requestDocumentId: string,
    input: { readonly expectedRequestVersion: number; readonly acknowledged: true },
  ): Promise<
    RestResponse<{ readonly requestDocumentId: string; readonly acknowledgedAt: string }>
  >
  startSigning(
    input: StartFormalizationSigningCommand,
  ): Promise<RestResponse<{ readonly proxyPath: string; readonly expiresAt: string }>>
  getResult(): Promise<RestResponse<FormalizationSignatureGatewayResultResponse>>
  closeResult(): Promise<RestResponse<void>>
}
