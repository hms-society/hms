import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { DocumentValidationsRepository } from '../../interfaces'
import { DocumentValidationDocumentFaker } from '../../domain/entities/fakers'
import { DocumentBatchChannel } from '../../domain/structures'
import { ShouldProcessDocumentFileUseCase } from '../should-process-document-file-use-case'

describe('Should Process Document File Use Case', () => {
  let validations: MockProxy<DocumentValidationsRepository>
  let useCase: ShouldProcessDocumentFileUseCase
  const document = DocumentValidationDocumentFaker.fake()
  beforeEach(() => {
    validations = mock<DocumentValidationsRepository>()
    useCase = new ShouldProcessDocumentFileUseCase(validations)
  })
  it.each(
    Object.values(DocumentBatchChannel),
  )('uses the persisted %s channel instead of event path or metadata', async (channel) => {
    validations.findByFileId.mockResolvedValue({ ...document, channel })
    expect(
      await useCase.execute({ documentFileId: document.id, batchId: document.batchId }),
    ).toBe(channel !== DocumentBatchChannel.InternalUpload)
    expect(validations.findByFileId).toHaveBeenCalledExactlyOnceWith(document.id)
  })
  it('does not process a missing persisted original', async () => {
    validations.findByFileId.mockResolvedValue(undefined)
    expect(
      await useCase.execute({ documentFileId: document.id, batchId: document.batchId }),
    ).toBe(false)
  })
  it('rejects an event referencing a different persisted batch even for an external channel', async () => {
    validations.findByFileId.mockResolvedValue({
      ...document,
      channel: DocumentBatchChannel.WhatsApp,
    })
    expect(
      await useCase.execute({ documentFileId: document.id, batchId: 'different-batch' }),
    ).toBe(false)
  })
})
