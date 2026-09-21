import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProcessWhatsappBatchJob } from '../process-whatsapp-batch-job'

describe('ProcessWhatsappBatchJob', () => {
  let job: ProcessWhatsappBatchJob
  let mockInngest: any
  let mockCreateDocumentBatchUseCase: any
  let mockStorageProvider: any
  let mockWhatsappProvider: any

  beforeEach(() => {
    mockInngest = {
      createFunction: vi.fn((_config, handler) => handler),
    }

    mockCreateDocumentBatchUseCase = {
      execute: vi.fn().mockResolvedValue({ id: 'batch-123' }),
    }

    mockStorageProvider = {
      upload: vi.fn().mockResolvedValue('uploaded-path'),
    }

    mockWhatsappProvider = {
      downloadMedia: vi.fn().mockResolvedValue({
        buffer: Buffer.from('fake-media-content'),
        mimeType: 'application/pdf',
      }),
    }

    job = new ProcessWhatsappBatchJob(
      mockInngest,
      mockCreateDocumentBatchUseCase,
      mockStorageProvider,
      mockWhatsappProvider,
    )
  })

  it('should sanitize special characters, accents, and em-dashes in originalName when generating storagePath', async () => {
    const handler = (job as any).function
    const step = {
      run: vi.fn(async (_name, fn) => await fn()),
    }

    const event = {
      data: {
        eventoId: 'evento-1',
        mediaId: 'media-123',
        sender: '5519999999999',
        clientId: 'client-uuid',
        originalName: '_712020c3-PRD — Módulo de Agendamento-310726.pdf',
        mimeType: 'application/pdf',
      },
    }

    const result = await handler({ event, step })

    expect(mockWhatsappProvider.downloadMedia).toHaveBeenCalledWith('media-123')
    expect(mockStorageProvider.upload).toHaveBeenCalledWith(
      'whatsapp/evento-1/_712020c3-PRD___Modulo_de_Agendamento-310726.pdf',
      expect.any(Buffer),
      'application/pdf',
    )
    expect(mockCreateDocumentBatchUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [
          expect.objectContaining({
            originalName: '_712020c3-PRD — Módulo de Agendamento-310726.pdf',
            storagePath:
              'whatsapp/evento-1/_712020c3-PRD___Modulo_de_Agendamento-310726.pdf',
          }),
        ],
      }),
    )
    expect(result).toEqual({ status: 'received', batchId: 'batch-123' })
  })
})
