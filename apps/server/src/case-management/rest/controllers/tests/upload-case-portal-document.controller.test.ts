import { describe, expect, it, vi } from 'vitest'

import { UploadCasePortalDocumentController } from '../upload-case-portal-document.controller'

describe('UploadCasePortalDocumentController', () => {
  it('links the newly uploaded file when the batch already contains older files', async () => {
    const checklistItemsRepository = {
      listByCaseId: vi.fn().mockResolvedValue([{ id: 'checklist-item-1' }]),
      markAsInAnalysisByDocument: vi.fn().mockResolvedValue({
        id: 'checklist-item-1',
        status: 'in_analysis',
      }),
    }
    const createDocumentBatchUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'batch-1',
        readableId: 'LOTE-20260923-0001',
        files: [
          {
            id: 'old-file',
            storagePath: 'third-party-portal/case-1/100-old.pdf',
            originalName: 'documento-antigo.pdf',
          },
          {
            id: 'new-file',
            storagePath: 'third-party-portal/case-1/123-documento-novo.pdf',
            originalName: 'documento-novo.pdf',
          },
        ],
      }),
    }
    const checklistItems = checklistItemsRepository as never
    const controller = new UploadCasePortalDocumentController(
      { findById: vi.fn().mockResolvedValue({ clientId: 'client-1' }) } as never,
      checklistItems,
      createDocumentBatchUseCase as never,
      { upload: vi.fn() } as never,
    )

    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(123)

    await controller.handle(
      'case-1',
      'checklist-item-1',
      {
        originalname: 'documento-novo.pdf',
        mimetype: 'application/pdf',
        size: 128,
        buffer: Buffer.from('document'),
      },
      { id: 'grant-1' } as never,
    )

    dateNowSpy.mockRestore()

    expect(checklistItemsRepository.markAsInAnalysisByDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        documentFileId: 'new-file',
        documentFileName: 'documento-novo.pdf',
      }),
    )
  })
})
