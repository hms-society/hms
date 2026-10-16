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
  skipProcessing?: boolean
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
    const context = await this.resolveReceiptContext(request)
    const day = this.resolveDay()
    const skipProcessing =
      request.channel === DocumentBatchChannel.InternalUpload ||
      request.skipProcessing === true
    const files = request.files.map((file) => ({
      ...file,
      status: skipProcessing
        ? DocumentValidationStatus.AwaitingValidation
        : DocumentValidationStatus.Processing,
    }))
    const existing = await this.reuseDailyBatch(
      request,
      context.resolvedClientId,
      day,
      files,
    )
    const batch = existing ?? (await this.addBatch(request, context, day, files))
    if (!skipProcessing) await this.publishProcessingEvents(batch, files)
    return batch
  }

  private async resolveReceiptContext(request: CreateDocumentBatchRequest) {
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
      if (request.clientId) {
        status = DocumentBatchStatus.Identified
        inTriageBox = false
        resolvedClientId = request.clientId
      } else {
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
    }

    return { status, inTriageBox, resolvedClientId }
  }

  private resolveDay() {
    const now = this.datetimeProvider.now()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const day = String(now.getUTCDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    const dateStringNoDashes = `${year}${month}${day}`
    const startOfDay = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()))
    const endOfDay = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate() + 1))

    return { dateString, dateStringNoDashes, startOfDay, endOfDay }
  }

  private async reuseDailyBatch(
    request: CreateDocumentBatchRequest,
    resolvedClientId: string | undefined,
    day: ReturnType<CreateDocumentBatchUseCase['resolveDay']>,
    files: CreateDocumentBatchRequest['files'],
  ): Promise<DocumentBatch | undefined> {
    if (!resolvedClientId || request.readableId) return undefined
    const dailyBatch = await this.documentBatchesRepository.findDailyByClient(
      resolvedClientId,
      day.startOfDay,
      day.endOfDay,
      request.channel,
    )
    if (dailyBatch?.channel !== request.channel) return undefined
    return this.documentBatchesRepository.addFiles(dailyBatch.id, files)
  }

  private async addBatch(
    request: CreateDocumentBatchRequest,
    context: Awaited<ReturnType<CreateDocumentBatchUseCase['resolveReceiptContext']>>,
    day: ReturnType<CreateDocumentBatchUseCase['resolveDay']>,
    files: CreateDocumentBatchRequest['files'],
  ): Promise<DocumentBatch> {
    const count = await this.dailyCountersRepository.incrementAndGet(
      'LOTE',
      day.dateString,
    )
    const sequence = String(count).padStart(4, '0')

    const readableId = request.readableId ?? `LOTE-${day.dateStringNoDashes}-${sequence}`

    const batch = await this.documentBatchesRepository.add({
      readableId,
      status: context.status,
      channel: request.channel,
      sender: request.sender,
      inTriageBox: context.inTriageBox,
      clientId: context.resolvedClientId,
      intakeId: request.intakeId,
      createdBy: request.createdBy,
      files,
    })

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
