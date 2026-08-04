import { Inject, Injectable, Logger } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { CreateDocumentBatchUseCase } from '@hms/core/documents/use-cases/create-document-batch-use-case.js'
import { DocumentChannel } from '@hms/core/documents/domain/structures/document-channel.js'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'

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
    const clients = await db.select().from(clientModel).limit(3)

    if (users.length === 0 || clients.length === 0) {
      this.logger.warn('Usuários ou Clientes insuficientes para popular os documentos.')
      return []
    }

    const userId = users[0].id

    const batchScenarios = [
      {
        client: clients[0],
        channel: DocumentChannel.InternalUpload,
        sender: clients[0].email || 'cliente@hms.com.br',
        files: [
          { name: 'rg_cnh_cliente_alpha.pdf', mime: 'application/pdf', content: 'PDF_RG_CONTENT_111' },
          { name: 'comprovante_residencia_alpha.jpg', mime: 'image/jpeg', content: 'JPG_RES_CONTENT_222' },
        ],
      },
      {
        client: clients[1] || clients[0],
        channel: DocumentChannel.Whatsapp,
        sender: (clients[1] || clients[0]).phone || '5511999999999',
        files: [
          { name: 'procuracao_assinada.pdf', mime: 'application/pdf', content: 'PDF_PROC_CONTENT_333' },
        ],
      },
      {
        client: clients[2] || clients[0],
        channel: DocumentChannel.ClientPortal,
        sender: (clients[2] || clients[0]).email || 'cliente@hms.com.br',
        files: [
          { name: 'contrato_social_empresa.pdf', mime: 'application/pdf', content: 'PDF_SOC_CONTENT_444' },
          { name: 'extrato_bancario.pdf', mime: 'application/pdf', content: 'PDF_EXT_CONTENT_555' },
        ],
      }
    ]

    const createdBatches:any = []

    for (const scenario of batchScenarios) {
      const uploadedFiles = await Promise.all(
        scenario.files.map(async (file) => {
          const buffer = Buffer.from(file.content)
          const timestamp = new Date().getTime()
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
          
          const storagePath = `seed/${scenario.client.id}/${timestamp}-${safeName}`

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
        channel: scenario.channel,
        sender: scenario.sender,
        createdBy: userId,
        clientId: scenario.client.id, 
        files: uploadedFiles,
      })

      createdBatches.push(batch)
    }

    return createdBatches
  }
}