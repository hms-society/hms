import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { UpdateDocumentSpecificationTemplateController } from '@/document-production/rest/controllers'

const templateContent: DocumentTemplateContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Conteúdo de teste' as any }],
    },
  ],
} as unknown as DocumentTemplateContent

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

describe('Update Document Specification Template Controller [PATCH .../template]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      UpdateDocumentSpecificationTemplateController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('updates content and variables without changing configuration', async () => {
    const [specification] = await fixture.specificationsRepository.addMany([
      createSpecification(),
    ])
    const admin = await fixture.registerAdmin()
    if (!specification) throw new Error('Specification was not created')

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-specifications/${specification.id}/template`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        content: templateContent,
        variables: [
          {
            label: 'Nome do contrato',
            technicalName: 'nome_contrato',
            description: 'Nome usado no contrato',
          },
        ],
      })
      .expect(200)

    expect(response.body).toMatchObject({
      documentSpecificationId: specification.id,
      application: specification.application,
      status: specification.status,
      variables: [{ technicalName: 'nome_contrato' }],
      content: templateContent,
    })
  })

  it('rejects an unknown specification and invalid body', async () => {
    const admin = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .patch('/document-specifications/00000000-0000-0000-0000-000000000000/template')
      .set('Authorization', fixture.authenticateAs(admin))
      .send({ content: { type: 'invalid' }, variables: [] })
      .expect(400)

    const missingResponse = await request(fixture.app.getHttpServer())
      .patch('/document-specifications/00000000-0000-0000-0000-000000000000/template')
      .set('Authorization', fixture.authenticateAs(admin))
      .send({ content: templateContent, variables: [] })
    expect(missingResponse.status).toBe(404)
  })
})
