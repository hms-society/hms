import type { PackageDocument } from './package-document'

export type PackageDocumentCreation = Omit<PackageDocument, 'createdAt' | 'updatedAt'>
