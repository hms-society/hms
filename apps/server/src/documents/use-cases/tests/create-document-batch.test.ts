import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { documentBatchFileModel } from '@/documents/database/drizzle/models/document-batch-file-model'
import { clientModel, userModel } from '@/identity/database/drizzle/models'
import { CreateDocumentBatchUseCase } from '@hms/core/documents/use-cases/create-document-batch-use-case.js'
import { DocumentChannel } from '@hms/core/documents/domain/structures/document-channel.js'
import { DocumentsModule } from '@/documents/database/documents.module'

describe('Create Document Batch Use Case', () => {
  let fixture: RestFixture
  let useCase: CreateDocumentBatchUseCase
  let db: ReturnType<DrizzleClient['requireDatabase']>
  let testUserId: string
  let testClientId: string

  beforeAll(async () => {
    fixture = await RestFixture.register({ imports: [DocumentsModule] })
    useCase = fixture.get(CreateDocumentBatchUseCase)
    db = fixture.get(DrizzleClient).requireDatabase()
  })

  beforeEach(async () => {
    await fixture.resetDatabase()

    const [client] = await db
      .insert(clientModel)
      .values({
        type: 'natural',
        name: 'Cliente Teste UC',
        taxIdType: 'cpf',
        taxIdValue: '09876543210',
      })
      .returning()

    const [user] = await db
      .insert(userModel)
      .values({
        id: randomUUID(),
        email: 'usecase@hms.com.br',
        status: 'active',
      })
      .returning()

    testUserId = user.id
    testClientId = client.id
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('creates a batch with readable ID, correct status, and attached files', async () => {
    const batch = await useCase.execute({
      channel: DocumentChannel.InternalUpload,
      sender: 'admin@hms.com.br',
      createdBy: testUserId,
      clientId: testClientId,
      files: [
        {
          originalName: 'cnh.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          storagePath: 'internal/fake-path/cnh.pdf',
        },
        {
          originalName: 'comprovante.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 2048,
          storagePath: 'internal/fake-path/comprovante.jpg',
        },
      ],
    })

    expect(batch.id).toBeDefined()
    expect(batch.readableId).toMatch(/^LOTE-\d{8}-\d+$/)
    expect(batch.status).toBe('identified')
    expect(batch.inTriageBox).toBe(false)
    expect(batch.clientId).toBe(testClientId)

    const savedFiles = await db
      .select()
      .from(documentBatchFileModel)
      .where(eq(documentBatchFileModel.batchId, batch.id))

    expect(savedFiles).toHaveLength(2)
    expect(savedFiles.some((f) => f.originalName === 'cnh.pdf')).toBeTruthy()
  })

  it('increments the daily counter for readable IDs', async () => {
    const batch1 = await useCase.execute({
      channel: DocumentChannel.Whatsapp,
      sender: '5511999999999',
      clientId: testClientId,
      files: [],
    })

    const batch2 = await useCase.execute({
      channel: DocumentChannel.ClientPortal,
      sender: 'client@hms.com.br',
      clientId: testClientId,
      files: [],
    })

    const seq1 = parseInt(batch1.readableId.split('-')[2], 10)
    const seq2 = parseInt(batch2.readableId.split('-')[2], 10)

    expect(seq2).toBe(seq1 + 1)
  })
})
