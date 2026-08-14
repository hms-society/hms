import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

export const DOCUMENT_VALIDATION_REQUIRED_FIELDS = [
  'Titular',
  'CPF',
  'Endereço',
  'CEP',
  'Data de emissão',
] as const

export function createDocumentValidationAiInput(document: DocumentValidationDocument) {
  return {
    task: 'analyze_document_validation',
    document: {
      id: document.id,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      storagePath: document.storagePath,
      currentStatus: document.status,
      hashSha256: document.hashSha256,
      channel: document.channel,
      sender: document.sender,
      documentText: null,
      documentTextNote:
        'OCR ainda não está disponível nesta fase. Analise somente os metadados e hints fornecidos; não invente conteúdo do documento.',
    },
    availableDocumentTypes: [
      {
        id: 'comprovante_residencia',
        label: 'Comprovante de residência',
        requiredFields: DOCUMENT_VALIDATION_REQUIRED_FIELDS,
      },
    ],
    outputContract: {
      status:
        'validated | incomplete | not_linked | illegible | duplicate | not_corresponding | processing_failure',
      aiConfidence: 'number from 0 to 100',
      extractedFields:
        'array of objective fields found in the supplied document metadata/hints. Each label must be one of the requiredFields labels.',
      missingFields:
        'array containing only labels from requiredFields that were not found',
      aiSuggestion:
        'object with confidence label, detected document type, case/checklist suggestion and failure details when applicable',
    },
  }
}
