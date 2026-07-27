import { IntakeUrgency } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const intakeUrgencySchema = z.enum(IntakeUrgency)
