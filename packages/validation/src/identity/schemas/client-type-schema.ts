import { ClientType } from '@hms/core/identity/domain/structures'
import { z } from 'zod'

export const clientTypeSchema = z.enum(ClientType)
