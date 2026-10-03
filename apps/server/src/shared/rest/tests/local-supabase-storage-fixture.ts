import { ConfigService } from '@nestjs/config'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { SupabaseStorageProvider } from '@/shared/provision/storage/supabase-storage-provider'

export class LocalSupabaseStorageFixture {
  static configure(builder: TestingModuleBuilder) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Nest testing builder APIs are not React hooks.
    return builder.overrideProvider(STORAGE_PROVIDER).useFactory({
      inject: [ConfigService],
      factory: (config: ConfigService) => {
        const storageUrl = config.get<string>('SUPABASE_URL')
        const storageKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
        if (!storageUrl || !storageKey) {
          throw new Error('Local Supabase Storage credentials are required')
        }
        return new SupabaseStorageProvider({
          get: (name: string) =>
            name === 'SUPABASE_URL'
              ? storageUrl
              : name === 'SUPABASE_SERVICE_ROLE_KEY'
                ? storageKey
                : config.get(name),
        } as EnvProvider)
      },
    })
  }
}
