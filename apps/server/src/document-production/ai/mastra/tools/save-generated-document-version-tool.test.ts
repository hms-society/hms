import type {
  DocumentFileExporter,
  DocumentGenerationsRepository,
  DocumentVersionsRepository,
} from '@hms/core/document-production/interfaces'
import {
  DocumentGenerationFaker,
  DocumentVersionFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { SaveGeneratedDocumentVersionTool } from './save-generated-document-version-tool'

const generationId = '00000000-0000-4000-8000-000000000001'
const documentId = '00000000-0000-4000-8000-000000000002'
const fileId = '00000000-0000-4000-8000-000000000003'

function createInput() {
  return {
    documentGenerationId: generationId,
    source: {
      type: 'consultation' as const,
      id: '00000000-0000-4000-8000-000000000004',
      data: {},
    },
    template: {
      name: 'Procuração',
      content: { type: 'doc' as const },
      variables: [],
    },
    attemptsCount: 1,
    draft: { content: { type: 'doc' as const } },
    review: { decision: 'approved' as const, findings: [] },
    pendingMarkers: [],
  }
}

function createTool() {
  const generation = DocumentGenerationFaker.fake({
    id: generationId,
    documentId,
    status: 'running',
  })
  const version = DocumentVersionFaker.fake({
    id: '00000000-0000-4000-8000-000000000005',
    documentId,
    documentGenerationId: generationId,
    fileId,
  })
  const generationsRepository: DocumentGenerationsRepository = {
    add: vi.fn(),
    addOrGet: vi.fn(),
    removeAll: vi.fn(),
    findById: vi.fn().mockResolvedValue(generation),
    findLatestByDocumentId: vi.fn().mockResolvedValue(undefined),
    findLatestByDocumentIds: vi.fn(),
    replace: vi.fn().mockResolvedValue({ ...generation, status: 'completed' }),
  }
  const versionsRepository: DocumentVersionsRepository = {
    add: vi.fn().mockResolvedValue(version),
    removeAll: vi.fn(),
    findLatestByDocumentId: vi.fn().mockResolvedValue(undefined),
    findByDocumentGenerationId: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findByDocumentIds: vi.fn(),
    review: vi.fn(),
  }
  const fileStorageProvider: FileStorageProvider = {
    save: vi.fn().mockResolvedValue({
      id: fileId,
      filePath: 'document-production/test.docx',
      fileName: 'test.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeInBytes: 4,
      createdAt: new Date('2026-08-26T12:00:00.000Z'),
    }),
    get: vi.fn(),
    remove: vi.fn(),
  }
  const documentFileExporter: DocumentFileExporter = {
    export: vi.fn().mockResolvedValue({
      content: new Uint8Array([1, 2, 3, 4]),
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    }),
  }
  const datetimeProvider = {
    now: vi.fn().mockReturnValue(new Date('2026-08-26T12:00:00.000Z')),
  }
  const tool = new SaveGeneratedDocumentVersionTool(
    generationsRepository,
    versionsRepository,
    documentFileExporter,
    fileStorageProvider,
    datetimeProvider,
  )

  return { tool: tool.function, versionsRepository, fileStorageProvider, generation }
}

describe('Save Generated Document Version Tool', () => {
  it('uses durable file storage and completes the generated version', async () => {
    const { tool, versionsRepository, fileStorageProvider } = createTool()

    const result = await tool.execute(createInput(), { requestContext: {} })

    expect(result).toMatchObject({
      status: 'approved',
      documentGenerationId: generationId,
      documentVersionId: '00000000-0000-4000-8000-000000000005',
    })
    expect(fileStorageProvider.save).toHaveBeenCalledOnce()
    expect(versionsRepository.add).toHaveBeenCalledOnce()
  })

  it('preserves compensation when version persistence fails', async () => {
    const { tool, versionsRepository, fileStorageProvider } = createTool()
    vi.mocked(versionsRepository.add).mockRejectedValueOnce(new Error('version failed'))

    await expect(tool.execute(createInput(), { requestContext: {} })).rejects.toThrow(
      'version failed',
    )
    expect(fileStorageProvider.remove).toHaveBeenCalledWith(fileId)
  })
})
