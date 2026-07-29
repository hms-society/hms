import { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const intakeClosureReasonSchema = z.enum(IntakeClosureReason)
