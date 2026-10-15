import { describe, expect, it } from 'vitest'
import { caseHistoryQuerySchema, registerCaseUpdateSchema } from '../case-history-schema'
import { CaseHistoryCategory } from '@hms/core/case-management/domain/structures'
const VALID = {
  operationId: '0664ce0c-5380-4a9e-bb31-d85adad4d8b8',
  occurredAt: '2026-10-10T12:00:00-03:00',
  description: ' Andamento ',
}
describe('Case History Schema', () => {
  it('defaults query limit and trims search', () => {
    expect(caseHistoryQuerySchema.parse({ search: ' test ' })).toEqual({
      search: 'test',
      limit: 20,
    })
  })
  it.each(
    Object.values(CaseHistoryCategory),
  )('accepts canonical category %s', (category) => {
    expect(caseHistoryQuerySchema.parse({ category, limit: '50' })).toEqual({
      category,
      limit: 50,
    })
  })
  it.each([
    { limit: 0 },
    { limit: 51 },
    { limit: 1.5 },
    { category: 'other' },
    { search: 'x'.repeat(201) },
    { cursor: '' },
    { cursor: 'x'.repeat(2049) },
    { actorId: 'other' },
  ])('rejects invalid queries %j', (input) => {
    expect(caseHistoryQuerySchema.safeParse(input).success).toBe(false)
  })
  it('normalizes manual text and defaults optional references', () => {
    expect(registerCaseUpdateSchema.parse(VALID)).toEqual({
      ...VALID,
      description: 'Andamento',
      documentIds: [],
    })
  })
  it.each([
    { description: '' },
    { description: '  ' },
    { description: 'x'.repeat(5001) },
    { operationId: 'invalid' },
    { occurredAt: '2026-02-30T12:00:00Z' },
    { occurredAt: '2026-10-10T12:00:00' },
    { documentIds: ['bad'] },
    { documentIds: Array(21).fill(VALID.operationId) },
    { actorId: 'forged' },
    { kind: 'task_created' },
    { recordedAt: '2026-10-10T12:00:00Z' },
  ])('rejects invalid manual payload %j', (change) => {
    expect(registerCaseUpdateSchema.safeParse({ ...VALID, ...change }).success).toBe(
      false,
    )
  })
  it('accepts all maximum length boundaries', () => {
    expect(
      registerCaseUpdateSchema.safeParse({
        ...VALID,
        description: 'x'.repeat(5000),
        documentIds: Array(20).fill(VALID.operationId),
      }).success,
    ).toBe(true)
    expect(
      caseHistoryQuerySchema.safeParse({
        search: 'x'.repeat(200),
        cursor: 'x'.repeat(2048),
        limit: 1,
      }).success,
    ).toBe(true)
  })
})
