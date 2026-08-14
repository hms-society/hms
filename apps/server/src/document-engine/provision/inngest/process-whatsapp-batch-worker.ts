import { Injectable, type OnModuleInit, Inject } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { InngestService } from '@/shared/provision/inngest/inngest.service'
import { WhatsappProvider } from '@/shared/communication/whatsapp.provider'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'
import type {
  ClientsRepository,
  SupportersRepository,
} from '@hms/core/identity/interfaces'
import type { DocumentBatchAuditsRepository } from '@hms/core/document-engine/interfaces'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { DOCUMENT_ENGINE } from '../../database/drizzle/constants/documents-repositories'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

@Injectable()
export class ProcessWhatsappBatchWorker implements OnModuleInit {
  constructor(
    @Inject(InngestService)
    private readonly inngestService: InngestService,
    @Inject(WhatsappProvider)
    private readonly whatsappProvider: WhatsappProvider,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
    @Inject(CreateDocumentBatchUseCase)
    private readonly createDocumentBatchUseCase: CreateDocumentBatchUseCase,
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.supporters)
    private readonly supportersRepository: SupportersRepository,
    @Inject(DOCUMENT_ENGINE.documentBatchAudits)
    private readonly auditsRepository: DocumentBatchAuditsRepository,
  ) {}

  onModuleInit() {
    if (!this.inngestService?.client) {
      return
    }

    this.inngestService.register(
      this.inngestService.client.createFunction(
        {
          id: 'process-whatsapp-batch',
          name: 'Process WhatsApp Document Batch',
          triggers: [{ event: 'documents/whatsapp.batch.received' }],
        },
        async ({ event, step }) => {
          const {
            sender,
            mediaId,
            mimeType,
            originalName,
            clientId: eventClientId,
          } = event.data as {
            sender: string
            mediaId?: string
            mimeType: string
            originalName: string
            clientId?: string
          }

          // Step 1: Validate supported file format (CA04)
          if (!ALLOWED_MIME_TYPES.has(mimeType)) {
            await step.run('reject-unsupported-format', async () => {
              await this.auditsRepository.add({
                fileName: originalName,
                mimeType,
                sizeBytes: 0,
                sender,
                status: 'rejected_unsupported_format',
                details: `Formato ${mimeType} não é suportado pelo sistema.`,
              })

              await this.whatsappProvider.sendTextMessage(
                sender,
                'Formato de arquivo não suportado. Por favor, envie seus documentos nos formatos aceitos: PDF, JPEG, PNG, WEBP, DOC ou DOCX.',
              )
            })
            return
          }

          // Step 2: Validate sender identity or third-party supporter permission (CA02)
          let resolvedClientId = eventClientId

          if (!resolvedClientId) {
            const clients = await this.clientsRepository.findByPhone(sender)
            if (clients.length === 1) {
              resolvedClientId = clients[0].id
            }
          }

          if (!resolvedClientId) {
            const supporters = await this.supportersRepository.findByPhone(sender)
            const activeSupporter = supporters.find((s) => s.isActive)
            if (activeSupporter) {
              resolvedClientId = activeSupporter.clientId
            }
          }

          if (!resolvedClientId) {
            await step.run('reject-unauthorized-sender', async () => {
              await this.auditsRepository.add({
                fileName: originalName,
                mimeType,
                sizeBytes: 0,
                sender,
                status: 'rejected_unauthorized_sender',
                details:
                  'Remetente sem cadastro de cliente ou permissão de apoiador documental.',
              })

              await this.whatsappProvider.sendTextMessage(
                sender,
                'Você não possui cadastro ou autorização como apoiador no sistema HMS. Por favor, entre em contato com o atendimento da HMS Advogados ou via e-mail.',
              )
            })
            return
          }

          // Step 3: Download media & compute SHA-256 (CA01)
          const media = await step.run('download-media', async () => {
            if (!mediaId) {
              throw new Error('mediaId é obrigatório para download da mídia')
            }
            const download = await this.whatsappProvider.downloadMedia(mediaId)
            const hashSha256 = createHash('sha256').update(download.buffer).digest('hex')

            return {
              bufferHex: download.buffer.toString('hex'),
              mimeType: download.mimeType,
              sizeBytes: download.size,
              hashSha256,
            }
          })

          // Step 4: Upload to Storage & Create Document Batch (CA01, CA03)
          const batch = await step.run('create-batch', async () => {
            const buffer = Buffer.from(media.bufferHex, 'hex')
            const timestamp = Date.now()
            const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
            const storagePath = `whatsapp/${resolvedClientId}/${timestamp}-${safeName}`

            await this.storageProvider.upload(storagePath, buffer, media.mimeType)

            return this.createDocumentBatchUseCase.execute({
              channel: DocumentBatchChannel.WhatsApp,
              sender,
              clientId: resolvedClientId,
              files: [
                {
                  storagePath,
                  originalName,
                  mimeType: media.mimeType,
                  sizeBytes: media.sizeBytes,
                  hashSha256: media.hashSha256,
                },
              ],
            })
          })

          // Step 5: Audit Log (CA05)
          await step.run('record-audit-log', async () => {
            await this.auditsRepository.add({
              batchId: batch.id,
              fileName: originalName,
              mimeType: media.mimeType,
              sizeBytes: media.sizeBytes,
              hashSha256: media.hashSha256,
              sender,
              status: 'received_and_identified',
              details: `Lote ${batch.readableId} criado com sucesso.`,
            })
          })
        },
      ),
    )
  }
}
