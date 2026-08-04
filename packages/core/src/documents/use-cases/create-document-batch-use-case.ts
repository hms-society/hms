import type { DocumentBatch, DocumentBatchFile } from '../domain/entities/document-batch'
import { DocumentChannel } from '../domain/structures/document-channel'
import { DocumentBatchStatus } from '../domain/structures/document-batch-status'
import type { ClientsRepository } from '#identity/interfaces/clients-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { DailyCountersRepository } from '../interfaces/daily-counters-repository'
import type { DocumentBatchesRepository } from '../interfaces/document-batches-repository'

type CreateDocumentBatchRequest = {
  channel: DocumentChannel
  sender: string
  files: Omit<DocumentBatchFile, 'id' | 'batchId' | 'createdAt'>[]
  clientId?: string
  intakeId?: string
  createdBy?: string
}

export class CreateDocumentBatchUseCase {
  constructor(
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    private readonly dailyCountersRepository: DailyCountersRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: CreateDocumentBatchRequest): Promise<DocumentBatch> {
    let status: DocumentBatchStatus = DocumentBatchStatus.Received
    let inTriageBox = true
    let resolvedClientId = request.clientId

    if (request.channel === DocumentChannel.InternalUpload) {
      status = DocumentBatchStatus.Identified
      inTriageBox = false
    } else if (request.channel === DocumentChannel.Whatsapp) {
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
    const readableId = `LOTE-${dateStringNoDashes}-${sequence}`

    return this.documentBatchesRepository.add({
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
  }
}