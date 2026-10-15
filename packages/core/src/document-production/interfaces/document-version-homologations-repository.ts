import type { DocumentVersionHomologation } from '../domain/entities/document-version-homologation'

export type AddDocumentVersionHomologation = Omit<DocumentVersionHomologation, 'id'> & {
  id?: string
}

export interface DocumentVersionHomologationsRepository {
  add(homologation: AddDocumentVersionHomologation): Promise<DocumentVersionHomologation>
  findByDocumentVersionId(
    documentVersionId: string,
  ): Promise<DocumentVersionHomologation | undefined>
}
