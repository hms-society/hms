export const DOCUMENT_PRODUCTION_PROVIDERS = {
  documentFileExporter: Symbol('DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter'),
  documentPdfConverter: Symbol('DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter'),
  documentPdfInspector: Symbol('DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector'),
  documentPdfFreezeService: Symbol(
    'DOCUMENT_PRODUCTION_PROVIDERS.documentPdfFreezeService',
  ),
} as const
