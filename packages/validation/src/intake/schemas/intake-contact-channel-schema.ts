import { ContactChannel } from '@hms/core/intake/domain/structures'
import { z } from 'zod'

export const intakeContactChannelSchema = z.enum(ContactChannel)
