import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).url(),
  HMS_SERVER_APP_PORT: z.coerce.number().default(3333),
  HMS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'stg']),
  HMS_WEB_APP_URL: z.string(),
  OLLAMA_AI_MODEL: z.string().min(1).default('qwen3.5:2b'),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  HMS_USER_SEED_PASSWORD: z.string().min(6).optional(),
  INNGEST_DEV: z.enum(['0', '1']).default('0'),
  INNGEST_BASE_URL: z.string().url().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default(''),
  WHATSAPP_APP_SECRET: z.string().default(''),
  NGROK_DOMAIN: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().default('documents'),
  ),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  constructor(@Inject(ConfigService) private configService: ConfigService<Env, true>) {}

  get<Key extends keyof Env>(key: Key) {
    return this.configService.get<Env[Key]>(key, { infer: true })
  }
}
