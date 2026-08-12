import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from '@/app.module'
import { ConsultationSeeder } from '@/consultation/database/consultation-seeder'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { AppError } from '@hms/core/shared/domain/errors'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import { SchedulingSeeder } from '@/scheduling/database/scheduling-seeder'

const LOGGER = new Logger('DatabaseSeed')

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

    await app.get(CommunicationSeeder).clear()
    await app.get(DocumentProductionSeeder).clear()
    await app.get(ConsultationSeeder).clear()
    await app.get(SchedulingSeeder).clear()
    await app.get(IntakeSeeder).clear()
    const authAdministrationProvider = app.get(IDENTITY_PROVIDERS.authAdministration)

    await app.get(IdentitySeeder).clear(authAdministrationProvider)
    await app.get(LegalCatalogSeeder).clear()

    const legalCatalog = await app.get(LegalCatalogSeeder).run()
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
    const client = identitySeed.clients.find(({ email }) => email === 'client@hms.br')
    const lawyer = identitySeed.collaborators.find(({ profile }) => profile === 'lawyer')
    const attendant = identitySeed.collaborators.find(
      ({ profile }) => profile === 'attendant',
    )
    const actor = identitySeed.users.find(
      ({ email }) => email === 'lawyer@hmsadvogados.com.br',
    )

    if (!client || !lawyer || !attendant || !actor) {
      throw new AppError('Document Production seed identities could not be resolved')
    }

    const intakeSeed = await app.get(IntakeSeeder).run({
      clientIds: identitySeed.clients.map(({ id }) => id),
      documentProductionClientId: client.id,
      responsibleId: attendant.id,
      actorId: actor.id,
      legalAreaId: legalArea.id,
      legalTopicId: legalTopic.id,
    })
    const schedulingSeed = await app.get(SchedulingSeeder).run({
      intakeId: intakeSeed.documentProductionIntake.id,
      clientId: client.id,
      assignedLawyerId: lawyer.id,
    })
    const consultationSeed = await app.get(ConsultationSeeder).run({
      intakeId: intakeSeed.documentProductionIntake.id,
      appointmentId: schedulingSeed.appointment.id,
      clientId: client.id,
      assignedLawyerId: lawyer.id,
      legalAreaId: legalArea.id,
      legalTopicId: legalTopic.id,
    })
    if (!consultationSeed.consultation) {
      throw new AppError('The document-production Consultation could not be seeded')
    }

    const documentProductionSeed = await app.get(DocumentProductionSeeder).run({
      legalAreas: legalCatalog.areas,
      legalTopics: legalCatalog.topics,
      consultationId: consultationSeed.consultation.id,
    })
    await app.get(CommunicationSeeder).run()

    LOGGER.log(
      JSON.stringify({
        consultationId: consultationSeed.consultation.id,
        documentIds: documentProductionSeed.documents.map(({ id }) => id),
        assignedLawyerEmail: actor.email,
      }),
    )
  } finally {
    await app.close()
  }
}

bootstrap().catch((err) => {
  console.error('SEED FAILED:', err)
  process.exit(1)
})
