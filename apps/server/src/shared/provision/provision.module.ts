import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { envSchema, EnvProvider } from '@/shared/provision/env/env-provider'
import { FakeFileStorageProvider } from '@/shared/provision/file-storage/fake-file-storage-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'

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
    {
      provide: PROVISION_PROVIDERS.fileStorage,
      useExisting: FakeFileStorageProvider,
    },
  ],
  exports: [EnvProvider, DatetimeProvider, IdProvider, PROVISION_PROVIDERS.fileStorage],
})
export class ProvisionModule {}
