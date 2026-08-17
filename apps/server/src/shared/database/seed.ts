import { type INestApplicationContext } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from '@/app.module'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { AppError } from '@hms/core/shared/domain/errors'
import { DocumentsSeeder } from '@/document-engine/database/documents-seeder'
import { RealDocumentsSeeder } from '@/document-engine/database/real-documents-seeder'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'

export async function seedDatabase(app: INestApplicationContext) {
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
  await app.get(DocumentProductionSeeder).clear()
  await app.get(LegalCatalogSeeder).clear()
  await app.get(RealDocumentsSeeder).clear()
  await app.get(DocumentsSeeder).clear()

  const authAdministrationProvider = app.get(IDENTITY_PROVIDERS.authAdministration)

  await app.get(IdentitySeeder).clear(authAdministrationProvider)
  await app.get(CommunicationSeeder).clear()

  const legalCatalog = await app.get(LegalCatalogSeeder).run()
  await app.get(DocumentProductionSeeder).run({
    legalAreas: legalCatalog.areas,
    legalTopics: legalCatalog.topics,
  })
  const legalArea = legalCatalog.areas.find((area) => area.name === 'Cível')
  const legalTopic = legalCatalog.topics.find(
    (topic) => topic.legalAreaId === legalArea?.id && topic.name === 'Contratos',
  )

  if (!legalArea || !legalTopic) {
    throw new AppError('Default lawyer legal expertise could not be seeded')
  }

  const identitySeed = await app.get(IdentitySeeder).run(
    authAdministrationProvider,
    {
      legalAreaId: legalArea.id,
      legalTopicIds: [legalTopic.id],
    },
    seedPassword,
  )
  await app.get(IntakeSeeder).run({
    clientIds: identitySeed.clients.map(({ id }) => id),
    responsibleIds: identitySeed.collaborators.map(({ id }) => id),
    actorIds: identitySeed.users.map(({ id }) => id),
    legalAreaId: legalArea.id,
    legalTopicId: legalTopic.id,
  })
  await app.get(CommunicationSeeder).run()
  await app.get(RealDocumentsSeeder).run()
  await app.get(DocumentsSeeder).run()
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)

  try {
    await seedDatabase(app)
  } finally {
    await app.close()
  }
}

bootstrap().catch((err) => {
  console.error('SEED FAILED:', err)
  process.exit(1)
})
