import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import type { Intake, IntakeCreation } from '@hms/core/intake/domain/entities'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { Broker } from '@hms/core/shared/interfaces'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeClosureReason, IntakeStatus } from '@hms/core/intake/domain/structures'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { DrizzleIntakeListRepository } from '@/intake/database/drizzle/repositories'
import { DrizzleIntakesRepository } from '@/intake/database/drizzle/repositories'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { IdentityModule } from '@/identity/identity.module'
import { AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { vi, type Mock } from 'vitest'

export class IntakeModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly intakesRepository: DrizzleIntakesRepository,
    private readonly intakeSeeder: IntakeSeeder,
    readonly broker: Broker & { publish: Mock },
    readonly authUser: AuthUser,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  get intakeListRepository(): DrizzleIntakeListRepository {
    return this.restFixture.get(DrizzleIntakeListRepository)
  }

  static async register(controller?: Type<unknown>) {
    const authUser: AuthUser = {
      id: '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
      email: 'intake.fixture@hms.test',
    }
    const broker: Broker & { publish: Mock } = { publish: vi.fn() }
    const restFixture = await RestFixture.register(
      {
        imports: [IdentityModule, IntakeDatabaseModule],
        controllers: controller ? [controller] : [],
        providers: [
          DatetimeProvider,
          {
            provide: InngestBroker,
            useValue: broker,
          },
        ],
      },
      (builder) =>
        builder.overrideGuard(AuthGuard).useValue({
          canActivate: (context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
            request.user = authUser
            return true
          },
        }),
    )

    return new IntakeModuleFixture(
      restFixture,
      restFixture.get(DrizzleIntakesRepository),
      restFixture.get(IntakeSeeder),
      broker,
      authUser,
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
    const isClosedWithoutContract = draft.status === IntakeStatus.ClosedWithoutContract
    const closureReason = isClosedWithoutContract
      ? (draft.closureReason ?? IntakeClosureReason.ClientWithdrew)
      : undefined
    const closureNotes = isClosedWithoutContract
      ? closureReason === IntakeClosureReason.Other
        ? draft.closureNotes?.trim() || 'Fixture closure notes'
        : draft.closureNotes
      : undefined
    const closedAt = isClosedWithoutContract
      ? (draft.closedAt ?? draft.createdAt)
      : undefined

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
      status: draft.status,
      closureReason,
      closureNotes,
      closedAt,
    }
  }
}
