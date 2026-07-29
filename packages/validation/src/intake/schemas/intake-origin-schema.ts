import { IntakeOrigin } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const intakeOriginSchema = z.enum(IntakeOrigin)
