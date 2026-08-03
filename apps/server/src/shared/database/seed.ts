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
    const mode = envProvider.get('HMS_SERVER_APP_MODE')
    if (mode !== 'dev' && mode !== 'stg') {
      throw new AppError(
        'Database seed is only allowed when HMS_SERVER_APP_MODE=dev or stg',
      )
    }

    const seedPassword = envProvider.get('HMS_USER_SEED_PASSWORD')
    if (!seedPassword) {
      throw new AppError('HMS_USER_SEED_PASSWORD is required when seeding dev or staging')
    }

    await app.get(IntakeSeeder).clear()
    await app.get(LegalCatalogSeeder).clear()
    await app.get(IntakeSeeder).clear()
    await app.get(LegalCatalogSeeder).clear()

    const authAdministrationProvider = app.get(IDENTITY_PROVIDERS.authAdministration)
    await app.get(IdentitySeeder).clear(authAdministrationProvider)
    await app.get(CommunicationSeeder).clear()


    await app.get(IdentitySeeder).clear(authAdministrationProvider)

    const legalCatalog = await app.get(LegalCatalogSeeder).run()
    const legalArea = legalCatalog.areas.find((area) => area.name === 'Cível')
    const legalTopic = legalCatalog.topics.find(
      (topic) => topic.legalAreaId === legalArea?.id && topic.name === 'Contratos',
    )

    if (!legalArea || !legalTopic) {
      throw new AppError('Default lawyer legal expertise could not be seeded')
    }

    await app.get(IdentitySeeder).run(
      authAdministrationProvider,
      {
        legalAreaId: legalArea.id,
        legalTopicIds: [legalTopic.id],
      },
      seedPassword,
    )
    await app.get(IntakeSeeder).run()
    await app.get(CommunicationSeeder).run()
  } finally {
    await app.close()
  }
}

bootstrap()
