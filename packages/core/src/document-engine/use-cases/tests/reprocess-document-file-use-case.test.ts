import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseAccessIntent } from '../../../case-management/domain/structures/case-access-intent'
import type { CaseAccessProvider } from '../../../case-management/interfaces'
import type { DocumentBatchFile } from '#document-engine/domain/entities/document-batch'
import { DocumentValidationDocumentFaker } from '#document-engine/domain/entities/fakers'
import { DocumentBatchChannel } from '#document-engine/domain/structures'
import { DocumentFileProcessingRequestedEvent } from '#document-engine/domain/events'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '#document-engine/interfaces'
import { AppError, ForbiddenError } from '#shared/domain/errors'
import type { Broker } from '#shared/interfaces'
import type { GetDocumentValidationUseCase } from '../get-document-validation-use-case'
import { ReprocessDocumentFileUseCase } from '../reprocess-document-file-use-case'

describe('Reprocess Document File Use Case', () => {
  let batches: MockProxy<DocumentBatchesRepository>
  let validations: MockProxy<DocumentValidationsRepository>
  let broker: MockProxy<Broker>
  let access: MockProxy<CaseAccessProvider>
  let getValidation: MockProxy<GetDocumentValidationUseCase>
  let file: DocumentBatchFile
  let useCase: ReprocessDocumentFileUseCase

  beforeEach(() => {
    batches = mock<DocumentBatchesRepository>()
    validations = mock<DocumentValidationsRepository>()
    broker = mock<Broker>()
    access = mock<CaseAccessProvider>()
    getValidation = mock<GetDocumentValidationUseCase>()
    const document = DocumentValidationDocumentFaker.fake({
      id: 'file-1',
      checklistLink: { caseId: 'case-current' },
      channel: DocumentBatchChannel.WhatsApp,
      clientId: 'client-current',
    })
    file = {
      id: document.id,
      batchId: document.batchId,
      storagePath: document.storagePath,
      originalName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      createdAt: document.createdAt,
    }
    validations.findByFileId.mockResolvedValue(document)
    validations.recordProcessing.mockResolvedValue(document)
    batches.findFileById.mockResolvedValue(file)
    getValidation.execute.mockResolvedValue(document)
    useCase = new ReprocessDocumentFileUseCase(
      batches,
      validations,
      broker,
      access,
      getValidation,
    )
  })

  it('authorizes current ownership before mutation and publishes the canonical payload', async () => {
    const result = await useCase.execute({ documentFileId: file.id, actorId: 'actor-1' })
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId: 'case-current',
      actorId: 'actor-1',
      intent: CaseAccessIntent.WriteContent,
      expectedClientId: 'client-current',
    })
    expect(validations.recordProcessing).toHaveBeenCalledExactlyOnceWith(file.id)
    expect(broker.publish).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        name: DocumentFileProcessingRequestedEvent._NAME,
        payload: {
          batchId: file.batchId,
          documentFileId: file.id,
          storagePath: file.storagePath,
          originalName: file.originalName,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
      }),
    )
    expect(access.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      batches.findFileById.mock.invocationCallOrder[0],
    )
    expect(access.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      validations.recordProcessing.mock.invocationCallOrder[0],
    )
    expect(validations.recordProcessing.mock.invocationCallOrder[0]).toBeLessThan(
      broker.publish.mock.invocationCallOrder[0],
    )
    expect(broker.publish.mock.invocationCallOrder[0]).toBeLessThan(
      getValidation.execute.mock.invocationCallOrder[0],
    )
    expect(getValidation.execute).toHaveBeenCalledExactlyOnceWith({
      documentFileId: file.id,
      actorId: 'actor-1',
    })
    expect(result).toEqual(await getValidation.execute.mock.results[0].value)
  })

  it.each([
    'removed member',
    'Closed Case',
  ])('does not mutate or publish when authorization denies a %s', async () => {
    const error = new ForbiddenError('Acesso negado.')
    access.authorize.mockRejectedValue(error)
    await expect(
      useCase.execute({ documentFileId: file.id, actorId: 'actor-1' }),
    ).rejects.toBe(error)
    expect(batches.findFileById).not.toHaveBeenCalled()
    expect(validations.recordProcessing).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
    expect(getValidation.execute).not.toHaveBeenCalled()
  })

  it('retains independent document reprocessing without inventing a Case owner', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: file.id,
        checklistLink: undefined,
        channel: DocumentBatchChannel.WhatsApp,
      }),
    )
    await useCase.execute({ documentFileId: file.id, actorId: 'actor-1' })
    expect(access.authorize).not.toHaveBeenCalled()
    expect(validations.recordProcessing).toHaveBeenCalledWith(file.id)
    expect(broker.publish).toHaveBeenCalledOnce()
  })

  it('does not send internal uploads for automatic processing', async () => {
    validations.findByFileId.mockResolvedValue(
      DocumentValidationDocumentFaker.fake({
        id: file.id,
        checklistLink: { caseId: 'case-current' },
        channel: DocumentBatchChannel.InternalUpload,
        clientId: 'client-current',
      }),
    )

    await expect(
      useCase.execute({ documentFileId: file.id, actorId: 'actor-1' }),
    ).rejects.toThrow('Este arquivo não admite processamento automático.')

    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId: 'case-current',
      actorId: 'actor-1',
      intent: CaseAccessIntent.WriteContent,
      expectedClientId: 'client-current',
    })
    expect(batches.findFileById).not.toHaveBeenCalled()
    expect(validations.recordProcessing).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
    expect(getValidation.execute).not.toHaveBeenCalled()
  })

  it('rejects missing validation ownership before finding the file or publishing', async () => {
    validations.findByFileId.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ documentFileId: file.id, actorId: 'actor-1' }),
    ).rejects.toBeInstanceOf(AppError)
    expect(access.authorize).not.toHaveBeenCalled()
    expect(batches.findFileById).not.toHaveBeenCalled()
    expect(validations.recordProcessing).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('rejects missing file bytes without mutation or publication', async () => {
    batches.findFileById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ documentFileId: file.id, actorId: 'actor-1' }),
    ).rejects.toThrow('O documento informado para reprocessamento não foi encontrado.')
    expect(validations.recordProcessing).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
    expect(getValidation.execute).not.toHaveBeenCalled()
  })

  it('does not publish if recording processing fails', async () => {
    const error = new AppError('Persistence failed', 'Persistence error')
    validations.recordProcessing.mockRejectedValue(error)
    await expect(
      useCase.execute({ documentFileId: file.id, actorId: 'actor-1' }),
    ).rejects.toBe(error)
    expect(broker.publish).not.toHaveBeenCalled()
    expect(getValidation.execute).not.toHaveBeenCalled()
  })

  it('propagates broker failure after the existing processing write without claiming atomicity', async () => {
    const error = new AppError('Publication failed', 'Broker error')
    broker.publish.mockRejectedValue(error)
    await expect(
      useCase.execute({ documentFileId: file.id, actorId: 'actor-1' }),
    ).rejects.toBe(error)
    expect(validations.recordProcessing).toHaveBeenCalledExactlyOnceWith(file.id)
    expect(broker.publish).toHaveBeenCalledOnce()
    expect(getValidation.execute).not.toHaveBeenCalled()
    expect(validations.recordProcessing.mock.invocationCallOrder[0]).toBeLessThan(
      broker.publish.mock.invocationCallOrder[0],
    )
  })
})
