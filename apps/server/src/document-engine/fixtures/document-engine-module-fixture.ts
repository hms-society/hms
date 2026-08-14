import type { INestApplication, Type } from '@nestjs/common'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleDocumentBatchesRepository } from '@/document-engine/database/drizzle/repositories/document-batches-repository'
import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { userModel } from '@/identity/database/drizzle/models/user-model'
import { SharedModule } from '@/shared/shared.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'

export class DocumentEngineModuleFixture {
  private constructor(
    private readonly restFixture: RestFixture,
    private readonly drizzleClient: DrizzleClient,
    readonly documentBatchesRepository: DrizzleDocumentBatchesRepository,
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
