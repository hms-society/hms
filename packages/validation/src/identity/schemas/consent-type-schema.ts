import { ConsentType } from '@hms/core/identity/domain/structures'
import { z } from 'zod'

export const consentTypeSchema = z.enum(ConsentType)
