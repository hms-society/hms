export const ChecklistDocumentType = {
  Pdf: 'PDF',
  Docx: 'DOCX',
  Image: 'Imagem',
  Any: 'Qualquer',
} as const

export type ChecklistDocumentType =
  (typeof ChecklistDocumentType)[keyof typeof ChecklistDocumentType]
