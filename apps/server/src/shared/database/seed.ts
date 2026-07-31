import { NestFactory } from '@nestjs/core'

import { AppModule } from '@/app.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { AppError } from '@hms/core/shared/domain/errors'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)

  try {
    const envProvider = app.get(EnvProvider)
    if (envProvider.get('HMS_SERVER_APP_MODE') !== 'dev') {
      throw new AppError('Database seed is only allowed when HMS_SERVER_APP_MODE=dev')
    }

    await app.get(IntakeSeeder).clear()
    await app.get(LegalCatalogSeeder).clear()
    await app.get(IdentitySeeder).clear()
    await app.get(CommunicationSeeder).clear()

    await app.get(IdentitySeeder).run(app.get(IDENTITY_PROVIDERS.auth))
    await app.get(LegalCatalogSeeder).run()
    await app.get(IntakeSeeder).run()
    await app.get(CommunicationSeeder).run()
  } finally {
    await app.close()
  }
}

bootstrap()
