import { describe, expect, it } from 'vitest'
import { DrizzleDocumentBatchMapper } from './drizzle-document-batch-mapper'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'

describe('DrizzleDocumentBatchMapper', () => {
  it('should accurately map a raw Drizzle record to the domain DocumentBatch entity handling null coalescing', () => {
    const mapper = new DrizzleDocumentBatchMapper()
    const date = new Date()

    const rawRecord = {
      id: 'batch-uuid',
      readableId: 'LOTE-20260807-0001',
      status: DocumentBatchStatus.Identified,
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999999999',
      inTriageBox: false,
      clientId: 'client-uuid',
      intakeId: null,
      createdBy: null,
      files: [
        {
          id: 'file-uuid',
          batchId: 'batch-uuid',
          storagePath: 'client-uuid/file-uuid.pdf',
          originalName: 'documento.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1048576,
          createdAt: date,
        },
      ],
      createdAt: date,
      updatedAt: date,
    }

    const result = mapper.toDomain(rawRecord as any)

    expect(result).toEqual({
      id: 'batch-uuid',
      readableId: 'LOTE-20260807-0001',
      status: DocumentBatchStatus.Identified,
      channel: DocumentBatchChannel.WhatsApp,
      sender: '5511999999999',
      inTriageBox: false,
      clientId: 'client-uuid',
      intakeId: undefined,
      createdBy: undefined,
      files: [
        {
          id: 'file-uuid',
          batchId: 'batch-uuid',
          storagePath: 'client-uuid/file-uuid.pdf',
          originalName: 'documento.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1048576,
          createdAt: date,
        },
      ],
      createdAt: date,
      updatedAt: date,
    })
  })
})
