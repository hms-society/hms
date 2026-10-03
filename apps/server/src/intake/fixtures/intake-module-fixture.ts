import type { INestApplication, Type } from '@nestjs/common'
import type { Intake, IntakeCreation } from '@hms/core/intake/domain/entities'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { Broker } from '@hms/core/shared/interfaces'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeClosureReason, IntakeStatus } from '@hms/core/intake/domain/structures'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { DrizzleIntakeListRepository } from '@/intake/database/drizzle/repositories'
import { DrizzleIntakesRepository } from '@/intake/database/drizzle/repositories'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { IdentityModule } from '@/identity/identity.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import type { UsersRepository } from '@hms/core/identity/interfaces'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'
import { vi, type Mock } from 'vitest'

export class IntakeModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly repository: DrizzleIntakesRepository,
    private readonly intakeSeeder: IntakeSeeder,
    readonly broker: Broker & { publish: Mock },
    readonly authUser: AuthUser,
    private readonly authFixture: SupabaseAuthFixture,
    private readonly usersRepository: UsersRepository,
    private readonly inngestFixture: InngestFixture,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  get intakeListRepository(): DrizzleIntakeListRepository {
    return this.restFixture.get(DrizzleIntakeListRepository)
  }

  get intakesRepository(): IntakesRepository {
    return this.repository
  }

  static async register(controller?: Type<unknown>) {
    const authFixture = await SupabaseAuthFixture.register()
    const auth = await authFixture.createSignedInUser()
    const authUser: AuthUser = { id: auth.user.id, email: auth.user.email }
    let inngestFixture: InngestFixture
    try {
      inngestFixture = await InngestFixture.register({ createFunctions: () => [] })
    } catch (error) {
      await authFixture.close()
      throw error
    }
    const realBroker = new InngestBroker(inngestFixture.client as InngestClient)
    const broker: Broker & { publish: Mock } = {
      publish: vi.fn((event: Parameters<Broker['publish']>[0]) =>
        realBroker.publish(event),
      ),
    }
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
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
        (builder) => authFixture.configure(builder),
        (app) =>
          app.use(
            (
              request: { headers: { authorization?: string } },
              _response: unknown,
              next: () => void,
            ) => {
              request.headers.authorization = `Bearer ${auth.accessToken}`
              next()
            },
          ),
      )
    } catch (error) {
      await authFixture.close()
      await inngestFixture.close()
      throw error
    }

    return new IntakeModuleFixture(
      restFixture,
      restFixture.get(DrizzleIntakesRepository),
      restFixture.get(IntakeSeeder),
      broker,
      authUser,
      authFixture,
      restFixture.get(IDENTITY_REPOSITORIES.users),
      inngestFixture,
    )
  }

  registerIntake(overrides: Partial<IntakeCreation> = {}) {
    return this.repository.add(this.createIntake(overrides))
  }

  seedIntakes(overrides: Partial<IntakeCreation>[]) {
    return this.intakeSeeder.seed(overrides.map((intake) => this.createIntake(intake)))
  }

  async resetDatabase() {
    this.broker.publish.mockClear()
    await this.restFixture.resetDatabase()
    await this.usersRepository.addMany([
      {
        id: this.authUser.id,
        email: this.authUser.email ?? '',
        status: 'active',
      },
    ])
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      try {
        await this.authFixture.close()
      } finally {
        await this.inngestFixture.close()
      }
    }
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
