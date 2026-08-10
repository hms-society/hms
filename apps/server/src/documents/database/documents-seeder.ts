import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'

@Injectable()
export class DocumentsSeeder {
  constructor(
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
  ) {}

  async clear() {}

  async run() {
    await this.clear()

    const db = this.drizzleClient.requireDatabase()

    const users = await db.select().from(userModel).limit(5)
    const clients = await db.select().from(clientModel).limit(10)

    if (users.length === 0 || clients.length === 0) return null

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
    const batchesPerClient = 3

    for (const [index, client] of clients.entries()) {
      const user = users[index % users.length]

      for (let batchIndex = 1; batchIndex <= batchesPerClient; batchIndex++) {
        const batchName = `LOTE-${client.id}-${batchIndex}-${randomUUID()}`

        const uploadedFiles = await Promise.all(
          dummyFiles.map(async (file) => {
            const buffer = Buffer.from(file.content)

            const storagePath = `seed/${client.id}/${batchName}/${file.name}`

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
          readableId: batchName,
          channel: DocumentBatchChannel.InternalUpload,
          sender: 'admin@hms.com.br',
          createdBy: user.id,
          clientId: client.id,
          files: uploadedFiles,
        })

        batches.push(batch)
      }
    }

    return batches
  }
}
