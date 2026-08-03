import { UserStatus } from '@hms/core/identity/domain/structures'
import { z } from 'zod'

export const userStatusSchema = z.enum(UserStatus)
