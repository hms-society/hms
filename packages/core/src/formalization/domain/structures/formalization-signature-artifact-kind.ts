export const FormalizationSignatureArtifactKind = {
  signedPdf: 'signed_pdf', providerCertificate: 'provider_certificate', providerEvidence: 'provider_evidence',
} as const
export type FormalizationSignatureArtifactKind =
  (typeof FormalizationSignatureArtifactKind)[keyof typeof FormalizationSignatureArtifactKind]
