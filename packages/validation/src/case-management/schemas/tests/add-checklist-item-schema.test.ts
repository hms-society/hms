import { describe, expect, it } from 'vitest'
import {
  addChecklistItemFormSchema,
  addChecklistItemSchema,
} from '../add-checklist-item-schema'

describe('Add Checklist Item Schema', () => {
  it('trims a named requirement and preserves its retry key', () => {
    expect(
      addChecklistItemSchema.parse({
        title: '  Extrato bancário  ',
        templateItemKey: '  operation-key  ',
      }),
    ).toEqual({
      title: 'Extrato bancário',
      templateItemKey: 'operation-key',
      isRequired: true,
    })
    expect(addChecklistItemFormSchema.parse({ title: '  A  ' })).toEqual({
      title: 'A',
      isRequired: true,
    })
  })
  it.each([
    true,
    false,
  ])('accepts explicit required=%s for both form and API', (isRequired) => {
    expect(addChecklistItemFormSchema.parse({ title: 'Prova', isRequired })).toEqual({
      title: 'Prova',
      isRequired,
    })
    expect(
      addChecklistItemSchema.parse({
        title: 'Prova',
        templateItemKey: 'key',
        isRequired,
      }),
    ).toEqual({ title: 'Prova', templateItemKey: 'key', isRequired })
  })
  it.each([
    'true',
    'false',
    null,
    0,
    1,
    [],
    {},
  ])('rejects nonboolean required value %j', (isRequired) => {
    for (const schema of [addChecklistItemFormSchema, addChecklistItemSchema]) {
      const input =
        schema === addChecklistItemSchema
          ? { title: 'Prova', templateItemKey: 'key', isRequired }
          : { title: 'Prova', isRequired }
      const result = schema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.issues[0]?.path).toEqual(['isRequired'])
    }
  })
  it.each(['', ' ', '\n\t'])('rejects an empty requirement name %j', (title) => {
    expect(addChecklistItemFormSchema.safeParse({ title }).success).toBe(false)
    expect(
      addChecklistItemSchema.safeParse({ title, templateItemKey: 'key' }).success,
    ).toBe(false)
  })
  it.each([
    '',
    '  ',
    undefined,
    1,
  ])('requires a nonempty retry key %j', (templateItemKey) => {
    expect(
      addChecklistItemSchema.safeParse({ title: 'Prova', templateItemKey }).success,
    ).toBe(false)
  })
  it.each([
    { status: 'validated' },
    { collaboratorId: 'foreign' },
    { caseId: 'foreign' },
    { documentFileId: 'foreign' },
  ])('refuses caller-owned state or context injection %j', (extra) => {
    expect(
      addChecklistItemSchema.safeParse({
        title: 'Prova',
        templateItemKey: 'key',
        ...extra,
      }).success,
    ).toBe(false)
  })
})
