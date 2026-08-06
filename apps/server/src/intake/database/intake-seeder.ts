import { Inject, Injectable } from '@nestjs/common'
import type { IntakeCreation } from '@hms/core/intake/domain/entities'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { legalAreaModel, legalTopicModel } from '@/legal-catalog/database/drizzle/models'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import { DRIZZLE, type DrizzleDB } from '@/shared/database/drizzle/database.provider'

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

  run(references: IntakeSeedReferences) {
    if (
      references.clientIds.length === 0 ||
      references.responsibleIds.length === 0 ||
      references.actorIds.length === 0
    ) {
      throw new Error('Intake seed references are required')
    }

    const intakes = Array.from({ length: DEFAULT_INTAKE_COUNT }, (_, index) => {
      const intake = IntakeFaker.fake({
        clientId: references.clientIds[index % references.clientIds.length],
        responsibleId:
          references.responsibleIds[index % references.responsibleIds.length],
        createdBy: references.actorIds[index % references.actorIds.length],
        updatedBy: references.actorIds[index % references.actorIds.length],
        legalAreaId: references.legalAreaId,
        legalTopicId: references.legalTopicId,
      })

      return {
        clientId: intake.clientId,
        responsibleId: intake.responsibleId,
        createdBy: intake.createdBy,
        updatedBy: intake.updatedBy,
        origin: intake.origin,
        contactChannel: intake.contactChannel,
        legalAreaId: intake.legalAreaId,
        legalTopicId: intake.legalTopicId,
        urgency: intake.urgency,
        demandNotes: intake.demandNotes,
        status: intake.status,
        closureReason: intake.closureReason,
        closureNotes: intake.closureNotes,
        closedAt: intake.closedAt,
      }
    })

    return this.seed(intakes)
  }
}
