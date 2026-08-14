import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { envSchema, EnvProvider } from '@/shared/provision/env/env-provider'
import { SupabaseStorageProvider } from './storage/supabase-storage-provider'

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER')

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: (config) => envSchema.parse(config),
    }),
  ],
  providers: [
    EnvProvider,
    DatetimeProvider,
    SupabaseStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: SupabaseStorageProvider,
    },
  ],
  exports: [EnvProvider, DatetimeProvider, STORAGE_PROVIDER],
})
export class ProvisionModule {}
