import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
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

    const clients = await db.select().from(clientModel).limit(3)
    const users = await db.select().from(userModel).limit(1)
    const areas = await db.select().from(legalAreaModel).limit(1)

    if (clients.length < 2 || users.length === 0 || areas.length === 0) {
      return []
    }

    const userId = users[0].id
    const areaId = areas[0].id

    const topics = await db
      .select()
      .from(legalTopicModel)
      .where(eq(legalTopicModel.legalAreaId, areaId))
      .limit(2)

    if (topics.length === 0) return []

    const topicId = topics[0].id
    const altTopicId = topics[1]?.id ?? topicId

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
        demandNotes: 'Primeira demanda de entrada direta.',
        status: IntakeStatus.ConsultationCompleted,
      },
      {
        clientId: clients[0].id,
        responsibleId: userId,
        createdBy: userId,
        updatedBy: userId,
        origin: 'referral',
        contactChannel: 'email',
        legalAreaId: areaId,
        legalTopicId: altTopicId,
        urgency: 'high',
        demandNotes: 'Segunda demanda vinculada via indicação.',
        status: IntakeStatus.Contracted,
      },
      {
        clientId: clients[1].id,
        responsibleId: userId,
        createdBy: userId,
        updatedBy: userId,
        origin: 'website',
        contactChannel: 'phone',
        legalAreaId: areaId,
        legalTopicId: topicId,
        urgency: 'urgent',
        demandNotes: 'Nova solicitação urgente via site.',
        status: IntakeStatus.Registered,
      },
    ]

    return this.seed(mockIntakes)
  }
}
