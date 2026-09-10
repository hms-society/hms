import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const sendCommunicationSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1),
  channel: z.enum(['whatsapp', 'email', 'phone']),
})

export class SendCommunicationDto extends createZodDto(sendCommunicationSchema) {}
