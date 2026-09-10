export interface SignatureOtpMacProvider {
  create(input: { code: string; challengeId: string }): string
}
