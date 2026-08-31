import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { eventType, type InngestFunction } from 'inngest'
import { z } from 'zod'

import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const whatsappDocumentBatchReceived = eventType('documents/whatsapp.batch.received', {
  schema: z.record(z.string(), z.unknown()),
})

@Injectable()
export class ProcessWhatsappBatchJob extends InngestJob {
  private static readonly logger = new Logger(ProcessWhatsappBatchJob.name)
  readonly function: InngestFunction.Like

  constructor(
    inngest: InngestClient,
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(STORAGE_PROVIDER)
    @Optional()
    private readonly storageProvider?: StorageProvider,
    @Inject(WhatsappProvider)
    @Optional()
    private readonly whatsappProvider?: WhatsappProvider,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: 'document-engine/process-whatsapp-batch',
        name: 'Process WhatsApp Document Batch',
        triggers: [whatsappDocumentBatchReceived],
      },
      async ({ event, step }) =>
        step.run('process-batch-metadata', async () => {
          ProcessWhatsappBatchJob.logger.log(
            `Processing WhatsApp document batch ${JSON.stringify(event.data)}`,
          )

          const data = event.data as Record<string, unknown>
          const sender = typeof data.sender === 'string' ? data.sender : ''
          const clientId = typeof data.clientId === 'string' ? data.clientId : undefined
          const originalName =
            typeof data.originalName === 'string' ? data.originalName : 'documento'
          const mimeType =
            typeof data.mimeType === 'string' ? data.mimeType : 'application/octet-stream'
          const mediaId = typeof data.mediaId === 'string' ? data.mediaId : undefined
          let sizeBytes = typeof data.sizeBytes === 'number' ? data.sizeBytes : 1024
          const storagePath =
            typeof data.storagePath === 'string'
              ? data.storagePath
              : `whatsapp/${data.eventoId ?? mediaId ?? 'media'}/${originalName}`

          if (mediaId && this.whatsappProvider && this.storageProvider) {
            try {
              const { buffer, mimeType: fetchedMimeType } =
                await this.whatsappProvider.downloadMedia(mediaId)
              await this.storageProvider.upload(
                storagePath,
                buffer,
                mimeType ?? fetchedMimeType,
              )
              sizeBytes = buffer.length
            } catch (error) {
              ProcessWhatsappBatchJob.logger.error(
                `Failed to download/upload WhatsApp media ${mediaId}: ${(error as Error).message}`,
              )
              throw error
            }
          }

          const batch = await this.createDocumentBatchUseCase.execute({
            channel: DocumentBatchChannel.WhatsApp,
            sender,
            clientId,
            files: [
              {
                originalName,
                mimeType,
                sizeBytes,
                storagePath,
              },
            ],
          })

          return { status: 'received', batchId: batch.id }
        }),
    )
  }
}
