import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ReplaceChecklistTemplateController } from '@/case-management/rest/controllers/replace-checklist-template.controller'

describe('Replace Checklist Template Controller [PUT /cases/checklist-templates]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ReplaceChecklistTemplateController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('creates a template and replaces its items', async () => {
    const collaborator = await fixture.registerCollaborator({ profile: 'admin' })
    const response = await request(fixture.app.getHttpServer())
      .put('/cases/checklist-templates')
      .send({
        legalAreaId: collaborator.legalAreaId,
        name: 'Documentos do caso',
        isActive: true,
        items: [
          {
            title: 'Procuração',
            documentTypes: ['PDF'],
            isRequired: true,
            position: 0,
          },
        ],
      })
      .expect(200)
    expect(response.body).toMatchObject({
      legalAreaId: collaborator.legalAreaId,
      name: 'Documentos do caso',
      items: [
        expect.objectContaining({
          title: 'Procuração',
          documentTypes: ['PDF'],
          isRequired: true,
        }),
      ],
    })
    expect(await fixture.findChecklistTemplate(collaborator.legalAreaId)).toMatchObject({
      id: response.body.id,
      name: 'Documentos do caso',
    })
  })
})
