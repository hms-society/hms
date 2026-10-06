import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DrizzleDocumentsRepository } from '@/document-production/database/drizzle/repositories'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { UpdateDocumentAccessClassificationController } from '@/document-production/rest/controllers/update-document-access-classification.controller'

describe('Update Document Access Classification Controller [PATCH /documents/:id/access-classification]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      UpdateDocumentAccessClassificationController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('updates classification through a real document package and database', async () => {
    const admin = await fixture.registerAdmin()
    const { areas, topics } = await fixture.seedCatalog()
    const { documents } = await fixture.specificationsSeeder.run({
      legalAreas: areas,
      legalTopics: topics,
      consultationId: randomUUID(),
    })
    const document = documents[0]
    const response = await request(fixture.app.getHttpServer())
      .patch(`/documents/${document.id}/access-classification`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({ classification: 'CONFIDENCIAL' })
      .expect(200)
    expect(response.body).toEqual({ success: true })
    expect(
      await fixture.app.get(DrizzleDocumentsRepository).findById(document.id),
    ).toMatchObject({ classificacaoAcesso: 'CONFIDENCIAL' })
  })

  it('returns not found for an unknown document', async () => {
    const admin = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .patch(`/documents/${randomUUID()}/access-classification`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({ classification: 'RESTRITO' })
      .expect(404)
  })
})
