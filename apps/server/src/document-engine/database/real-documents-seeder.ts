import { Injectable, Inject } from '@nestjs/common'
import { readdir, stat, readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { sql } from 'drizzle-orm'

import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { DOCUMENT_ENGINE } from './drizzle/constants/documents-repositories'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'

import type { StorageProvider } from '@hms/core/shared/interfaces'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { getMimeTypeFromExtension } from '../utils/mime-type.map'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

@Injectable()
export class RealDocumentsSeeder {
  constructor(
    @Inject(DOCUMENT_ENGINE.documentBatches)
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
  ) {}

  async clear() {
    const db = this.drizzleClient.requireDatabase()

    await db.execute(sql`
      DELETE FROM document_batches
    `)
  }

  async run() {
    const db = this.drizzleClient.requireDatabase()

    const { data: clientRecords } = await this.clientsRepository.findAll({
      page: 1,
      limit: 15,
    })

    const clients = clientRecords.map(({ client }) => client)

    if (clients.length === 0) {
      throw new Error('Nenhum cliente encontrado para criar os documentos.')
    }

    const localPath = 'src/document-engine/database/seed-assets'
    const fileNames = await readdir(localPath)

    if (fileNames.length === 0) {
      throw new Error(`Nenhum arquivo encontrado em ${localPath}`)
    }

    const batches: any[] = []

    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const dateStringNoDashes = `${year}${month}${day}`

    for (const [index, client] of clients.entries()) {
      const readableId = `LOTE-${dateStringNoDashes}-REAL-${String(index + 1).padStart(2, '0')}`

      const files = await Promise.all(
        fileNames.map(async (fileName) => {
          const fullPath = join(localPath, fileName)

          const fileStat = await stat(fullPath)
          const buffer = await readFile(fullPath)

          const extension = extname(fileName)
          const mimeType = getMimeTypeFromExtension(extension)

          const storagePath = `seed/${client.id}/${readableId}/${fileName}`

          await this.storageProvider.upload(storagePath, buffer, mimeType)

          return {
            storagePath,
            originalName: basename(fileName),
            mimeType,
            sizeBytes: fileStat.size,
          }
        }),
      )

      const batch = await this.documentBatchesRepository.add({
        readableId,
        status: DocumentBatchStatus.Identified,
        channel: DocumentBatchChannel.WhatsApp,
        sender: '5511999999999',
        inTriageBox: false,
        clientId: client.id,
        files,
      })

      await db.execute(sql`
        UPDATE document_batches
        SET created_at = NOW() + INTERVAL '1 day'
        WHERE readable_id = ${readableId}
      `)

      batches.push(batch)
    }

    return batches
  }
}
