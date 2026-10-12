import { z } from 'zod'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { uuidSchema } from '../../shared/schemas/uuid-schema'

export const teamMemberSchema = z
  .object({
    collaboratorId: uuidSchema,
    role: z.enum(CaseMemberRole),
  })
  .strict()

export const createCaseSchema = z
  .object({
    title: z.string().trim().min(1),
    intakeId: uuidSchema,
    legalAreaId: uuidSchema,
    legalTopicId: uuidSchema,
    description: z.string().optional(),
    initialManagerCollaboratorId: uuidSchema,
    team: z.array(teamMemberSchema),
    operationId: uuidSchema,
  })
  .strict()

export type CreateCaseData = z.infer<typeof createCaseSchema>
