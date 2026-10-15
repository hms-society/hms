import { describe, it, expect } from 'vitest'
import {
  prepareChecklistUploadSchema,
  attachChecklistDocumentSchema,
  validateChecklistDocumentSchema,
} from '../checklist-document-schema'
const id = '00000000-0000-4000-8000-000000000001'
const expectedUpdatedAt = '2026-10-12T12:00:00.000Z'
describe('Checklist Document Schema', () => {
  it.each([1, 10 * 1024 * 1024])('accepts upload size boundary %s', (sizeBytes) => {
    expect(
      prepareChecklistUploadSchema.parse({
        operationId: id,
        name: '  original.pdf  ',
        mimeType: 'application/pdf',
        sizeBytes,
      }).name,
    ).toBe('original.pdf')
  })
  it.each([0, -1, 10 * 1024 * 1024 + 1, 1.5])('rejects invalid size %s', (sizeBytes) => {
    expect(
      prepareChecklistUploadSchema.safeParse({
        operationId: id,
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        sizeBytes,
      }).success,
    ).toBe(false)
  })
  it.each([
    'application/pdf',
    'image/jpeg',
    'image/png',
  ])('accepts supported media %s', (mimeType) => {
    expect(
      prepareChecklistUploadSchema.safeParse({
        operationId: id,
        name: 'proof',
        mimeType,
        sizeBytes: 1,
      }).success,
    ).toBe(true)
  })
  it.each(['text/plain', '', 'image/gif'])('rejects unsupported media %s', (mimeType) => {
    expect(
      prepareChecklistUploadSchema.safeParse({
        operationId: id,
        name: 'proof',
        mimeType,
        sizeBytes: 1,
      }).success,
    ).toBe(false)
  })
  it.each(['', ' '.repeat(5), 'x'.repeat(256)])('rejects invalid name', (name) => {
    expect(
      prepareChecklistUploadSchema.safeParse({
        operationId: id,
        name,
        mimeType: 'application/pdf',
        sizeBytes: 1,
      }).success,
    ).toBe(false)
  })
  it('accepts only strict discriminated actions and server-owned context', () => {
    expect(
      attachChecklistDocumentSchema.safeParse({
        kind: 'existing',
        documentId: id,
        operationId: id,
        expectedUpdatedAt,
      }).success,
    ).toBe(true)
    expect(
      attachChecklistDocumentSchema.safeParse({
        kind: 'upload',
        uploadId: id,
        operationId: id,
        expectedUpdatedAt,
      }).success,
    ).toBe(true)
    expect(
      attachChecklistDocumentSchema.safeParse({
        kind: 'existing',
        documentId: id,
        operationId: id,
        expectedUpdatedAt,
        clientId: id,
      }).success,
    ).toBe(false)
    expect(
      attachChecklistDocumentSchema.safeParse({
        kind: 'existing',
        uploadId: id,
        operationId: id,
        expectedUpdatedAt,
      }).success,
    ).toBe(false)
  })
  it('rejects malformed operation identity and timestamp', () => {
    expect(
      validateChecklistDocumentSchema.safeParse({
        operationId: 'bad',
        clientDocumentId: id,
        expectedUpdatedAt,
      }).success,
    ).toBe(false)
    expect(
      validateChecklistDocumentSchema.safeParse({
        operationId: id,
        clientDocumentId: id,
        expectedUpdatedAt: 'yesterday',
      }).success,
    ).toBe(false)
    expect(
      validateChecklistDocumentSchema.safeParse({
        operationId: id,
        clientDocumentId: id,
        expectedUpdatedAt,
      }).success,
    ).toBe(true)
  })
})
