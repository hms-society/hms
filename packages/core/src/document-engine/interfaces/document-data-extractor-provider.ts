import type {
  DocumentDataExtractionInput,
  ExtractedDocumentData,
} from '../domain/structures'

export interface DocumentDataExtractorProvider {
  extract(input: DocumentDataExtractionInput): Promise<ExtractedDocumentData[]>
}
