export interface SignatureSecretVerifier {
  verify(input: { secret: string; verifier: string }): boolean
}
