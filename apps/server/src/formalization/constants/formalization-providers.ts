export const FORMALIZATION_PROVIDERS = {
  signatureSourceReader: Symbol('FORMALIZATION_PROVIDERS.signatureSourceReader'),
  documentPdfConverter: Symbol('FORMALIZATION_PROVIDERS.documentPdfConverter'),
  documentPdfInspector: Symbol('FORMALIZATION_PROVIDERS.documentPdfInspector'),
  signatureConfigurationRepository: Symbol(
    'FORMALIZATION_PROVIDERS.signatureConfigurationRepository',
  ),
  documentConfirmationTransaction: Symbol(
    'FORMALIZATION_PROVIDERS.documentConfirmationTransaction',
  ),
} as const
