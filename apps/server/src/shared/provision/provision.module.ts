import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { envSchema, EnvProvider } from '@/shared/provision/env/env-provider'
import { FakeFileStorageProvider } from '@/shared/provision/file-storage/fake-file-storage-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { SupabaseStorageProvider } from '@/shared/provision/storage/supabase-storage-provider'

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
    IdProvider,
    FakeFileStorageProvider,
    SupabaseStorageProvider,
    {
      provide: PROVISION_PROVIDERS.fileStorage,
      useExisting: FakeFileStorageProvider,
    },
    {
      provide: STORAGE_PROVIDER,
      useExisting: SupabaseStorageProvider,
    },
  ],
  exports: [
    EnvProvider,
    DatetimeProvider,
    IdProvider,
    PROVISION_PROVIDERS.fileStorage,
    STORAGE_PROVIDER,
  ],
})
export class ProvisionModule {}
