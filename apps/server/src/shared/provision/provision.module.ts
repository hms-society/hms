import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { envSchema, EnvProvider } from '@/shared/provision/env/env-provider'
import { SupabaseFileStorageProvider } from '@/shared/provision/file-storage/supabase-file-storage-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { SupabaseStorageProvider } from '@/shared/provision/storage/supabase-storage-provider'

export const STORAGE_PROVIDER = PROVISION_PROVIDERS.storage

@Module({
  imports: [
    SharedDatabaseModule,
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
    SupabaseStorageProvider,
    SupabaseFileStorageProvider,
    {
      provide: PROVISION_PROVIDERS.fileStorage,
      useExisting: SupabaseFileStorageProvider,
    },
    {
      provide: PROVISION_PROVIDERS.storage,
      useExisting: SupabaseStorageProvider,
    },
  ],
  exports: [
    EnvProvider,
    DatetimeProvider,
    IdProvider,
    PROVISION_PROVIDERS.fileStorage,
    PROVISION_PROVIDERS.storage,
  ],
})
export class ProvisionModule {}
