export const FormalizationSignatureUnavailableReason = {
  accessUnavailable: 'access_unavailable', noChannel: 'no_channel', otpInvalid: 'otp_invalid', otpLocked: 'otp_locked',
  documentUnavailable: 'document_unavailable', providerUnavailable: 'provider_unavailable', rejected: 'rejected', cancelled: 'cancelled', expired: 'expired',
} as const
export type FormalizationSignatureUnavailableReason =
  (typeof FormalizationSignatureUnavailableReason)[keyof typeof FormalizationSignatureUnavailableReason]
