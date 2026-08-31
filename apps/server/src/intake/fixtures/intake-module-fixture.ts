import type { ExecutionContext, INestApplication, Type } from '@nestjs/common'
import type { Intake, IntakeCreation } from '@hms/core/intake/domain/entities'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import { IntakeClosureReason, IntakeStatus } from '@hms/core/intake/domain/structures'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { Broker } from '@hms/core/shared/interfaces'
import type { EventPayload, InngestFunction } from 'inngest'
import { vi, type Mock } from 'vitest'

import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import {
  DrizzleIntakeListRepository,
  DrizzleIntakesRepository,
} from '@/intake/database/drizzle/repositories'
import { IntakeSeeder } from '@/intake/database/intake-seeder'
import { IntakeModule } from '@/intake/intake.module'
import { IdentityModule } from '@/identity/identity.module'
import { AuthGuard } from '@/identity/guards'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

type InngestJobType<T extends InngestJob> = Type<T> & {
  readonly ID: string
}

type IntakeModuleFixtureOptions<T extends InngestJob> = {
  readonly inngestJob: InngestJobType<T>
}

type IntakeRestContext = {
  readonly authUser: AuthUser
  readonly broker: Broker & { publish: Mock }
  readonly restFixture: RestFixture
}

export class IntakeModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly inngestFixture: InngestFixture | undefined,
    private readonly intakesRepository: DrizzleIntakesRepository,
    private readonly intakeSeeder: IntakeSeeder,
    readonly broker: Broker & { publish: Mock },
    readonly authUser: AuthUser,
    readonly idProvider: IdProvider,
    readonly datetimeProvider: DatetimeProvider,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  get intakeListRepository(): DrizzleIntakeListRepository {
    return this.restFixture.get(DrizzleIntakeListRepository)
  }

  get inngestFunctionOptions(): InngestFunction.Options {
    if (!this.inngestFixture) {
      throw new Error('The intake fixture was not registered for Inngest.')
    }

    return this.inngestFixture.functionOptions
  }

  static async register<T extends InngestJob = InngestJob>(
    target?: Type<unknown> | IntakeModuleFixtureOptions<T>,
  ) {
    if (target && typeof target !== 'function') {
      return IntakeModuleFixture.registerWithInngest(target.inngestJob)
    }

    const context = await IntakeModuleFixture.registerRestContext(target)
    return IntakeModuleFixture.fromRestContext(context)
  }

  registerIntake(overrides: Partial<IntakeCreation> = {}) {
    return this.intakesRepository.add(this.fakeIntake(overrides))
  }

  seedIntakes(overrides: Partial<IntakeCreation>[]) {
    return this.intakeSeeder.seed(overrides.map((intake) => this.fakeIntake(intake)))
  }

  findIntake(intakeId: string) {
    return this.intakesRepository.findById(intakeId)
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  runInngest(event: EventPayload) {
    if (!this.inngestFixture) {
      throw new Error('The intake fixture was not registered for Inngest.')
    }

    return this.inngestFixture.run(event)
  }

  async close() {
    const errors: unknown[] = []

    try {
      await this.inngestFixture?.teardown()
    } catch (error) {
      errors.push(error)
    }

    try {
      await this.restFixture.close()
    } catch (error) {
      errors.push(error)
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to close the intake fixture.')
    }
  }

  private static fromRestContext(
    context: IntakeRestContext,
    inngestFixture?: InngestFixture,
  ) {
    return new IntakeModuleFixture(
      context.restFixture,
      inngestFixture,
      context.restFixture.get(DrizzleIntakesRepository),
      context.restFixture.get(IntakeSeeder),
      context.broker,
      context.authUser,
      context.restFixture.get(IdProvider),
      context.restFixture.get(DatetimeProvider),
    )
  }

  private static async registerRestContext(
    controller?: Type<unknown>,
    inngestClient?: InngestClient,
  ): Promise<IntakeRestContext> {
    const authUser: AuthUser = {
      id: '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
      email: 'intake.fixture@hms.test',
    }
    const broker: Broker & { publish: Mock } = { publish: vi.fn() }
    const restFixture = await RestFixture.register(
      inngestClient
        ? {
            imports: [IntakeModule],
            providers: [{ provide: InngestBroker, useValue: broker }],
          }
        : {
            imports: [IdentityModule, IntakeDatabaseModule],
            controllers: controller ? [controller] : [],
            providers: [
              DatetimeProvider,
              IdProvider,
              { provide: InngestBroker, useValue: broker },
            ],
          },
      (builder) => {
        let configuredBuilder = builder

        if (inngestClient) {
          // biome-ignore lint/correctness/useHookAtTopLevel: This is Nest's testing-module builder, not a React hook.
          configuredBuilder = configuredBuilder
            .overrideProvider(InngestClient)
            .useValue(inngestClient)
        }

        return configuredBuilder.overrideGuard(AuthGuard).useValue({
          canActivate: (context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
            request.user = authUser
            return true
          },
        })
      },
    )

    return { authUser, broker, restFixture }
  }

  private static async registerWithInngest<T extends InngestJob>(
    jobType: InngestJobType<T>,
  ) {
    let context: IntakeRestContext | undefined
    const inngestFixture = new InngestFixture({
      functionId: jobType.ID,
      createJob: async (client) => {
        context = await IntakeModuleFixture.registerRestContext(undefined, client)
        return context.restFixture.get(jobType)
      },
    })

    try {
      await inngestFixture.setup()
    } catch (error) {
      const errors: unknown[] = [error]

      try {
        await context?.restFixture.close()
      } catch (closeError) {
        errors.push(closeError)
      }

      if (errors.length > 1) {
        throw new AggregateError(errors, 'Failed to register the intake fixture.')
      }
      throw error
    }

    if (!context) {
      await inngestFixture.teardown()
      throw new Error('The intake fixture was not registered for Inngest.')
    }

    return IntakeModuleFixture.fromRestContext(context, inngestFixture)
  }

  private fakeIntake(overrides: Partial<IntakeCreation>): IntakeCreation {
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
