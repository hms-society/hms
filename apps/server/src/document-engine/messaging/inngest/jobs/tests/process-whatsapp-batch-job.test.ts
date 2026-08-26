import { describe, expect, it, vi } from 'vitest'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'
import type { CreateDocumentBatchUseCase } from '@hms/core/document-engine/use-cases'
import type { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { ProcessWhatsappBatchJob } from '../process-whatsapp-batch-job'

describe('ProcessWhatsappBatchJob', () => {
  it('executes CreateDocumentBatchUseCase when WhatsApp batch event is received for registered client', async () => {
    const mockExecute = vi.fn().mockResolvedValue({
      id: 'batch-123',
      status: DocumentBatchStatus.PendingIdentification,
      channel: DocumentBatchChannel.WhatsApp,
    })

    const mockCreateDocumentBatchUseCase = {
      execute: mockExecute,
    } as unknown as CreateDocumentBatchUseCase

    const mockInngest = {
      createFunction: vi.fn((_config, handler) => handler),
    } as unknown as InngestClient

    const job = new ProcessWhatsappBatchJob(mockInngest, mockCreateDocumentBatchUseCase)

    const event = {
      data: {
        eventoId: 'evt-1',
        sender: '5511999998888',
        clientId: 'client-123',
        mimeType: 'application/pdf',
        originalName: 'rg.pdf',
      },
    }

    const mockStep = {
      run: vi.fn(async (_name, fn) => fn()),
    }

    const handler = job.function as any
    const result = await handler({ event, step: mockStep })

    expect(mockExecute).toHaveBeenCalledWith({
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999998888',
      clientId: 'client-123',
      files: [
        {
          originalName: 'rg.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          storagePath: 'whatsapp/evt-1/rg.pdf',
        },
      ],
    })

    expect(result).toEqual({ status: 'received', batchId: 'batch-123' })
  })
})
