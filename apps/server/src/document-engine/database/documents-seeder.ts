import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { getMimeTypeFromExtension } from '../utils/mime-type.map'

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

    const seedFiles = await this.loadSeedFiles()

    const batches: any[] = []
    const batchesPerClient = 3

    for (const [index, client] of clients.entries()) {
      const user = users[index % users.length]

      for (let batchIndex = 1; batchIndex <= batchesPerClient; batchIndex++) {
        const batchName = `LOTE-${client.id}-${batchIndex}-${randomUUID()}`

        const uploadedFiles = await Promise.all(
          seedFiles.map(async (file) => {
            const buffer = file.content
            const extension = extname(file.name)
            const mimeType = getMimeTypeFromExtension(extension)

            const storagePath = `seed/${client.id}/${batchName}/${file.name}`

            await this.storageProvider.upload(storagePath, buffer, mimeType)

            return {
              storagePath,
              originalName: file.name,
              mimeType,
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

  private async loadSeedFiles() {
    const seedAssetsPath = join(
      process.cwd(),
      'src',
      'document-engine',
      'database',
      'seed-assets',
    )
    const assetPaths = [
      join(seedAssetsPath, 'pdf_teste_2_paginas.pdf'),
      join(seedAssetsPath, 'pdf_teste_3_paginas.pdf'),
    ]

    const pdfFiles = await Promise.all(
      assetPaths.map(async (path) => ({
        name: basename(path),
        content: await readFile(path),
      })),
    )

    return [
      ...pdfFiles,
      {
        name: 'comprovante_endereco_simulado.jpg',
        content: Buffer.from('JPG_DUMMY_CONTENT_456'),
      },
    ]
  }
}
