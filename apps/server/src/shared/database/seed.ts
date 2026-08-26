import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { CaseManagementSeeder } from '@/case-management/database/case-management-seeder'
import { CommunicationSeeder } from '@/communication/database/communication-seeder'
import { ConsultationSeeder } from '@/consultation/database/consultation-seeder'
import { DocumentsSeeder } from '@/document-engine/database/documents-seeder'
import { RealDocumentsSeeder } from '@/document-engine/database/real-documents-seeder'
import { DocumentProductionSeeder } from '@/document-production/database/document-production-seeder'
import { IDENTITY_PROVIDERS } from '@/identity/constants/identity-providers'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { FormalizationSeeder } from '@/formalization/database/formalization-seeder'
import { LegalCatalogSeeder } from '@/legal-catalog/database/legal-catalog-seeder'
import { SchedulingSeeder } from '@/scheduling/database/scheduling-seeder'
import { DynamicFormsSeeder } from '@/shared/database/dynamic-forms-seeder'
import { createDynamicFormSeeds } from '@/shared/database/dynamic-forms-seed-data'
import { SeedModule } from '@/shared/database/seed.module'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'

const LOGGER = new Logger('DatabaseSeed')

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule)

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
    await app.get(CaseManagementSeeder).clear()
    await app.get(DocumentProductionSeeder).clear()
    await app.get(FormalizationSeeder).clear()
    await app.get(ConsultationSeeder).clear()
    await app.get(SchedulingSeeder).clear()
    await app.get(IntakeSeeder).clear()
    await app.get(RealDocumentsSeeder).clear()
    await app.get(DocumentsSeeder).clear()
    await app.get(DynamicFormsSeeder).clear()

    const authAdministrationProvider = app.get(IDENTITY_PROVIDERS.authAdministration)
    await app.get(IdentitySeeder).clear(authAdministrationProvider)
    await app.get(LegalCatalogSeeder).clear()

    const legalCatalog = await app.get(LegalCatalogSeeder).run()
    const dynamicFormSeeds = createDynamicFormSeeds(legalCatalog)
    const dynamicForms = await app.get(DynamicFormsSeeder).run(dynamicFormSeeds)
    const legalArea = legalCatalog.areas.find((area) => area.name === 'Cível')
    const legalTopic = legalCatalog.topics.find(
      (topic) => topic.legalAreaId === legalArea?.id && topic.name === 'Contratos',
    )

    if (!legalArea || !legalTopic) {
      throw new AppError('Default lawyer legal expertise could not be seeded')
    }

    const consultationDynamicForm = dynamicForms.find(
      ({ name }) => name === 'Triagem Cível',
    )
    if (!consultationDynamicForm) {
      throw new AppError('Default consultation dynamic form could not be seeded')
    }

    const identitySeed = await app
      .get(IdentitySeeder)
      .run(
        authAdministrationProvider,
        { legalAreaId: legalArea.id, legalTopicIds: [legalTopic.id] },
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

    const lawyerIds = identitySeed.collaborators
      .filter(({ profile }) => profile === 'lawyer')
      .map(({ id }) => id)
    const paralegalIds = identitySeed.collaborators
      .filter(({ profile }) => profile === 'paralegal')
      .map(({ id }) => id)

    await app.get(CaseManagementSeeder).run({
      contractedIntakes: intakeSeed.intakes.filter(
        ({ status }) => status === IntakeStatus.Contracted,
      ),
      lawyerIds,
      paralegalIds,
      actorId: actor.id,
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
      dynamicForm: consultationDynamicForm,
    })

    if (!consultationSeed.consultation) {
      throw new AppError('The document-production Consultation could not be seeded')
    }

    const formalizationForm = dynamicForms.find(
      ({ name }) => name === 'Condições comerciais da formalização',
    )
    if (!formalizationForm || !consultationSeed.consultation) {
      throw new AppError('The Formalization seed dependencies could not be resolved')
    }

    const formalization = await app.get(FormalizationSeeder).run({
      intake: intakeSeed.documentProductionIntake,
      consultation: consultationSeed.consultation,
      client,
      assignedLawyer: lawyer,
      contractForm: formalizationForm,
    })

    const documentProductionSeed = await app.get(DocumentProductionSeeder).run({
      legalAreas: legalCatalog.areas,
      legalTopics: legalCatalog.topics,
      consultationId: consultationSeed.consultation.id,
      formalizationId: formalization.id,
      requestedByCollaboratorId: lawyer.id,
    })

    await app.get(CommunicationSeeder).run()
    await app.get(RealDocumentsSeeder).run()
    await app.get(DocumentsSeeder).run()

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
