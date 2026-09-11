export const FORMALIZATION_PROVIDERS = {
  signatureSourceReader: Symbol('FORMALIZATION_PROVIDERS.signatureSourceReader'),
  documentMetadataReader: Symbol('FORMALIZATION_PROVIDERS.documentMetadataReader'),
  signatureSecretHasher: Symbol('FORMALIZATION_PROVIDERS.signatureSecretHasher'),
  signatureSecretVerifier: Symbol('FORMALIZATION_PROVIDERS.signatureSecretVerifier'),
  signatureOtpMacProvider: Symbol('FORMALIZATION_PROVIDERS.signatureOtpMacProvider'),
  sensitivePayloadCipher: Symbol('FORMALIZATION_PROVIDERS.sensitivePayloadCipher'),
  signatureDocumentContentReader: Symbol(
    'FORMALIZATION_PROVIDERS.signatureDocumentContentReader',
  ),
  signatureProvider: Symbol('FORMALIZATION_PROVIDERS.signatureProvider'),
  signatureSecretGenerator: Symbol('FORMALIZATION_PROVIDERS.signatureSecretGenerator'),
  signatureConfigurationRepository: Symbol(
    'FORMALIZATION_PROVIDERS.signatureConfigurationRepository',
  ),
  documentConfirmationTransaction: Symbol(
    'FORMALIZATION_PROVIDERS.documentConfirmationTransaction',
  ),
  contractingTransaction: Symbol('FORMALIZATION_PROVIDERS.contractingTransaction'),
} as const
