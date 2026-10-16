import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CreateDocumentBatchUseCase } from '../create-document-batch-use-case'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
  DocumentValidationStatus,
} from '../../domain/structures'
import { DocumentBatchFaker, DocumentBatchFileFaker } from '../../domain/entities/fakers'
import { ClientFaker } from '../../../identity/domain/entities/fakers'
import { ClientNotFoundError } from '../../../identity/domain/errors'
import type { ClientsRepository } from '../../../identity/interfaces/clients-repository'
import type { Broker, DatetimeProvider } from '../../../shared/interfaces'
import { DocumentFileProcessingRequestedEvent } from '../../domain/events'
import type { DailyCountersRepository, DocumentBatchesRepository } from '../../interfaces'

describe('Create Document Batch Use Case', () => {
  let batches: MockProxy<DocumentBatchesRepository>
  let counters: MockProxy<DailyCountersRepository>
  let clients: MockProxy<ClientsRepository>
  let clock: MockProxy<DatetimeProvider>
  let broker: MockProxy<Broker>
  let useCase: CreateDocumentBatchUseCase
  const instant = new Date('2026-08-07T12:00:00.000Z')
  const client = ClientFaker.fake()
  const file = DocumentBatchFileFaker.fake({
    storagePath: 'documents/original.pdf',
    status: DocumentValidationStatus.Processing,
  })
  beforeEach(() => {
    batches = mock<DocumentBatchesRepository>()
    counters = mock<DailyCountersRepository>()
    clients = mock<ClientsRepository>()
    clock = mock<DatetimeProvider>()
    broker = mock<Broker>()
    clock.now.mockReturnValue(instant)
    counters.incrementAndGet.mockResolvedValue(1)
    clients.findById.mockResolvedValue(client)
    batches.add.mockImplementation(async (batch) => {
      if (
        batch.status === DocumentBatchStatus.Pending ||
        batch.status === DocumentBatchStatus.Linked ||
        batch.status === DocumentBatchStatus.Discarded
      )
        throw new Error('Expected a modern receipt status')
      return DocumentBatchFaker.fake({
        ...batch,
        status: batch.status,
        createdAt: instant,
        updatedAt: instant,
        files: batch.files.map((created) => DocumentBatchFileFaker.fake({ ...created })),
      })
    })
    useCase = new CreateDocumentBatchUseCase(batches, counters, clients, clock, broker)
  })
  it.each([
    undefined,
    false,
    true,
  ])('forces manual review for InternalUpload even when skipProcessing=%s', async (skipProcessing) => {
    const result = await useCase.execute({
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'internal-user',
      files: [file],
      createdBy: 'internal-user',
      clientId: client.id,
      skipProcessing,
    })
    expect(result).toMatchObject({
      status: DocumentBatchStatus.Identified,
      inTriageBox: true,
      clientId: client.id,
      readableId: 'LOTE-20260807-0001',
    })
    expect(batches.add.mock.calls[0][0].files[0].status).toBe(
      DocumentValidationStatus.AwaitingValidation,
    )
    expect(clients.findByPhone).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
  it('preserves internal triage without inventing a client and rejects a nonexistent supplied client', async () => {
    const result = await useCase.execute({
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'actor',
      files: [],
    })
    expect(result.inTriageBox).toBe(true)
    expect(result.clientId).toBeUndefined()
    expect(clients.findById).not.toHaveBeenCalled()
    clients.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        channel: DocumentBatchChannel.InternalUpload,
        sender: 'actor',
        clientId: 'missing',
        files: [file],
      }),
    ).rejects.toBeInstanceOf(ClientNotFoundError)
    expect(batches.add).toHaveBeenCalledTimes(1)
    expect(broker.publish).not.toHaveBeenCalled()
  })
  it('retains existing WhatsApp client matching and confirmed-client semantics', async () => {
    clients.findByPhone.mockResolvedValue([client])
    const matched = await useCase.execute({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '+5511999999999',
      files: [],
    })
    expect(matched).toMatchObject({
      status: DocumentBatchStatus.Identified,
      inTriageBox: false,
      clientId: client.id,
    })
    expect(clients.findByPhone).toHaveBeenCalledWith('+5511999999999')
    clients.findByPhone.mockClear()
    const confirmed = await useCase.execute({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '+5511999999999',
      clientId: client.id,
      files: [],
    })
    expect(confirmed).toMatchObject({
      status: DocumentBatchStatus.Identified,
      inTriageBox: false,
      clientId: client.id,
    })
    expect(clients.findByPhone).not.toHaveBeenCalled()
  })
  it.each([
    undefined,
    [],
    ClientFaker.fakeMany(2),
  ])('preserves triage when WhatsApp matching is absent or ambiguous', async (matches) => {
    clients.findByPhone.mockResolvedValue(matches ?? [])
    const result = await useCase.execute({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '+5511999999999',
      files: [],
    })
    expect(result).toMatchObject({
      status: DocumentBatchStatus.PendingIdentification,
      inTriageBox: true,
      clientId: undefined,
    })
  })
  it.each([
    DocumentBatchChannel.WhatsApp,
    DocumentBatchChannel.ClientPortal,
    DocumentBatchChannel.ThirdPartyPortal,
    DocumentBatchChannel.Email,
  ])('keeps external %s processing and publishes the owning canonical event', async (channel) => {
    const result = await useCase.execute({
      channel,
      sender: 'external-source',
      files: [file],
    })
    expect(result.files?.[0].status).toBe(DocumentValidationStatus.Processing)
    expect(broker.publish).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        name: DocumentFileProcessingRequestedEvent._NAME,
        payload: expect.objectContaining({
          batchId: result.id,
          documentFileId: result.files?.[0].id,
          storagePath: file.storagePath,
        }),
      }),
    )
  })
  it('honors the existing external skip flag and custom readable identity', async () => {
    const result = await useCase.execute({
      channel: DocumentBatchChannel.ClientPortal,
      sender: 'portal-source',
      files: [file],
      clientId: client.id,
      readableId: 'CUSTOM-LOTE-999',
      skipProcessing: true,
    })
    expect(result.readableId).toBe('CUSTOM-LOTE-999')
    expect(result.files?.[0].status).toBe(DocumentValidationStatus.AwaitingValidation)
    expect(batches.findDailyByClient).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
  it.each([
    DocumentBatchChannel.InternalUpload,
    DocumentBatchChannel.WhatsApp,
  ])('reuses only the same-channel %s daily batch and publishes only newly appended external files', async (channel) => {
    const older = DocumentBatchFileFaker.fake({ storagePath: 'documents/older.pdf' })
    const existing = DocumentBatchFaker.fake({
      channel,
      clientId: client.id,
      files: [older],
    })
    batches.findDailyByClient.mockResolvedValue(existing)
    const added = DocumentBatchFileFaker.fake({ ...file, batchId: existing.id })
    batches.addFiles.mockResolvedValue({ ...existing, files: [older, added] })
    const result = await useCase.execute({
      channel,
      sender: 'source',
      clientId: client.id,
      files: [file],
      skipProcessing: false,
    })
    expect(result.id).toBe(existing.id)
    expect(batches.findDailyByClient).toHaveBeenCalledExactlyOnceWith(
      client.id,
      new Date('2026-08-07T00:00:00Z'),
      new Date('2026-08-08T00:00:00Z'),
      channel,
    )
    expect(batches.add).not.toHaveBeenCalled()
    expect(counters.incrementAndGet).not.toHaveBeenCalled()
    if (channel === DocumentBatchChannel.InternalUpload)
      expect(broker.publish).not.toHaveBeenCalled()
    else {
      expect(broker.publish).toHaveBeenCalledOnce()
      expect(broker.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ documentFileId: added.id }),
        }),
      )
    }
  })
  it.each([
    DocumentBatchChannel.WhatsApp,
    undefined,
  ])('defensively refuses a foreign or missing daily batch channel %s', async (channel) => {
    batches.findDailyByClient.mockResolvedValue(
      DocumentBatchFaker.fake({ channel, clientId: client.id }),
    )
    const result = await useCase.execute({
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'actor',
      clientId: client.id,
      files: [file],
    })
    expect(result.channel).toBe(DocumentBatchChannel.InternalUpload)
    expect(batches.addFiles).not.toHaveBeenCalled()
    expect(batches.add).toHaveBeenCalledOnce()
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
