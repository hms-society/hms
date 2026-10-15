import type { FrozenDocumentPdf } from './frozen-document-pdf'

export type FrozenDocumentPdfCreation = Omit<FrozenDocumentPdf, 'createdAt' | 'id'>
