import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).url(),
  HMS_SERVER_APP_PORT: z.coerce.number().default(3333),
  HMS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'stg']),
  HMS_WEB_APP_URL: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  HMS_USER_SEED_PASSWORD: z.string().min(6).optional(),
  WHATSAPP_API_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default(''),
  WHATSAPP_APP_SECRET: z.string().default(''),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  constructor(@Inject(ConfigService) private configService: ConfigService<Env, true>) {}
  get<Key extends keyof Env>(key: Key) {
    return this.configService.get<Env[Key]>(key, { infer: true })
  }
}
