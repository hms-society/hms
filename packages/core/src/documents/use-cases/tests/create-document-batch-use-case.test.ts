import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CreateDocumentBatchUseCase } from '../create-document-batch-use-case'
import { DocumentChannel } from '../../domain/structures/document-channel'
import { DocumentBatchStatus } from '../../domain/structures/document-batch-status'
import type { ClientsRepository } from '#identity/interfaces/clients-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { DailyCountersRepository } from '../../interfaces/daily-counters-repository'
import type { DocumentBatchesRepository } from '../../interfaces/document-batches-repository'

describe('Create Document Batch Use Case', () => {
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

    const fixedDate = new Date('2026-08-03T12:00:00.000Z')
    datetimeProvider.now.mockReturnValue(fixedDate)
    dailyCountersRepository.incrementAndGet.mockResolvedValue(15)

    documentBatchesRepository.add.mockImplementation(async (batch) => ({
      id: 'fake-batch-id',
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

  it('identifies batch directly if channel is internal upload', async () => {
    const result = await useCase.execute({
      channel: DocumentChannel.InternalUpload,
      sender: 'user-id',
      files: [],
      createdBy: 'user-id',
    })

    expect(result.status).toBe(DocumentBatchStatus.Identified)
    expect(result.inTriageBox).toBe(false)
    expect(result.readableId).toBe('LOTE-20260803-0015')
  })

  it('identifies batch if whatsapp sender matches exactly one client', async () => {
    clientsRepository.findByPhone.mockResolvedValue([
      { id: 'client-id-123' } as any,
    ])

    const result = await useCase.execute({
      channel: DocumentChannel.Whatsapp,
      sender: '5511999999999',
      files: [],
    })

    expect(result.status).toBe(DocumentBatchStatus.Identified)
    expect(result.inTriageBox).toBe(false)
    expect(result.clientId).toBe('client-id-123')
  })

  it('sends batch to triage if whatsapp sender matches zero clients', async () => {
    clientsRepository.findByPhone.mockResolvedValue([])

    const result = await useCase.execute({
      channel: DocumentChannel.Whatsapp,
      sender: '5511999999999',
      files: [],
    })

    expect(result.status).toBe(DocumentBatchStatus.PendingIdentification)
    expect(result.inTriageBox).toBe(true)
    expect(result.clientId).toBeUndefined()
  })

  it('sends batch to triage if whatsapp sender matches multiple clients', async () => {
    clientsRepository.findByPhone.mockResolvedValue([
      { id: 'client-1' } as any,
      { id: 'client-2' } as any,
    ])

    const result = await useCase.execute({
      channel: DocumentChannel.Whatsapp,
      sender: '5511999999999',
      files: [],
    })

    expect(result.status).toBe(DocumentBatchStatus.PendingIdentification)
    expect(result.inTriageBox).toBe(true)
    expect(result.clientId).toBeUndefined()
  })
})