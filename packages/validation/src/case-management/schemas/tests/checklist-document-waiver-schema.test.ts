import { describe, expect, it } from 'vitest'
import {
  grantChecklistDocumentWaiverSchema,
  revokeChecklistDocumentWaiverSchema,
} from '../checklist-document-waiver-schema'
const request = {
  operationId: '00000000-0000-4000-8000-000000000001',
  expectedUpdatedAt: '2026-10-13T12:00:00Z',
}
describe('Checklist Document Waiver Schema', () => {
  it('accepts a single trimmed character without an arbitrary minimum', () => {
    expect(
      grantChecklistDocumentWaiverSchema.parse({ ...request, justification: ' x ' })
        .justification,
    ).toBe('x')
  })
  it.each(['', ' ', '\n\t'])('rejects blank reason %j', (justification) => {
    expect(
      grantChecklistDocumentWaiverSchema.safeParse({ ...request, justification }).success,
    ).toBe(false)
  })
  it.each([
    { operationId: 'invalid' },
    { expectedUpdatedAt: 'invalid' },
    { actorId: request.operationId },
    { actorName: 'Forged' },
  ])('rejects malformed metadata or actor injection %j', (changes) => {
    expect(
      grantChecklistDocumentWaiverSchema.safeParse({
        ...request,
        justification: 'Reason',
        ...changes,
      }).success,
    ).toBe(false)
  })
  it('accepts a revocation identity and rejects unexpected actor data', () => {
    expect(revokeChecklistDocumentWaiverSchema.parse(request)).toEqual(request)
    expect(
      revokeChecklistDocumentWaiverSchema.safeParse({
        ...request,
        actorId: request.operationId,
      }).success,
    ).toBe(false)
  })
})
