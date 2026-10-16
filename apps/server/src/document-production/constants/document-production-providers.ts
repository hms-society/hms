export const DOCUMENT_PRODUCTION_PROVIDERS = {
  documentFileExporter: Symbol('DOCUMENT_PRODUCTION_PROVIDERS.documentFileExporter'),
  documentPdfConverter: Symbol('DOCUMENT_PRODUCTION_PROVIDERS.documentPdfConverter'),
  finalDocumentFileExporter: Symbol(
    'DOCUMENT_PRODUCTION_PROVIDERS.finalDocumentFileExporter',
  ),
  documentPdfInspector: Symbol('DOCUMENT_PRODUCTION_PROVIDERS.documentPdfInspector'),
} as const
