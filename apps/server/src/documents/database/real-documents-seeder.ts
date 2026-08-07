import { Inject, Injectable } from '@nestjs/common'
import { readdir, stat, readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import type { DocumentBatchesRepository } from '@hms/core/documents/interfaces'
import {
  DocumentBatchStatus,
  DocumentChannel,
} from '@hms/core/documents/domain/structures'

import { DOCUMENTS_REPOSITORIES } from './drizzle/constants/documents-repositories'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel } from '@/identity/database/drizzle/models'

import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'

@Injectable()
export class RealDocumentsSeeder {
  constructor(
    @Inject(DOCUMENTS_REPOSITORIES.documentBatches)
    private readonly documentBatchesRepository: DocumentBatchesRepository,

    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,

    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  async clear() {}

  async run() {
    const db = this.drizzleClient.requireDatabase()

    const clients = await db.select().from(clientModel)

    if (clients.length === 0) {
      throw new Error(
        'Nenhum cliente encontrado para criar os documentos.',
      )
    }

    const localPath = 'C:\\Users\\vinic\\Downloads\\testes'

    const fileNames = await readdir(localPath)

    if (fileNames.length === 0) {
      throw new Error(
        `Nenhum arquivo encontrado em ${localPath}`,
      )
    }

    const batches: any[] = []

    const now = new Date()

    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')

    const dateStringNoDashes = `${year}${month}${day}`

    for (const [index, client] of clients.entries()) {
      const readableId = `LOTE-TESTE-${String(
        index + 1,
      ).padStart(4, '0')}`

      const files = await Promise.all(
        fileNames.map(async (fileName) => {
          const fullPath = join(localPath, fileName)

          const fileStat = await stat(fullPath)
          const buffer = await readFile(fullPath)

          const extension = extname(fileName).toLowerCase()

          const mimeType =
            extension === '.pdf'
              ? 'application/pdf'
              : extension === '.jpg' || extension === '.jpeg'
                ? 'image/jpeg'
                : extension === '.png'
                  ? 'image/png'
                  : extension === '.doc'
                    ? 'application/msword'
                    : extension === '.docx'
                      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                      : 'application/octet-stream'

          const storagePath = `seed/${client.id}/${readableId}/${fileName}`

          const uploadedPath = await this.storageProvider.upload(
            storagePath,
            buffer,
            mimeType,
          )

          return {
            storagePath: uploadedPath,
            originalName: basename(fileName),
            mimeType,
            sizeBytes: fileStat.size,
          }
        }),
      )

      const batch =
        await this.documentBatchesRepository.add({
          readableId,
          status: DocumentBatchStatus.Identified,
          channel: DocumentChannel.Whatsapp,
          sender: '5511999999999',
          inTriageBox: false,
          clientId: client.id,
          files,
        })

      batches.push(batch)
    }

    return batches
  }
}