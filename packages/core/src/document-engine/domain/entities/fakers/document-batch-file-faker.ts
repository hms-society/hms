import { faker } from '@faker-js/faker'
import type { DocumentBatchFile } from '../document-batch'
export class DocumentBatchFileFaker {
 static fake(overrides: Partial<DocumentBatchFile> = {}): DocumentBatchFile { return { id: faker.string.uuid(), batchId: faker.string.uuid(), storagePath: faker.string.uuid(), originalName: 'Documento.pdf', mimeType: 'application/pdf', sizeBytes: 5, createdAt: faker.date.recent(), status: 'processing', ...overrides } }
 static fakeMany(count = 10): DocumentBatchFile[] { return Array.from({ length: count }, () => DocumentBatchFileFaker.fake()) }
}
