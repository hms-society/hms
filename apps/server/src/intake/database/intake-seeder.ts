import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE, type DrizzleDB } from '@/shared/database/database.provider'
import { clientModel } from '@/identity/database/drizzle/models'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { legalAreaModel, legalTopicModel } from '@/legal-catalog/database/drizzle/models'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import type { IntakeCreation } from '@hms/core/intake/domain/entities'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'

const DEFAULT_INTAKE_COUNT = 25

export type IntakeSeedReferences = {
  clientIds: readonly string[]
  responsibleIds: readonly string[]
  actorIds: readonly string[]
  legalAreaId: string
  legalTopicId: string
}

@Injectable()
export class IntakeSeeder {
  constructor(
    @Inject(DRIZZLE) private readonly database: DrizzleDB,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
  ) {}

  seed(intakes: IntakeCreation[] = []) {
    return this.intakesRepository.addMany(intakes)
  }

  clear() {
    return this.intakesRepository.removeAll()
  }

  async run(references?: IntakeSeedReferences) {
    const clients = await this.database.select().from(clientModel)
    const users = await this.database.select().from(userModel)

    const attendant = users.find((u) => u.email === 'attendant@hmsadvogados.com.br')
    const responsibleId = attendant?.id || references?.responsibleIds[0] || clients[0]?.id

    if (!responsibleId || clients.length === 0) {
      throw new Error('Intake seed requirements are not met')
    }

    const areas = await this.database.select().from(legalAreaModel)
    const topics = await this.database.select().from(legalTopicModel)

    if (areas.length === 0 || topics.length === 0) {
      throw new Error('Legal areas and topics are required')
    }

    const testClient = clients.find((c) => c.email === 'client@hms.br')
    const intakesToSeed: IntakeCreation[] = []

    if (testClient) {
      // 1. Consultation Scheduled
      const civArea = areas.find((a) => a.name === 'Cível') || areas[0]
      const civTopic = topics.find((t) => t.legalAreaId === civArea.id) || topics[0]
      intakesToSeed.push({
        clientId: testClient.id,
        responsibleId,
        createdBy: responsibleId,
        updatedBy: responsibleId,
        origin: 'direct' as const,
        contactChannel: 'whatsapp' as const,
        legalAreaId: civArea.id,
        legalTopicId: civTopic.id,
        urgency: 'normal' as const,
        demandNotes: 'Cliente solicita análise de contrato de aluguel residencial.',
        status: IntakeStatus.ConsultationScheduled,
      })

      // 2. Registered (Pending docs)
      const trabArea = areas.find((a) => a.name === 'Trabalhista') || areas[0]
      const trabTopic = topics.find((t) => t.legalAreaId === trabArea.id) || topics[0]
      intakesToSeed.push({
        clientId: testClient.id,
        responsibleId,
        createdBy: responsibleId,
        updatedBy: responsibleId,
        origin: 'direct' as const,
        contactChannel: 'whatsapp' as const,
        legalAreaId: trabArea.id,
        legalTopicId: trabTopic.id,
        urgency: 'high' as const,
        demandNotes: 'Demissão sem justa causa, verbas rescisórias não pagas.',
        status: IntakeStatus.Registered,
      })

      // 3. Contracted
      const famArea = areas.find((a) => a.name === 'Família') || areas[0]
      const famTopic = topics.find((t) => t.legalAreaId === famArea.id) || topics[0]
      intakesToSeed.push({
        clientId: testClient.id,
        responsibleId,
        createdBy: responsibleId,
        updatedBy: responsibleId,
        origin: 'direct' as const,
        contactChannel: 'email' as const,
        legalAreaId: famArea.id,
        legalTopicId: famTopic.id,
        urgency: 'normal' as const,
        demandNotes: 'Divórcio consensual e partilha de bens.',
        status: IntakeStatus.Contracted,
      })
    }

    // Seed 1 simple intake for the other seeded clients
    for (const client of clients) {
      if (client.email === 'client@hms.br') continue
      const area = areas[Math.floor(Math.random() * areas.length)]
      const topic = topics.find((t) => t.legalAreaId === area.id) || topics[0]
      intakesToSeed.push({
        clientId: client.id,
        responsibleId,
        createdBy: responsibleId,
        updatedBy: responsibleId,
        origin: 'direct' as const,
        contactChannel: 'phone' as const,
        legalAreaId: area.id,
        legalTopicId: topic.id,
        urgency: 'normal' as const,
        demandNotes: 'Consulta inicial sobre direito contratual.',
        status: IntakeStatus.Registered,
      })
    }

    return this.seed(intakesToSeed)
  }
}
