import { Injectable, Inject } from '@nestjs/common'
import { readdir, stat, readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { sql } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import { DOCUMENTS_REPOSITORIES } from './drizzle/constants/documents-repositories'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { clientModel } from '@/identity/database/drizzle/models'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class RealDocumentsSeeder {
  constructor(
    @Inject(DOCUMENTS_REPOSITORIES.documentBatches)
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    @Inject(DrizzleClient)
    private readonly drizzleClient: DrizzleClient,
    @Inject(EnvProvider)
    private readonly envProvider: EnvProvider,
  ) {}

  async clear() {
    const supabaseUrl = this.envProvider.get('SUPABASE_URL')
    const supabaseKey = this.envProvider.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === 'document_batches')

    if (!bucketExists) {
      await supabase.storage.createBucket('document_batches', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        fileSizeLimit: 10485760,
      })
    }
  }

  async run() {
    const db = this.drizzleClient.requireDatabase()

    const supabaseUrl = this.envProvider.get('SUPABASE_URL')
    const supabaseKey = this.envProvider.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const clients = await db.select().from(clientModel)

    if (clients.length === 0) {
      throw new Error('Nenhum cliente encontrado para criar os documentos.')
    }

    const localPath = 'src/documents/database/seed-assets'
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

          const { error } = await supabase.storage
            .from('document_batches')
            .upload(storagePath, buffer, {
              contentType: mimeType,
              upsert: true,
            })

          if (error) {
            throw error
          }

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
