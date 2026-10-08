import { CaseTeamRole } from '@hms/core/case-management/domain/structures'
import { z } from 'zod'
import { uuidSchema } from '../../shared/schemas/uuid-schema'

export const caseTeamMutationSchema = z
  .object({
    operationId: uuidSchema,
    expectedTeamVersion: z.number().int().nonnegative(),
    reason: z.string().trim().optional(),
  })
  .strict()

export const addCaseTeamMemberSchema = caseTeamMutationSchema.extend({
  collaboratorId: uuidSchema,
  role: z.enum(CaseTeamRole),
})

export const changeCaseTeamMemberRoleSchema = caseTeamMutationSchema.extend({
  role: z.enum(CaseTeamRole),
})

export const removeCaseTeamMemberSchema = caseTeamMutationSchema

export type CaseTeamMutationData = z.infer<typeof caseTeamMutationSchema>
export type AddCaseTeamMemberData = z.infer<typeof addCaseTeamMemberSchema>
export type ChangeCaseTeamMemberRoleData = z.infer<
  typeof changeCaseTeamMemberRoleSchema
>
export type RemoveCaseTeamMemberData = z.infer<typeof removeCaseTeamMemberSchema>
