import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListChecklistTemplatesController } from '@/case-management/rest/controllers/list-checklist-templates.controller'

describe('List Checklist Templates Controller [GET /cases/checklist-templates]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListChecklistTemplatesController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns persisted templates and their items', async () => {
    const collaborator = await fixture.registerCollaborator({ profile: 'admin' })
    const template = await fixture.registerChecklistTemplate(collaborator.legalAreaId)
    const response = await request(fixture.app.getHttpServer())
      .get('/cases/checklist-templates')
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({
        id: template.id,
        legalAreaId: collaborator.legalAreaId,
        name: 'Documentos iniciais',
        items: [],
      }),
    ])
  })
})
