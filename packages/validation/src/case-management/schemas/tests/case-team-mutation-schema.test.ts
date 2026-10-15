import { describe, expect, it } from 'vitest'

import {
  addCaseTeamMemberSchema,
  caseTeamMutationSchema,
  changeCaseTeamMemberRoleSchema,
  removeCaseTeamMemberSchema,
} from '../case-team-mutation-schema'

const operationId = '00000000-0000-4000-8000-000000000001'
const collaboratorId = '00000000-0000-4000-8000-000000000002'
const base = { operationId, expectedTeamVersion: 0 }

describe('case team mutation schemas', () => {
  it('accepts canonical roles and removes whitespace from optional reasons', () => {
    expect(
      addCaseTeamMemberSchema.parse({
        ...base,
        collaboratorId,
        role: 'collaborator',
        reason: '  motivo  ',
      }),
    ).toEqual({ ...base, collaboratorId, role: 'collaborator', reason: 'motivo' })
    expect(changeCaseTeamMemberRoleSchema.safeParse({ ...base, role: 'manager' }).success).toBe(true)
    expect(removeCaseTeamMemberSchema.safeParse(base).success).toBe(true)
  })

  it('rejects malformed UUIDs, legacy roles, negative or fractional versions, and actor injection', () => {
    expect(caseTeamMutationSchema.safeParse({ operationId: 'invalid', expectedTeamVersion: 1 }).success).toBe(false)
    expect(addCaseTeamMemberSchema.safeParse({ ...base, collaboratorId, role: 'lawyer' }).success).toBe(false)
    expect(caseTeamMutationSchema.safeParse({ ...base, expectedTeamVersion: -1 }).success).toBe(false)
    expect(caseTeamMutationSchema.safeParse({ ...base, expectedTeamVersion: 1.5 }).success).toBe(false)
    expect(caseTeamMutationSchema.safeParse({ ...base, actorId: collaboratorId }).success).toBe(false)
  })
})
