import { IntakeDecision } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const intakeDecisionSchema = z.enum(IntakeDecision)
