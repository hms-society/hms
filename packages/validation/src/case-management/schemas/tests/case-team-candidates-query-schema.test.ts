import { describe, expect, it } from 'vitest'

import { caseTeamCandidatesQuerySchema } from '../case-team-candidates-query-schema'

describe('caseTeamCandidatesQuerySchema', () => {
  it('trims search, supplies defaults, and accepts pagination boundaries', () => {
    expect(caseTeamCandidatesQuerySchema.parse({ search: '  Maria  ', profile: 'lawyer' })).toEqual({
      page: 1,
      pageSize: 20,
      search: 'Maria',
      profile: 'lawyer',
    })
    expect(caseTeamCandidatesQuerySchema.safeParse({ page: '1', pageSize: '1' }).success).toBe(true)
    expect(caseTeamCandidatesQuerySchema.safeParse({ page: '1', pageSize: '100' }).success).toBe(true)
  })

  it('rejects invalid pages, profile/Case UUIDs, and extra fields', () => {
    for (const query of [
      { page: '0' },
      { pageSize: '0' },
      { pageSize: '101' },
      { profile: 'not-a-profile' },
      { caseId: 'bad-id' },
      { excludeCollaboratorIds: ['00000000-0000-4000-8000-000000000001'] },
    ]) {
      expect(caseTeamCandidatesQuerySchema.safeParse(query).success).toBe(false)
    }
  })
})
