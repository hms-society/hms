import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { HomologateCaseDossierController } from '@/case-management/rest/controllers/homologate-case-dossier.controller'

describe('Homologate Case Dossier Controller [PATCH /cases/:caseId/dossier-gate/homologation]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(HomologateCaseDossierController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('rejects invalid case identifiers', async () => {
    const response = await request(fixture.app.getHttpServer())
      .patch('/cases/not-a-uuid/dossier-gate/homologation')
      .send({})
      .expect(400)

    expect(response.body.statusCode).toBe(400)
  })
})
