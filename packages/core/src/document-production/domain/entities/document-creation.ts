import type { Document } from './document'

export type DocumentCreation = Omit<Document, 'createdAt' | 'updatedAt'>
