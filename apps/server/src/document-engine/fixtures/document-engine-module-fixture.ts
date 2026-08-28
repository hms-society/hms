import type { INestApplication, Type } from '@nestjs/common'
import type { TestingModuleBuilder } from '@nestjs/testing'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleDocumentBatchesRepository } from '@/document-engine/database/drizzle/repositories/document-batches-repository'
import { DrizzleDocumentValidationLogsRepository } from '@/document-engine/database/drizzle/repositories/drizzle-document-validation-logs-repository'
import { DrizzleDocumentValidationsRepository } from '@/document-engine/database/drizzle/repositories/drizzle-document-validations-repository'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { SharedModule } from '@/shared/shared.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

export class DocumentEngineModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly drizzleClient: DrizzleClient,
    readonly documentBatchesRepository: DrizzleDocumentBatchesRepository,
    readonly documentValidationsRepository: DrizzleDocumentValidationsRepository,
    readonly documentValidationLogsRepository: DrizzleDocumentValidationLogsRepository,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(controller?: Type<unknown>) {
    const restFixture = await RestFixture.register({
      imports: [SharedModule, DocumentsModule],
      controllers: controller ? [controller] : [],
    })

    return new DocumentEngineModuleFixture(
      restFixture,
      restFixture.get(DrizzleClient),
      restFixture.get(DrizzleDocumentBatchesRepository),
      restFixture.get(DrizzleDocumentValidationsRepository),
      restFixture.get(DrizzleDocumentValidationLogsRepository),
    )
  }

  static async registerAuthenticated(
    controller?: Type<unknown>,
    userId = 'user-id',
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const restFixture = await RestFixture.register(
      {
        imports: [SharedModule, DocumentsModule],
        controllers: controller ? [controller] : [],
      },
      (builder) => {
        const authenticatedBuilder = builder
          .overrideGuard(AuthGuard)
          .useValue({
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
          .overrideGuard(ActiveCollaboratorGuard)
          .useValue({
            canActivate() {
              return true
            },
          })

        return configure?.(authenticatedBuilder) ?? authenticatedBuilder
      },
    )

    return new DocumentEngineModuleFixture(
      restFixture,
      restFixture.get(DrizzleClient),
      restFixture.get(DrizzleDocumentBatchesRepository),
      restFixture.get(DrizzleDocumentValidationsRepository),
      restFixture.get(DrizzleDocumentValidationLogsRepository),
    )
  }

  async resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close() {
    return this.restFixture.close()
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
}
