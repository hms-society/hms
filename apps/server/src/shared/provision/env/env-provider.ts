import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).url(),
  HMS_SERVER_APP_PORT: z.coerce.number().int().positive().max(65535),
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
  GOTENBERG_URL: z.string().url().default('http://127.0.0.1:3003'),
  GOTENBERG_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  GOTENBERG_MAX_INPUT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(25 * 1024 * 1024),
  GOTENBERG_MAX_OUTPUT_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(50 * 1024 * 1024),
  DOCUMENSO_PRIVATE_BASE_URL: z.string().url().default('http://127.0.0.1:3004'),
  DOCUMENSO_API_V2_KEY: z.string().default(''),
  DOCUMENSO_WEBHOOK_SECRET: z.string().default(''),
  DOCUMENSO_EXPECTED_VERSION: z.string().default('2.17.0'),
  HMS_SIGNING_OTP_PEPPER: z.string().default(''),
  HMS_SIGNING_IP_FINGERPRINT_KEY: z.string().default(''),
  HMS_SIGNING_CIPHER: z.string().default('aes-256-gcm'),
  HMS_SIGNING_CIPHER_KEY_ID: z.string().default('local'),
  HMS_SIGNING_PROXY_PUBLIC_PREFIX: z.string().default('/assinaturas/provedor'),
  HMS_SIGNING_INVITATION_MAX_AGE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(604_800),
  HMS_SIGNING_SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86_400),
  HMS_SIGNING_RESULT_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86_400),
  HMS_SIGNING_PROXY_IDLE_TIMEOUT_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(1_800),
  HMS_SIGNING_OTP_EXPIRY_SECONDS: z.coerce.number().int().positive().default(1_800),
  HMS_SIGNING_OTP_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  RESEND_API_KEY: z.string().default(''),
  HMS_SIGNING_EMAIL_FROM: z.string().default(''),
  MAILPIT_API_URL: z.string().url().default('http://127.0.0.1:8025'),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  constructor(@Inject(ConfigService) private configService: ConfigService<Env, true>) {}

  get<Key extends keyof Env>(key: Key) {
    return this.configService.get<Env[Key]>(key, { infer: true })
  }
}
