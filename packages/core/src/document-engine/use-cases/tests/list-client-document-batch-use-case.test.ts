import { describe, expect, it, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { ListClientDocumentBatchUseCase } from '../list-client-document-batch-use-case'
import type { DocumentBatchesRepository } from '../../interfaces/document-batches-repository'
import type { DocumentBatch } from '../../domain/entities/document-batch'
import { DocumentBatchChannel, DocumentBatchStatus } from '../../domain/structures'

describe('ListClientDocumentBatchUseCase', () => {
  let documentBatchesRepository: MockProxy<DocumentBatchesRepository>
  let useCase: ListClientDocumentBatchUseCase

  beforeEach(() => {
    documentBatchesRepository = mock<DocumentBatchesRepository>()
    useCase = new ListClientDocumentBatchUseCase(documentBatchesRepository)
  })

  it('should return a list of document batches associated with the client id', async () => {
    const mockBatches: DocumentBatch[] = [
      {
        id: 'batch-1',
        readableId: 'LOTE-1',
        status: DocumentBatchStatus.Identified,
        channel: DocumentBatchChannel.WhatsApp,
        sender: '123',
        inTriageBox: false,
        clientId: 'client-123',
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]

    documentBatchesRepository.findById.mockResolvedValue(mockBatches)

    const result = await useCase.execute('client-123')

    expect(result).toEqual(mockBatches)
    expect(documentBatchesRepository.findById).toHaveBeenCalledWith('client-123')
  })
})
