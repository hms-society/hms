import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).url(),
  SERVER_APP_PORT: z.coerce.number().default(3333),
  SERVER_APP_MODE: z.enum(['dev', 'prod', 'staging']),
})

type Env = z.infer<typeof envSchema>

@Injectable()
export class EnvProvider {
  constructor(private configService: ConfigService<Env, true>) {}
  get<Key extends keyof Env>(key: Key) {
    return this.configService.get<Env[Key]>(key, { infer: true })
  }
}
