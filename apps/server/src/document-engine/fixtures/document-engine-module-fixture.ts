import type { INestApplication, Type } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import { AppError } from '@hms/core/shared/domain/errors'
import type { EventPayload } from 'inngest'

import { DrizzleDocumentBatchesRepository } from '@/document-engine/database/drizzle/repositories/document-batches-repository'
import { DrizzleDocumentValidationLogsRepository } from '@/document-engine/database/drizzle/repositories/drizzle-document-validation-logs-repository'
import { DrizzleDocumentValidationsRepository } from '@/document-engine/database/drizzle/repositories/drizzle-document-validations-repository'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { AuthGuard } from '@/identity/guards'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/inngest-fixture'
import type { InngestJob } from '@/shared/messaging/inngest/inngest-job'
import { IdProvider } from '@/shared/provision/id/id-provider'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { SharedModule } from '@/shared/shared.module'

type InngestJobType<T extends InngestJob> = Type<T> & {
  readonly ID: string
}

type DocumentEngineModuleFixtureOptions<T extends InngestJob> = {
  readonly controller?: Type<unknown>
  readonly configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder
  readonly inngestJob?: InngestJobType<T>
}

export class DocumentEngineModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly drizzleClient: DrizzleClient,
    readonly idProvider: IdProvider,
    readonly documentBatchesRepository: DrizzleDocumentBatchesRepository,
    readonly documentValidationsRepository: DrizzleDocumentValidationsRepository,
    readonly documentValidationLogsRepository: DrizzleDocumentValidationLogsRepository,
    private readonly inngestFixture?: InngestFixture,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register<Job extends InngestJob = InngestJob>(
    target?: Type<unknown> | DocumentEngineModuleFixtureOptions<Job>,
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const options: DocumentEngineModuleFixtureOptions<Job> =
      typeof target === 'function' ? { controller: target, configure } : (target ?? {})

    if (options.inngestJob) {
      return DocumentEngineModuleFixture.registerWithInngest(options, options.inngestJob)
    }

    const restFixture = await DocumentEngineModuleFixture.registerRestFixture(
      options.controller,
      options.configure,
    )

    return DocumentEngineModuleFixture.fromRestFixture(restFixture)
  }

  static async registerAuthenticated(
    controller?: Type<unknown>,
    userId = 'user-id',
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const restFixture = await DocumentEngineModuleFixture.registerRestFixture(
      controller,
      (builder) => {
        const authenticatedBuilder = builder.overrideGuard(AuthGuard).useValue({
          canActivate(context: {
            switchToHttp(): {
              getRequest(): {
                user?: { id: string; email: string }
                auth?: { accessToken: string; user: { id: string; email: string } }
              }
            }
          }) {
            const request = context.switchToHttp().getRequest()
            request.user = { id: userId, email: 'lawyer@hms.com' }
            request.auth = {
              accessToken: 'test-token',
              user: { id: userId, email: 'lawyer@hms.com' },
            }
            return true
          },
        })

        return configure?.(authenticatedBuilder) ?? authenticatedBuilder
      },
    )

    return DocumentEngineModuleFixture.fromRestFixture(restFixture)
  }

  async resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  runInngest(event: EventPayload) {
    if (!this.inngestFixture) {
      throw new AppError('The document engine fixture was not registered for Inngest.')
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
      throw new AggregateError(errors, 'Failed to close the document engine fixture.')
    }
  }

  async seedUserAndClient(userId: string, clientId: string) {
    const db = this.drizzleClient.requireDatabase()
    await db.insert(userModel).values({
      id: userId,
      email: 'lawyer@hms.com',
      status: 'active',
    })
    await db.insert(clientModel).values({
      id: clientId,
      type: 'natural',
      name: 'Client Test',
      taxIdType: 'cpf',
      taxIdValue: '12345678909',
    })
  }

  private static registerRestFixture(
    controller?: Type<unknown>,
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    return RestFixture.register(
      {
        imports: [SharedModule, DocumentsModule],
        controllers: controller ? [controller] : [],
      },
      configure,
    )
  }

  private static fromRestFixture(
    restFixture: RestFixture,
    inngestFixture?: InngestFixture,
  ) {
    return new DocumentEngineModuleFixture(
      restFixture,
      restFixture.get(DrizzleClient),
      restFixture.get(IdProvider),
      restFixture.get(DrizzleDocumentBatchesRepository),
      restFixture.get(DrizzleDocumentValidationsRepository),
      restFixture.get(DrizzleDocumentValidationLogsRepository),
      inngestFixture,
    )
  }

  private static async registerWithInngest<T extends InngestJob>(
    options: DocumentEngineModuleFixtureOptions<T>,
    jobType: InngestJobType<T>,
  ) {
    let restFixture: RestFixture | undefined
    const inngestFixture = new InngestFixture({
      functionId: jobType.ID,
      createJob: async (client) => {
        restFixture = await DocumentEngineModuleFixture.registerRestFixture(
          options.controller,
          (builder) => {
            const inngestBuilder = builder
              .overrideProvider(InngestClient)
              .useValue(client)

            return options.configure?.(inngestBuilder) ?? inngestBuilder
          },
        )

        return restFixture.get(jobType)
      },
    })

    try {
      await inngestFixture.setup()
    } catch (error) {
      await restFixture?.close()
      throw error
    }

    if (!restFixture) {
      await inngestFixture.teardown()
      throw new Error('The document engine fixture was not registered for Inngest.')
    }

    return DocumentEngineModuleFixture.fromRestFixture(restFixture, inngestFixture)
  }
}
