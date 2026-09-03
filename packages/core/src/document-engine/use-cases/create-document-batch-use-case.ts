import type { DocumentBatch, DocumentBatchFile } from '../domain/entities/document-batch'
import { DocumentBatchChannel } from '../domain/structures/document-batch-channel'
import { DocumentBatchStatus } from '../domain/structures/document-batch-status'
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
      status = DocumentBatchStatus.Identified
      inTriageBox = false
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
      files: request.files,
    })

    await Promise.all(
      (batch.files ?? []).map((file) =>
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

    return batch
  }
}
