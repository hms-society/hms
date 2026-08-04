import { Inject, Injectable, Logger } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { CreateDocumentBatchUseCase } from '@hms/core/documents/use-cases/create-document-batch-use-case.js'
import { DocumentChannel } from '@hms/core/documents/domain/structures/document-channel.js'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { DocumentBatch } from '@hms/core/document-engine/domain/entities'

@Injectable()
export class DocumentsSeeder {
  private readonly logger = new Logger(DocumentsSeeder.name)

  constructor(
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()
    await db.execute(sql`TRUNCATE document_batches CASCADE`)
  }

  async run() {
    const db = this.drizzleClient.requireDatabase()

    const users = await db.select().from(userModel).limit(1)
    const clients = await db.select().from(clientModel).limit(10)

    if (users.length === 0 || clients.length === 0) return null

    const userId = users[0].id

    const dummyFiles = [
      {
        name: 'contrato_social_simulado.pdf',
        content: 'PDF_DUMMY_CONTENT_123',
        mime: 'application/pdf',
      },
      {
        name: 'comprovante_endereco_simulado.jpg',
        content: 'JPG_DUMMY_CONTENT_456',
        mime: 'image/jpeg',
      },
      {
        name: 'cartao_cnpj.pdf',
        content: 'PDF_DUMMY_CONTENT_789',
        mime: 'application/pdf',
      },
      {
        name: 'balanco_patrimonial.pdf',
        content: 'PDF_DUMMY_CONTENT_101',
        mime: 'application/pdf',
      },
    ]

    const batches: any[] = []

    for (const client of clients) {
      const uploadedFiles = await Promise.all(
        dummyFiles.map(async (file) => {
          const buffer = Buffer.from(file.content)
          const timestamp = Date.now()

          const storagePath = `seed/${userId}/${client.id}/${timestamp}-${file.name}`

          await this.storageProvider.upload(storagePath, buffer, file.mime)

          return {
            storagePath,
            originalName: file.name,
            mimeType: file.mime,
            sizeBytes: buffer.length,
          }
        }),
      )

      const batch = await this.createDocumentBatchUseCase.execute({
        channel: DocumentChannel.InternalUpload,
        sender: 'admin@hms.com.br',
        createdBy: userId,
        clientId: client.id,
        files: uploadedFiles,
      })

      batches.push(batch)
    }

    return batches
  }
}