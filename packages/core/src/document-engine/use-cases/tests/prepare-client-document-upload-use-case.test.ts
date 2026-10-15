import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { PrepareClientDocumentUploadUseCase } from '../prepare-client-document-upload-use-case'
import type { ClientDocumentUploadsRepository } from '../../interfaces'
import type { StorageProvider, DatetimeProvider, IdProvider } from '#shared/interfaces'
import { ClientDocumentUploadFaker } from '../../domain/entities/fakers'
describe('Prepare client upload', () => {
  const uploads = mock<ClientDocumentUploadsRepository>()
  const storage = mock<StorageProvider>()
  const clock = mock<DatetimeProvider>()
  const ids = mock<IdProvider>()
  const upload = ClientDocumentUploadFaker.fake()
  const request = { ...upload }
  const ticket = {
    path: upload.storagePath,
    bucket: 'documents',
    signedUrl: 'http://storage/upload',
    token: 'token',
    expiresAt: new Date('2030-01-01'),
  }
  const useCase = new PrepareClientDocumentUploadUseCase(uploads, storage, clock, ids)
  beforeEach(() => {
    uploads.findByOperation.mockResolvedValue(upload)
    storage.inspect.mockResolvedValue(undefined)
    storage.createSignedUpload.mockResolvedValue(ticket)
  })
  it('renews expired ticket on the same immutable path', async () => {
    expect(await useCase.execute(request)).toEqual({
      ...ticket,
      uploadId: upload.id,
      alreadyUploaded: false,
    })
    expect(storage.createSignedUpload).toHaveBeenCalledWith(upload.storagePath)
  })
  it('recovers a lost PUT response without a second upload', async () => {
    storage.inspect.mockResolvedValue({
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
    })
    expect((await useCase.execute(request)).alreadyUploaded).toBe(true)
  })
  it('rejects reused operation with changed payload', async () => {
    await expect(useCase.execute({ ...request, name: 'other.pdf' })).rejects.toThrow()
  })
  it.each([0, 10485761, -1, 1.5])('rejects invalid size %s', async (sizeBytes) => {
    await expect(useCase.execute({ ...request, sizeBytes })).rejects.toThrow()
  })
  it('rejects unsupported media', async () => {
    await expect(
      useCase.execute({ ...request, mimeType: 'text/plain' }),
    ).rejects.toThrow()
  })
})
