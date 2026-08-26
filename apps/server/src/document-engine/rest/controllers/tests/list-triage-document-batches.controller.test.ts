import { describe, expect, it, vi } from 'vitest'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'
import type { ListTriageDocumentBatchesUseCase } from '@hms/core/document-engine/use-cases'
import { ListTriageDocumentBatchesController } from '../list-triage-document-batches.controller'

describe('ListTriageDocumentBatchesController', () => {
  it('returns document batches currently in triage box', async () => {
    const mockBatches = [
      {
        id: 'batch-1',
        readableId: 'LOTE-20260826-0001',
        status: DocumentBatchStatus.PendingIdentification,
        channel: DocumentBatchChannel.WhatsApp,
        sender: '5511999998888',
        inTriageBox: true,
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const mockUseCase = {
      execute: vi.fn().mockResolvedValue(mockBatches),
    } as unknown as ListTriageDocumentBatchesUseCase

    const controller = new ListTriageDocumentBatchesController(mockUseCase)
    const result = await controller.handle()

    expect(mockUseCase.execute).toHaveBeenCalled()
    expect(result).toEqual(mockBatches)
  })
})
