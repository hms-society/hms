import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ListReceivedClientDocumentsUseCase } from '../list-received-client-documents-use-case'
import type { ResolveReceivedClientDocumentUseCase } from '../resolve-received-client-document-use-case'
import type { DocumentBatchesRepository } from '../../interfaces'
import {
  ClientDocumentFaker,
  DocumentBatchFaker,
  DocumentBatchFileFaker,
} from '../../domain/entities/fakers'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
describe('List received client originals', () => {
  it('filters denied originating Case files without leaking names', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const resolve = mock<ResolveReceivedClientDocumentUseCase>()
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ files: [DocumentBatchFileFaker.fake()] }),
    ])
    resolve.execute.mockRejectedValue(new ForbiddenError('Denied'))
    expect(
      await new ListReceivedClientDocumentsUseCase(batches, resolve).execute({
        clientId: 'client',
        actorId: 'actor',
        caseId: 'case',
      }),
    ).toEqual([])
  })
  it('returns readable originals while filtering missing sources and empty batches', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const resolve = mock<ResolveReceivedClientDocumentUseCase>()
    const file = DocumentBatchFileFaker.fake()
    const readable = ClientDocumentFaker.fake({
      source: { kind: 'received_file', fileId: file.id },
    })
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ files: [file, DocumentBatchFileFaker.fake()] }),
      DocumentBatchFaker.fake({ files: undefined }),
    ])
    resolve.execute
      .mockResolvedValueOnce(readable)
      .mockRejectedValueOnce(new NotFoundError('Original removed'))
    expect(
      await new ListReceivedClientDocumentsUseCase(batches, resolve).execute({
        clientId: readable.clientId,
        actorId: 'actor',
        caseId: 'case',
      }),
    ).toEqual([readable])
    expect(resolve.execute).toHaveBeenCalledTimes(2)
  })
  it('surfaces operational source failures instead of disguising them as an empty collection', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const resolve = mock<ResolveReceivedClientDocumentUseCase>()
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ files: [DocumentBatchFileFaker.fake()] }),
    ])
    resolve.execute.mockRejectedValue(new Error('database unavailable'))
    await expect(
      new ListReceivedClientDocumentsUseCase(batches, resolve).execute({
        clientId: 'client',
        actorId: 'actor',
        caseId: 'case',
      }),
    ).rejects.toThrow('database unavailable')
  })
})
