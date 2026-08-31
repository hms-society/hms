import { FormalizationSignaturePreviewGenerationRequestedEvent } from '@hms/core/formalization/domain'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormalizationModuleFixture } from '@/formalization/fixtures/formalization-module-fixture'
import { GenerateFormalizationSignaturePreviewJob } from '@/formalization/messaging/inngest/jobs/generate-formalization-signature-preview-job'

describe('Generate Formalization Signature Preview Job', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register({
      inngestJob: GenerateFormalizationSignaturePreviewJob,
    })
  })

  afterAll(async () => {
    await fixture?.close()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    vi.clearAllMocks()
    fixture.sourceReader.listCurrentDocuments.mockResolvedValue([])
    fixture.sourceReader.findDocumentVersion.mockResolvedValue(null)
  })

  it('registers bounded retry and conversion concurrency settings', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: GenerateFormalizationSignaturePreviewJob.ID,
      concurrency: 2,
      retries: 3,
      timeouts: { finish: '2m' },
    })
  })

  it('converts and persists a ready preview through the real module integrations', async () => {
    const preview = await fixture.seedPendingSignaturePreview()
    const sourceContent = new Uint8Array([80, 75, 3, 4])
    const sourceFilePath = `formalization/${preview.formalizationId}/source.docx`
    const sourceFile = await fixture.fileStorageProvider.save({
      filePath: sourceFilePath,
      fileName: 'source.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeInBytes: sourceContent.byteLength,
      content: sourceContent,
    })
    const sourceDocument = {
      documentId: preview.documentId,
      documentVersionId: preview.documentVersionId,
      name: 'Contract fixture',
      reviewStatus: 'approved',
      fileId: sourceFile.id,
    }
    fixture.sourceReader.listCurrentDocuments.mockResolvedValue([sourceDocument])
    fixture.sourceReader.findDocumentVersion.mockResolvedValue(sourceDocument)
    const event = new FormalizationSignaturePreviewGenerationRequestedEvent({
      formalizationId: preview.formalizationId,
      previewId: preview.previewId,
      attemptToken: preview.attemptToken,
      occurredAt: fixture.datetimeProvider.now().toISOString(),
    })

    const run = await fixture.runInngest({
      name: event.name,
      data: event.payload,
    })

    expect(run.status.toLowerCase()).toBe('completed')
    expect(fixture.converter.convert).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'source.docx',
        content: sourceContent,
        traceId: preview.previewId,
      }),
    )
    expect(fixture.inspector.inspect).toHaveBeenCalledWith(
      new Uint8Array([37, 80, 68, 70]),
    )

    const configuration =
      await fixture.signatureConfigurationRepository.findByFormalizationId(
        preview.formalizationId,
      )
    expect(configuration?.documents).toContainEqual(
      expect.objectContaining({
        documentId: preview.documentId,
        documentVersionId: preview.documentVersionId,
        preview: expect.objectContaining({
          previewId: preview.previewId,
          state: 'ready',
          pageCount: 1,
          pages: [{ page: 1, width: 595, height: 842 }],
        }),
      }),
    )
    const readyFileId =
      await fixture.signatureConfigurationRepository.findReadyPreviewFileId(
        preview.formalizationId,
        preview.previewId,
      )
    expect(readyFileId).toEqual(expect.any(String))
    await expect(fixture.fileStorageProvider.get(sourceFile.id)).resolves.toEqual({
      file: sourceFile,
      content: sourceContent,
    })
    await expect(
      fixture.fileStorageProvider.get(readyFileId as string),
    ).resolves.toMatchObject({
      file: expect.objectContaining({ contentType: 'application/pdf' }),
      content: new Uint8Array([37, 80, 68, 70]),
    })
  })

  it('rejects an event with a stale attempt token without processing the preview', async () => {
    const preview = await fixture.seedPendingSignaturePreview()
    const event = new FormalizationSignaturePreviewGenerationRequestedEvent({
      formalizationId: preview.formalizationId,
      previewId: preview.previewId,
      attemptToken: fixture.idProvider.generate(),
      occurredAt: fixture.datetimeProvider.now().toISOString(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(fixture.sourceReader.findDocumentVersion).not.toHaveBeenCalled()
    expect(fixture.converter.convert).not.toHaveBeenCalled()
    const configuration =
      await fixture.signatureConfigurationRepository.findByFormalizationId(
        preview.formalizationId,
      )
    expect(configuration?.documents[0]?.preview).toMatchObject({
      previewId: preview.previewId,
      state: 'pending',
    })
  })

  it('persists a terminal failure when the source document is unavailable', async () => {
    const preview = await fixture.seedPendingSignaturePreview()
    const event = new FormalizationSignaturePreviewGenerationRequestedEvent({
      formalizationId: preview.formalizationId,
      previewId: preview.previewId,
      attemptToken: preview.attemptToken,
      occurredAt: fixture.datetimeProvider.now().toISOString(),
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('failed')
    expect(fixture.converter.convert).not.toHaveBeenCalled()
    const configuration =
      await fixture.signatureConfigurationRepository.findByFormalizationId(
        preview.formalizationId,
      )
    expect(configuration?.documents[0]?.preview).toMatchObject({
      previewId: preview.previewId,
      state: 'failed',
      failureCode: 'document_version_file_unavailable',
    })
  })
})
