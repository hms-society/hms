import type { DocumentBatch, DocumentBatchFile } from '../domain/entities/document-batch'
import { DocumentBatchChannel } from '../domain/structures/document-batch-channel'
import { DocumentBatchStatus } from '../domain/structures/document-batch-status'
import { DocumentValidationStatus } from '../domain/structures/document-validation-status'
import { ClientNotFoundError } from '../../identity/domain/errors'
import type { ClientsRepository } from '../../identity/interfaces/clients-repository'
import type { Broker, DatetimeProvider } from '../../shared/interfaces'
import { DocumentFileProcessingRequestedEvent } from '../domain/events'
import type { DailyCountersRepository } from '../interfaces/daily-counters-repository'
import type { DocumentBatchesRepository } from '../interfaces/document-batches-repository'

export type CreateDocumentBatchRequest = {
  channel: DocumentBatchChannel
  sender: string
  files: Omit<DocumentBatchFile, 'id' | 'batchId' | 'createdAt'>[]
  clientId?: string
  intakeId?: string
  createdBy?: string
  readableId?: string
}

export class CreateDocumentBatchUseCase {
  constructor(
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    private readonly dailyCountersRepository: DailyCountersRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: CreateDocumentBatchRequest): Promise<DocumentBatch> {
    let status: DocumentBatchStatus = DocumentBatchStatus.Received
    let inTriageBox = true
    let resolvedClientId = request.clientId

    if (request.channel === DocumentBatchChannel.InternalUpload) {
      if (request.clientId) {
        const client = await this.clientsRepository.findById(request.clientId)

        if (!client) throw new ClientNotFoundError()
      }

      status = DocumentBatchStatus.Identified
      inTriageBox = true
    } else if (request.channel === DocumentBatchChannel.WhatsApp) {
      const clients = await this.clientsRepository.findByPhone(request.sender)

      if (clients && clients.length === 1) {
        status = DocumentBatchStatus.Identified
        inTriageBox = false
        resolvedClientId = clients[0].id
      } else {
        status = DocumentBatchStatus.PendingIdentification
        inTriageBox = true
      }
    }

    const now = this.datetimeProvider.now()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const dateStringNoDashes = `${year}${month}${day}`
    const startOfDay = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()))
    const endOfDay = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate() + 1))

    const files = request.files.map((file) => ({
      ...file,
      status: DocumentValidationStatus.Processing,
    }))

    if (resolvedClientId && !request.readableId) {
      const dailyBatch = await this.documentBatchesRepository.findDailyByClient(
        resolvedClientId,
        startOfDay,
        endOfDay,
      )

      if (dailyBatch) {
        const batch = await this.documentBatchesRepository.addFiles(dailyBatch.id, files)

        await this.publishProcessingEvents(batch, files)

        return batch
      }
    }

    const count = await this.dailyCountersRepository.incrementAndGet('LOTE', dateString)
    const sequence = String(count).padStart(4, '0')

    const readableId = request.readableId ?? `LOTE-${dateStringNoDashes}-${sequence}`

    const batch = await this.documentBatchesRepository.add({
      readableId,
      status,
      channel: request.channel,
      sender: request.sender,
      inTriageBox,
      clientId: resolvedClientId,
      intakeId: request.intakeId,
      createdBy: request.createdBy,
      files,
    })

    await this.publishProcessingEvents(batch, files)

    return batch
  }

  private async publishProcessingEvents(
    batch: DocumentBatch,
    createdFiles: Omit<DocumentBatchFile, 'id' | 'batchId' | 'createdAt'>[],
  ) {
    const storagePaths = new Set(createdFiles.map((file) => file.storagePath))
    const files = batch.files?.filter((file) => storagePaths.has(file.storagePath)) ?? []

    await Promise.all(
      files.map((file) =>
        this.broker.publish(
          new DocumentFileProcessingRequestedEvent({
            batchId: batch.id,
            documentFileId: file.id,
            storagePath: file.storagePath,
            originalName: file.originalName,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
          }),
        ),
      ),
    )
  }
}
