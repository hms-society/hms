import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { GetDocumentSpecificationController } from '@/document-production/rest/controllers'

const templateContent: DocumentTemplateContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Conteúdo de teste' }],
    },
  ],
}

function createSpecification(
  overrides: Partial<DocumentSpecificationCreation> = {},
): DocumentSpecificationCreation {
  return {
    name: 'Modelo de teste',
    description: 'Descrição de teste',
    content: templateContent,
    variables: [],
    application: { scope: 'global', moment: 'consultation' },
    status: 'unavailable',
    ...overrides,
  }
}

describe('Get Document Specification Controller [GET /document-specifications/:id]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      GetDocumentSpecificationController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests and invalid identifiers', async () => {
    await request(fixture.app.getHttpServer())
      .get('/document-specifications/00000000-0000-0000-0000-000000000000')
      .expect(401)

    const admin = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .get('/document-specifications/not-a-uuid')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(400)
  })

  it('returns the persisted specification projection', async () => {
    const [specification] = await fixture.specificationsRepository.addMany([
      createSpecification(),
    ])
    const admin = await fixture.registerAdmin()
    if (!specification) throw new Error('Specification was not created')

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-specifications/${specification.id}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)

    expect(response.body).toMatchObject({
      documentSpecificationId: specification.id,
      name: 'Modelo de teste',
      content: templateContent,
      variables: [],
    })
    expect(response.body.updatedAt).toEqual(expect.any(String))
    expect(Number.isNaN(Date.parse(response.body.updatedAt))).toBe(false)
    expect(response.body).not.toHaveProperty('userId')
  })

  it('returns 404 for an unknown specification', async () => {
    const admin = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .get('/document-specifications/00000000-0000-0000-0000-000000000000')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(404)
  })
})
