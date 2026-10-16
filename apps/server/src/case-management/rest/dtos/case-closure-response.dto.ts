import {
  CaseClosureEventType,
  CaseClosureOutcome,
  LegalCaseLifecycleStatus,
  LegalCaseWorkflowStage,
} from '@hms/core/case-management/domain/structures'
import { legalCaseSchema } from '@hms/validation/case-management'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const outcomes = Object.values(CaseClosureOutcome) as [
  (typeof CaseClosureOutcome)[keyof typeof CaseClosureOutcome],
  ...(typeof CaseClosureOutcome)[keyof typeof CaseClosureOutcome][],
]
const eventTypes = Object.values(CaseClosureEventType) as [
  (typeof CaseClosureEventType)[keyof typeof CaseClosureEventType],
  ...(typeof CaseClosureEventType)[keyof typeof CaseClosureEventType][],
]
const lifecycleStatuses = Object.values(LegalCaseLifecycleStatus) as [
  (typeof LegalCaseLifecycleStatus)[keyof typeof LegalCaseLifecycleStatus],
  ...(typeof LegalCaseLifecycleStatus)[keyof typeof LegalCaseLifecycleStatus][],
]
const workflowStages = Object.values(LegalCaseWorkflowStage) as [
  (typeof LegalCaseWorkflowStage)[keyof typeof LegalCaseWorkflowStage],
  ...(typeof LegalCaseWorkflowStage)[keyof typeof LegalCaseWorkflowStage][],
]

const caseClosureEventSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  type: z.enum(eventTypes),
  actorId: z.string().uuid(),
  actorName: z.string(),
  occurredAt: z.iso.datetime(),
  outcome: z.enum(outcomes).optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
})

export const caseClosureSnapshotResponseSchema = z.object({
  legalCase: legalCaseSchema.extend({
    lifecycleStatus: z.enum(lifecycleStatuses),
    workflowStage: z.enum(workflowStages).optional(),
  }),
  closure: z
    .object({
      outcome: z.enum(outcomes),
      notes: z.string().optional(),
      closedBy: z.string().uuid(),
      closedByName: z.string(),
      closedAt: z.iso.datetime(),
    })
    .optional(),
  blockers: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['legal_deadline', 'blocking_task', 'required_checklist_item']),
      title: z.string(),
      description: z.string().optional(),
      section: z.enum(['deadlines', 'tasks', 'checklist']),
      href: z.string(),
    }),
  ),
  events: z.array(caseClosureEventSchema),
  capabilities: z.object({ canClose: z.boolean(), canReopen: z.boolean() }),
})

export class CaseClosureSnapshotResponseDto extends createZodDto(
  caseClosureSnapshotResponseSchema,
) {}

export class CloseCaseResponseDto extends createZodDto(
  z.object({
    kind: z.enum(['closed', 'blocked']),
    legalCase: legalCaseSchema
      .extend({
        lifecycleStatus: z.enum(lifecycleStatuses),
        workflowStage: z.enum(workflowStages).optional(),
      })
      .optional(),
    closure: z
      .object({
        outcome: z.enum(outcomes),
        notes: z.string().optional(),
        closedBy: z.string().uuid(),
        closedAt: z.iso.datetime(),
      })
      .optional(),
    event: caseClosureEventSchema.optional(),
    blockers: caseClosureSnapshotResponseSchema.shape.blockers.optional(),
  }),
) {}
