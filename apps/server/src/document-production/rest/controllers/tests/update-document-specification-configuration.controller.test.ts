import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'

import { UpdateDocumentSpecificationConfigurationController } from '@/document-production/rest/controllers'

const templateContent: DocumentTemplateContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Conteúdo de teste' }],
    },
  ],
}

function createSpec(
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

describe('Update Document Specification Configuration Controller [PATCH .../configuration]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      UpdateDocumentSpecificationConfigurationController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('allows enabling a specification before template content is added', async () => {
    const [specification] = await fixture.specificationsRepository.addMany([
      createSpec({ content: { type: 'doc', content: [] }, status: 'unavailable' }),
    ])
    const admin = await fixture.registerAdmin()
    if (!specification) throw new Error('Specification was not created')

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-specifications/${specification.id}/configuration`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        name: specification.name,
        description: specification.description,
        status: 'available',
        application: specification.application,
      })
      .expect(200)

    expect(response.body).toMatchObject({
      status: 'available',
      content: { type: 'doc', content: [] },
    })
  })

  it('updates configuration without changing template', async () => {
    const [specification] = await fixture.specificationsRepository.addMany([createSpec()])
    const admin = await fixture.registerAdmin()
    if (!specification) throw new Error('Specification was not created')

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-specifications/${specification.id}/configuration`)
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        name: 'Modelo atualizado',
        description: 'Descrição atualizada',
        status: 'unavailable',
        application: { scope: 'global', moment: 'formalization' },
      })
      .expect(200)

    expect(response.body).toMatchObject({
      name: 'Modelo atualizado',
      application: { scope: 'global', moment: 'formalization' },
      content: templateContent,
    })
  })

  it('rejects a non-administrator', async () => {
    const user = await fixture.registerUser()

    await request(fixture.app.getHttpServer())
      .patch(
        '/document-specifications/00000000-0000-0000-0000-000000000000/configuration',
      )
      .set('Authorization', fixture.authenticateAs(user))
      .send({
        name: 'Modelo',
        description: 'Descrição',
        status: 'unavailable',
        application: { scope: 'global', moment: 'consultation' },
      })
      .expect(403)
  })
})
