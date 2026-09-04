export interface SignatureSecretHasher {
  hash(value: string): string
}
