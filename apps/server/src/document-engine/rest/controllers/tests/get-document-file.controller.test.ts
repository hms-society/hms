import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { Test, type TestingModule } from '@nestjs/testing'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'

import { SharedModule } from '@/shared/shared.module'
import { DocumentsModule } from '@/document-engine/database/documents.module'

describe('GetDocumentFileController', () => {
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

  it('GET /documents/files/:fileId', async () => {
    const fileId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

    const response = await request(app.getHttpServer()).get(`/documents/files/${fileId}`)

    expect(response.status).not.toBe(404)
    expect(response.body).toBeDefined()
  })
})
