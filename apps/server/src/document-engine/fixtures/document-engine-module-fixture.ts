import type { INestApplication, Type } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { TestingModuleBuilder } from '@nestjs/testing'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleDocumentBatchesRepository } from '@/document-engine/database/drizzle/repositories/document-batches-repository'
import { DrizzleDocumentValidationLogsRepository } from '@/document-engine/database/drizzle/repositories/drizzle-document-validation-logs-repository'
import { DrizzleDocumentValidationsRepository } from '@/document-engine/database/drizzle/repositories/drizzle-document-validations-repository'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { SharedModule } from '@/shared/shared.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'
import { DocumentEngineProvisionModule } from '@/document-engine/provision/document-engine-provision.module'
import { eq } from 'drizzle-orm'
import { documentExceptionAuditLogModel } from '@/document-engine/database/drizzle/models/document-exception-audit-log-model'
import { DOCUMENT_ENGINE_REPOSITORIES } from '@/document-engine/rest/controllers/request-document-exception.controller'
import type {
  DocumentExceptionAuditLogsRepository,
  DocumentExceptionsRepository,
} from '@hms/core/document-engine/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import type { DailyCountersRepository } from '@hms/core/document-engine/interfaces'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { Broker } from '@hms/core/shared/interfaces'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { SupabaseAuthFixture } from '@/shared/rest/tests/supabase-auth-fixture'

export class DocumentEngineModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly drizzleClient: DrizzleClient,
    readonly documentBatchesRepository: DrizzleDocumentBatchesRepository,
    readonly documentValidationsRepository: DrizzleDocumentValidationsRepository,
    readonly documentValidationLogsRepository: DrizzleDocumentValidationLogsRepository,
    readonly documentExceptionsRepository: DocumentExceptionsRepository,
    readonly documentExceptionAuditLogsRepository: DocumentExceptionAuditLogsRepository,
    private readonly dailyCountersRepository: DailyCountersRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly authFixture?: SupabaseAuthFixture,
    private readonly authUserId?: string,
    readonly authCollaboratorId?: string,
  ) {}

  get app(): INestApplication {
    return this.restFixture.app
  }

  static async register(
    controller?: Type<unknown>,
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const restFixture = await RestFixture.register(
      {
        imports: [SharedModule, DocumentsModule, DocumentEngineProvisionModule],
        controllers: controller ? [controller] : [],
      },
      configure,
    )

    return new DocumentEngineModuleFixture(
      restFixture,
      restFixture.get(DrizzleClient),
      restFixture.get(DrizzleDocumentBatchesRepository),
      restFixture.get(DrizzleDocumentValidationsRepository),
      restFixture.get(DrizzleDocumentValidationLogsRepository),
      restFixture.get(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions),
      restFixture.get(DOCUMENT_ENGINE_REPOSITORIES.auditLogs),
      restFixture.get(DOCUMENT_ENGINE.dailyCounters),
      restFixture.get(IDENTITY_REPOSITORIES.clients),
    )
  }

  static async registerAuthenticated(
    controller?: Type<unknown>,
    userId = randomUUID(),
    configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
  ) {
    const authFixture = await SupabaseAuthFixture.register()
    const auth = await authFixture.createSignedInUser('lawyer@hms.com', userId)
    const collaboratorId = randomUUID()
    let restFixture: RestFixture
    try {
      restFixture = await RestFixture.register(
        {
          imports: [SharedModule, DocumentsModule, DocumentEngineProvisionModule],
          controllers: controller ? [controller] : [],
        },
        (builder) => {
          const authenticatedBuilder = authFixture.configure(builder)
          return configure?.(authenticatedBuilder) ?? authenticatedBuilder
        },
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
      throw error
    }

    return new DocumentEngineModuleFixture(
      restFixture,
      restFixture.get(DrizzleClient),
      restFixture.get(DrizzleDocumentBatchesRepository),
      restFixture.get(DrizzleDocumentValidationsRepository),
      restFixture.get(DrizzleDocumentValidationLogsRepository),
      restFixture.get(DOCUMENT_ENGINE_REPOSITORIES.documentExceptions),
      restFixture.get(DOCUMENT_ENGINE_REPOSITORIES.auditLogs),
      restFixture.get(DOCUMENT_ENGINE.dailyCounters),
      restFixture.get(IDENTITY_REPOSITORIES.clients),
      authFixture,
      userId,
      collaboratorId,
    )
  }

  async resetDatabase() {
    await this.restFixture.resetDatabase()
    if (this.authUserId) {
      await this.drizzleClient.requireDatabase().insert(userModel).values({
        id: this.authUserId,
        email: 'lawyer@hms.com',
        status: 'active',
      })
      await this.drizzleClient.requireDatabase().insert(collaboratorModel).values({
        id: this.authCollaboratorId,
        userId: this.authUserId,
        professionalName: 'Advogado HMS',
        jobTitle: 'Advogado',
        profile: 'lawyer',
      })
    }
  }

  async setCollaboratorProfile(profile: 'lawyer' | 'attendant' | 'paralegal') {
    if (!this.authCollaboratorId) throw new Error('No authenticated collaborator')
    await this.drizzleClient
      .requireDatabase()
      .update(collaboratorModel)
      .set({ profile })
      .where(eq(collaboratorModel.id, this.authCollaboratorId))
  }

  async close() {
    try {
      await this.restFixture.close()
    } finally {
      await this.authFixture?.close()
    }
  }

  createDocumentBatchUseCase(broker: Broker) {
    return new CreateDocumentBatchUseCase(
      this.documentBatchesRepository,
      this.dailyCountersRepository,
      this.clientsRepository,
      new DatetimeProvider(),
      broker,
    )
  }

  findExceptionAuditLogs(exceptionId: string) {
    return this.drizzleClient
      .requireDatabase()
      .select()
      .from(documentExceptionAuditLogModel)
      .where(eq(documentExceptionAuditLogModel.documentExceptionId, exceptionId))
  }

  async seedUserAndClient(userId: string, clientId: string) {
    const db = this.drizzleClient.requireDatabase()
    await db
      .insert(userModel)
      .values({
        id: userId,
        email: 'lawyer@hms.com',
        status: 'active',
      })
      .onConflictDoNothing()
    await db.insert(clientModel).values({
      id: clientId,
      type: 'natural',
      name: 'Client Test',
      taxIdType: 'cpf',
      taxIdValue: '12345678909',
    })
  }
}
