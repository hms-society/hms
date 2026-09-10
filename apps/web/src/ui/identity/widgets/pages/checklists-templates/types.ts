export type LegalArea = {
  id: string
  name: string
  documentCount: number
}

export type DocumentFileType = 'PDF' | 'DOCX' | 'Imagem' | 'Qualquer'

export type ChecklistDocument = {
  id: string
  name: string
  type: DocumentFileType
  required: boolean
}
