export interface SensitivePayloadCipherProvider {
  encrypt(input: {
    plaintext: Uint8Array
    purpose: 'invitation_delivery' | 'otp_delivery' | 'provider_credential' | 'webhook'
    contextId: string
  }): Promise<{ ciphertext: string; keyId: string }>
  decrypt(input: {
    ciphertext: string
    keyId: string
    purpose: 'invitation_delivery' | 'otp_delivery' | 'provider_credential' | 'webhook'
    contextId: string
  }): Promise<Uint8Array>
}
