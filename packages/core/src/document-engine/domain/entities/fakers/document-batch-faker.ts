import { faker } from '@faker-js/faker'
import type { DocumentBatch } from '../document-batch'
export class DocumentBatchFaker {
 static fake(overrides: Partial<DocumentBatch> = {}): DocumentBatch { return { id: faker.string.uuid(), clientId: faker.string.uuid(), readableId: faker.string.uuid(), sender: faker.string.uuid(), status: 'identified', inTriageBox: false, files: [], createdAt: faker.date.recent(), updatedAt: faker.date.recent(), ...overrides } as DocumentBatch }
 static fakeMany(count = 10): DocumentBatch[] { return Array.from({ length: count }, () => DocumentBatchFaker.fake()) }
}
