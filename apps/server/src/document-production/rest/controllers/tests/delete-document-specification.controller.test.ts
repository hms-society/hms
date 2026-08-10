import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { DeleteDocumentSpecificationController } from '@/document-production/rest/controllers'

const templateContent: DocumentTemplateContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
}

function createSpecification(): DocumentSpecificationCreation {
  return {
    name: 'Modelo removível',
    description: 'Descrição',
    content: templateContent,
    variables: [],
    application: { scope: 'global', moment: 'consultation' },
    isRequired: false,
    status: 'available',
  }
}

describe('Delete Document Specification Controller [DELETE /document-specifications/:id]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      DeleteDocumentSpecificationController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('deletes an existing specification', async () => {
    const [specification] = await fixture.specificationsRepository.addMany([
      createSpecification(),
    ])
    const admin = await fixture.registerAdmin()
    if (!specification) throw new Error('Specification was not created')

    await request(fixture.app.getHttpServer())
      .delete(`/document-specifications/${specification.id}`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(204)

    await expect(
      fixture.specificationsRepository.findById(specification.id),
    ).resolves.toBe(undefined)
  })

  it('returns not found for an unknown specification', async () => {
    const admin = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .delete('/document-specifications/00000000-0000-0000-0000-000000000000')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(404)
  })
})
