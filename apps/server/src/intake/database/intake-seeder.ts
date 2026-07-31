import { Inject, Injectable } from '@nestjs/common'
import type { IntakeCreation } from '@hms/core/intake/domain/entities'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { legalAreaModel, legalTopicModel } from '@/legal-catalog/database/drizzle/models'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

@Injectable()
export class IntakeSeeder {
  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
    
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
  ) {}

  seed(intakes: IntakeCreation[] = []) {
    return this.intakesRepository.addMany(intakes)
  }

  clear() {
    return this.intakesRepository.removeAll()
  }

  async run() {
    const db = this.drizzleClient.requireDatabase()

    const clients = await db.select().from(clientModel).limit(5)
    const users = await db.select().from(userModel).limit(1)
    const areas = await db.select().from(legalAreaModel).limit(2)
    const topics = await db.select().from(legalTopicModel).limit(2)

    // Se faltarem dados base, abortamos a criação de intakes para evitar erros de Foreign Key
    if (clients.length === 0 || users.length === 0 || areas.length === 0 || topics.length === 0) {
      return []
    }

    const userId = users[0].id
    const areaId = areas[0].id
    const topicId = topics[0].id

    const mockIntakes: IntakeCreation[] = [
      {
        clientId: clients[0].id,
        responsibleId: userId,
        createdBy: userId,
        updatedBy: userId,
        origin: 'direct',
        contactChannel: 'whatsapp',
        legalAreaId: areaId,
        legalTopicId: topicId,
        urgency: 'normal',
        demandNotes: 'Atendimento via entrada direta',
        status: IntakeStatus.ConsultationScheduled,
      },
      {
        clientId: clients[1]?.id ?? clients[0].id,
        responsibleId: userId,
        createdBy: userId,
        updatedBy: userId,
        origin: 'referral',
        contactChannel: 'phone',
        legalAreaId: areaId,
        legalTopicId: topicId,
        urgency: 'high',
        demandNotes: 'Cliente indicado por parceiro',
        status: IntakeStatus.Registered,
      },
      {
        clientId: clients[2]?.id ?? clients[0].id,
        responsibleId: userId,
        createdBy: userId,
        updatedBy: userId,
        origin: 'website',
        contactChannel: 'email',
        legalAreaId: areaId,
        legalTopicId: topicId,
        urgency: 'normal',
        demandNotes: 'Contato realizado pelo site institucional',
        status: IntakeStatus.Contracted,
      },
      {
        clientId: clients[3]?.id ?? clients[0].id,
        responsibleId: userId,
        createdBy: userId,
        updatedBy: userId,
        origin: 'social_media',
        contactChannel: 'whatsapp',
        legalAreaId: areaId,
        legalTopicId: topicId,
        urgency: 'urgent',
        demandNotes: 'Lead capturado pelas redes sociais',
        status: IntakeStatus.ConsultationCompleted,
      },
    ]

    return this.seed(mockIntakes)
  }
}