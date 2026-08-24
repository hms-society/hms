import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { z } from 'zod'

export const legalCaseStatusSchema = z.enum(LegalCaseStatus)
