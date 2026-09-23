import { z } from 'zod'
import { PendingReason } from '@hms/core/case-management/domain/structures'

export const createPendingSchema = z.object({
  checklistItemId: z.uuid(),
  documentFileId: z.uuid().optional(),
  documentFileName: z.string().trim().optional(),
  reason: z.enum(PendingReason),
  details: z.string().trim().optional(),
  clientName: z.string().trim().min(1).optional(),
})
