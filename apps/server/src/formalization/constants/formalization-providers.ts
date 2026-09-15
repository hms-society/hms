export const FORMALIZATION_PROVIDERS = {
  sourceProvider: Symbol('FORMALIZATION_PROVIDERS.sourceProvider'),
  signatureSourceProvider: Symbol('FORMALIZATION_PROVIDERS.signatureSourceProvider'),
  documentMetadataProvider: Symbol('FORMALIZATION_PROVIDERS.documentMetadataProvider'),
  signatureSecretHasher: Symbol('FORMALIZATION_PROVIDERS.signatureSecretHasher'),
  signatureSecretVerifier: Symbol('FORMALIZATION_PROVIDERS.signatureSecretVerifier'),
  signatureOtpMacProvider: Symbol('FORMALIZATION_PROVIDERS.signatureOtpMacProvider'),
  sensitivePayloadCipher: Symbol('FORMALIZATION_PROVIDERS.sensitivePayloadCipher'),
  signatureDocumentContentProvider: Symbol(
    'FORMALIZATION_PROVIDERS.signatureDocumentContentProvider',
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
  dynamicFormUsage: Symbol('FORMALIZATION_PROVIDERS.dynamicFormUsage'),
} as const
