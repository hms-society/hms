import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const intakeStatusSchema = z.enum(IntakeStatus)
