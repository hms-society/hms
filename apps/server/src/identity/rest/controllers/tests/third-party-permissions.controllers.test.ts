import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { DeactivateThirdPartyController } from '@/identity/rest/controllers/deactivate-third-party.controller'
import { GrantThirdPartyPermissionController } from '@/identity/rest/controllers/grant-third-party-permission.controller'
import { ListThirdPartyPermissionsController } from '@/identity/rest/controllers/list-third-party-permissions.controller'
import { RegisterThirdPartyController } from '@/identity/rest/controllers/register-third-party.controller'
import { RevokeThirdPartyPermissionController } from '@/identity/rest/controllers/revoke-third-party-permission.controller'

describe('Third-party permission matrix', () => {
  let fixture: IdentityModuleFixture
  let authorization: string
  let thirdPartyId: string

  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register([
      RegisterThirdPartyController,
      GrantThirdPartyPermissionController,
      RevokeThirdPartyPermissionController,
      ListThirdPartyPermissionsController,
      DeactivateThirdPartyController,
    ])
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
    const { user, collaborator } = await fixture.registerAdmin()
    authorization = fixture.authenticateAs(user)

    const response = await request(fixture.app.getHttpServer())
      .post('/third-parties')
      .set('Authorization', authorization)
      .send({
        type: 'union',
        legalName: 'Sindicato de teste',
        taxId: 'REGISTRO-TESTE-001',
        taxIdType: 'official_registration',
        internalResponsibleId: collaborator.id,
        relationshipTypes: ['demand_origin'],
      })
      .expect(201)

    thirdPartyId = response.body.id
  })

  afterAll(async () => {
    if (fixture) await fixture.close()
  })

  it('grants and lists view permissions', async () => {
    await request(fixture.app.getHttpServer())
      .patch(`/third-parties/${thirdPartyId}/permissions/view_case_status`)
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          thirdPartyId,
          permission: 'view_case_status',
          active: true,
        })
      })

    await request(fixture.app.getHttpServer())
      .get(`/third-parties/${thirdPartyId}/permissions`)
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1)
        expect(body[0]).toMatchObject({ permission: 'view_case_status', active: true })
      })
  })

  it('revokes a permission', async () => {
    await request(fixture.app.getHttpServer())
      .patch(`/third-parties/${thirdPartyId}/permissions/view_intake_status`)
      .set('Authorization', authorization)
      .expect(200)

    await request(fixture.app.getHttpServer())
      .delete(`/third-parties/${thirdPartyId}/permissions/view_intake_status`)
      .set('Authorization', authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          thirdPartyId,
          permission: 'view_intake_status',
          active: false,
        })
      })
  })

  it('rejects unknown permissions', async () => {
    await request(fixture.app.getHttpServer())
      .patch(`/third-parties/${thirdPartyId}/permissions/upload_documents`)
      .set('Authorization', authorization)
      .expect(400)
  })
})
