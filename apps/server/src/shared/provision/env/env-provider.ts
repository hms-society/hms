import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).url(),
  HMS_SERVER_APP_PORT: z.coerce.number().default(3333),
  HMS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'staging']),
  WHATSAPP_API_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_APP_SECRET: z.string().min(1),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  constructor(private configService: ConfigService<Env, true>) {}
  get<Key extends keyof Env>(key: Key) {
    return this.configService.get<Env[Key]>(key, { infer: true })
  }
}
