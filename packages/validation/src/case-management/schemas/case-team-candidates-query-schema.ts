import { z } from 'zod'
import { collaboratorProfileSchema } from '../../identity/schemas/collaborator-profile-schema'
import { paginationQuerySchema } from '../../shared/schemas/pagination-query-schema'
import { uuidSchema } from '../../shared/schemas/uuid-schema'

export const caseTeamCandidatesQuerySchema = paginationQuerySchema
  .extend({
    search: z.string().trim().optional(),
    profile: collaboratorProfileSchema.optional(),
    caseId: uuidSchema.optional(),
  })
  .strict()

export type CaseTeamCandidatesQueryData = z.infer<
  typeof caseTeamCandidatesQuerySchema
>
