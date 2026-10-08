import type { CollaboratorProfile } from '@hms/core/identity/domain/structures'

export type CaseTeamCandidatesQuery = {
  search?: string
  profile?: CollaboratorProfile
  page: number
  pageSize: number
}
