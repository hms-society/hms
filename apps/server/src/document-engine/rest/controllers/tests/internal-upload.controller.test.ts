import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { LocalSupabaseStorageFixture } from '@/shared/rest/tests/local-supabase-storage-fixture'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import {
  DocumentBatchChannel,
  DocumentBatchStatus,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Internal Upload Controller [POST /document-batches/internal-upload]', () => {
  let fixture: DocumentEngineModuleFixture
  let storageFixture: LocalSupabaseStorageFixture
  let userId: string
  let clientId: string
  const uploadedPaths: string[] = []

  beforeAll(async () => {
    storageFixture = await LocalSupabaseStorageFixture.start()
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      undefined,
      userId,
      (builder) => storageFixture.configure(builder),
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    try {
      const storage = fixture?.app.get<StorageProvider>(STORAGE_PROVIDER)
      for (const path of uploadedPaths) await storage?.remove(path)
    } finally {
      try {
        await fixture?.close()
      } finally {
        await storageFixture?.close()
      }
    }
  })

  it('stores file metadata and creates a batch for the selected client', async () => {
    const response = await request(fixture.app.getHttpServer())
      .post('/document-batches/internal-upload?skipProcessing=true')
      .field('clientId', clientId)
      .attach('files', Buffer.from('test document'), 'proof.pdf')
      .expect(201)

    expect(response.body).toMatchObject({
      status: DocumentBatchStatus.Identified,
      inTriageBox: true,
    })
    expect(response.body.id).toEqual(expect.any(String))
    const batches = await fixture.documentBatchesRepository.findById(clientId)
    expect(batches).toEqual([
      expect.objectContaining({
        id: response.body.id,
        clientId,
        channel: DocumentBatchChannel.InternalUpload,
        createdBy: userId,
        files: [
          expect.objectContaining({
            originalName: 'proof.pdf',
            status: DocumentValidationStatus.AwaitingValidation,
          }),
        ],
      }),
    ])
    const path = batches[0]?.files?.[0]?.storagePath
    expect(path).toMatch(new RegExp(`^internal/${clientId}/[0-9]+-proof\\.pdf$`))
    if (!path) throw new Error('Stored file path missing')
    uploadedPaths.push(path)
    const storage = fixture.app.get<StorageProvider>(STORAGE_PROVIDER)
    expect(Buffer.from(await storage.download(path))).toEqual(
      Buffer.from('test document'),
    )
  })

  it('rejects a request without files before writing a batch', async () => {
    await request(fixture.app.getHttpServer())
      .post('/document-batches/internal-upload')
      .field('clientId', clientId)
      .expect(400)

    expect(await fixture.documentBatchesRepository.findById(clientId)).toEqual([])
  })
})
