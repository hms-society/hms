import type {
  FormalizationSignatureArtifactKind,
  FormalizationSignatureProviderObservation,
} from '../domain/structures'

export interface SignatureProvider {
  getContractVersion(): string
  createEnvelope(input: {
    externalId: string
    title: string
    documents: ReadonlyArray<{
      externalId: string
      title: string
      bytes: Uint8Array
      mediaType: 'application/pdf'
      sha256: string
    }>
    recipients: ReadonlyArray<{
      externalId: string
      name: string
      email: string
      fields: ReadonlyArray<{
        documentExternalId: string
        page: number
        x: number
        y: number
        width: number
        height: number
        type: 'signature'
      }>
    }>
    distribution: 'none'
  }): Promise<{
    providerEnvelopeId: string
    documents: ReadonlyArray<{
      externalId: string
      providerEnvelopeItemId: string
    }>
    recipients: ReadonlyArray<{
      externalId: string
      providerRecipientId: string
      rawSigningCredential: string
    }>
  }>
  findEnvelopeByExternalId(
    externalId: string,
    expected?: {
      documents: ReadonlyArray<{ externalId: string }>
      recipients: ReadonlyArray<{ externalId: string }>
    },
  ): Promise<{
    providerEnvelopeId: string
    documents: ReadonlyArray<{
      externalId: string
      providerEnvelopeItemId: string
    }>
    recipients: ReadonlyArray<{
      externalId: string
      providerRecipientId: string
      rawSigningCredential: string
    }>
  } | null>
  distributeEnvelope(input: {
    providerEnvelopeId: string
    distribution: 'none'
  }): Promise<void>
  cancelEnvelope(input: {
    providerEnvelopeId: string
  }): Promise<'cancelled' | 'already_terminal'>
  findEnvelopeState(input: {
    providerEnvelopeId: string
  }): Promise<FormalizationSignatureProviderObservation>
  createSigningBinding(input: {
    providerEnvelopeId: string
    providerRecipientId: string
    recipientId: string
  }): Promise<{ encryptedCredential: string; cipherKeyId: string; expiresAt: Date }>
  downloadCompletedArtifacts(input: {
    providerEnvelopeId: string
    documents: ReadonlyArray<{
      requestDocumentId: string
      providerEnvelopeItemId: string
    }>
  }): Promise<
    Array<{
      kind: FormalizationSignatureArtifactKind
      bytes: Uint8Array
      requestDocumentId?: string
      mediaType: string
      /** Optional provider claims are checked against the downloaded bytes. */
      sha256?: string
      byteCount?: number
      providerReference?: string
    }>
  >
}
