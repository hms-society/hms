import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'

import { SharedModule } from '@/shared/shared.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'

describe('ListClientDocumentBatchController', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SharedModule, DocumentsModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /document-batches/clients/:clientId', async () => {
    const clientId = '123e4567-e89b-12d3-a456-426614174000'

    const response = await request(app.getHttpServer()).get(
      `/document-batches/clients/${clientId}`,
    )

    expect(response.status).not.toBe(404)
    expect(response.body).toBeDefined()
  })
})
