import type { INestApplication, Type } from '@nestjs/common'
import type { Intake, IntakeCreation } from '@hms/core/intake/domain/entities'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { DrizzleIntakesRepository } from '@/intake/database/drizzle/repositories'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class IntakeModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly intakesRepository: DrizzleIntakesRepository,
    private readonly intakeSeeder: IntakeSeeder,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller: Type<unknown>) {
    const restFixture = await RestFixture.register({
      imports: [IntakeDatabaseModule],
      controllers: [controller],
      providers: [DatetimeProvider],
    })

    return new IntakeModuleFixture(
      restFixture,
      restFixture.get(DrizzleIntakesRepository),
      restFixture.get(IntakeSeeder),
    )
  }

  registerIntake(overrides: Partial<IntakeCreation> = {}) {
    return this.intakesRepository.add(this.createIntake(overrides))
  }

  seedIntakes(overrides: Partial<IntakeCreation>[]) {
    return this.intakeSeeder.seed(overrides.map((intake) => this.createIntake(intake)))
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  close() {
    return this.restFixture.close()
  }

  private createIntake(overrides: Partial<IntakeCreation>): IntakeCreation {
    const draft: Intake = IntakeFaker.fake({
      status: IntakeStatus.ConsultationScheduled,
      ...overrides,
    })

    return {
      clientId: draft.clientId,
      responsibleId: draft.responsibleId,
      createdBy: draft.createdBy,
      updatedBy: draft.updatedBy,
      origin: draft.origin,
      contactChannel: draft.contactChannel,
      legalAreaId: draft.legalAreaId,
      legalTopicId: draft.legalTopicId,
      urgency: draft.urgency,
      demandNotes: draft.demandNotes,
      status: IntakeStatus.ConsultationScheduled,
    }
  }
}
