import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CreateDocumentBatchUseCase } from '../create-document-batch-use-case'
import { DocumentBatchChannel } from '../../domain/structures/document-batch-channel'
import { DocumentBatchStatus } from '../../domain/structures/document-batch-status'
import type { ClientsRepository } from '../../../identity/interfaces/clients-repository'
import type { DatetimeProvider } from '../../../shared/interfaces/datetime-provider'
import type { DailyCountersRepository } from '../../interfaces/daily-counters-repository'
import type { DocumentBatchesRepository } from '../../interfaces/document-batches-repository'

describe('CreateDocumentBatchUseCase', () => {
  let documentBatchesRepository: MockProxy<DocumentBatchesRepository>
  let dailyCountersRepository: MockProxy<DailyCountersRepository>
  let clientsRepository: MockProxy<ClientsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: CreateDocumentBatchUseCase

  beforeEach(() => {
    documentBatchesRepository = mock<DocumentBatchesRepository>()
    dailyCountersRepository = mock<DailyCountersRepository>()
    clientsRepository = mock<ClientsRepository>()
    datetimeProvider = mock<DatetimeProvider>()

    const fixedDate = new Date('2026-08-07T12:00:00.000Z')
    datetimeProvider.now.mockReturnValue(fixedDate)
    dailyCountersRepository.incrementAndGet.mockResolvedValue(1)

    documentBatchesRepository.add.mockImplementation(async (batch) => ({
      id: 'mocked-batch-id',
      ...batch,
      createdAt: fixedDate,
      updatedAt: fixedDate,
      files: [],
    }) as any)

    useCase = new CreateDocumentBatchUseCase(
      documentBatchesRepository,
      dailyCountersRepository,
      clientsRepository,
      datetimeProvider,
    )
  })

  it('should identify the batch and bypass triage when channel is InternalUpload', async () => {
    const result = await useCase.execute({
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'internal-user-id',
      files: [],
      createdBy: 'internal-user-id',
    })

    expect(result.status).toBe(DocumentBatchStatus.Identified)
    expect(result.inTriageBox).toBe(false)
    expect(result.readableId).toBe('LOTE-20260807-0001')
    expect(clientsRepository.findByPhone).not.toHaveBeenCalled()
  })

  it('should identify the batch and link to the client when WhatsApp sender matches exactly one client', async () => {
    clientsRepository.findByPhone.mockResolvedValue([
      { id: 'client-123' } as any,
    ])

    const result = await useCase.execute({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999999999',
      files: [],
    })

    expect(result.status).toBe(DocumentBatchStatus.Identified)
    expect(result.inTriageBox).toBe(false)
    expect(result.clientId).toBe('client-123')
    expect(clientsRepository.findByPhone).toHaveBeenCalledWith('5511999999999')
  })

  it('should send the batch to triage when WhatsApp sender matches zero clients', async () => {
    clientsRepository.findByPhone.mockResolvedValue([])

    const result = await useCase.execute({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999999999',
      files: [],
    })

    expect(result.status).toBe(DocumentBatchStatus.PendingIdentification)
    expect(result.inTriageBox).toBe(true)
    expect(result.clientId).toBeUndefined()
  })

  it('should send the batch to triage when WhatsApp sender matches multiple clients', async () => {
    clientsRepository.findByPhone.mockResolvedValue([
      { id: 'client-1' } as any,
      { id: 'client-2' } as any,
    ])

    const result = await useCase.execute({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999999999',
      files: [],
    })

    expect(result.status).toBe(DocumentBatchStatus.PendingIdentification)
    expect(result.inTriageBox).toBe(true)
    expect(result.clientId).toBeUndefined()
  })

  it('should use the provided readableId instead of generating a new one', async () => {
    const customReadableId = 'CUSTOM-LOTE-999'
    
    const result = await useCase.execute({
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'internal-user-id',
      files: [],
      readableId: customReadableId,
    })

    expect(result.readableId).toBe(customReadableId)
  })
})