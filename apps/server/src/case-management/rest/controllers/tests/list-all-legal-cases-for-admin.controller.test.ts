import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListAllLegalCasesForAdminController } from '@/case-management/rest/controllers/list-all-legal-cases-for-admin.controller'

describe('List All Legal Cases For Admin Controller [GET /cases/admin/list]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ListAllLegalCasesForAdminController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('returns a paginated operational allowlist for an active Admin', async () => {
    const admin = await fixture.registerCollaborator({ profile: 'admin' })
    const activeCase = await fixture.registerLegalCase({
      clientId: admin.clientId,
      legalAreaId: admin.legalAreaId,
      legalTopicId: admin.legalTopicId,
    })
    const closedCase = await fixture.registerLegalCase({
      clientId: admin.clientId,
      legalAreaId: admin.legalAreaId,
      legalTopicId: admin.legalTopicId,
      lifecycleStatus: 'closed',
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/cases/admin/list?page=1&pageSize=1&search=Cliente%20HMS')
      .expect(200)
    const secondPage = await request(fixture.app.getHttpServer())
      .get('/cases/admin/list?page=2&pageSize=1&search=Cliente%20HMS')
      .expect(200)

    expect(response.body).toMatchObject({ page: 1, pageSize: 1, total: 2, totalPages: 2 })
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toMatchObject({
      clientName: 'Cliente HMS Teste',
      legalArea: admin.legalAreaName,
      legalTopic: admin.legalTopicName,
      managerNames: [],
    })
    expect(Object.keys(response.body.items[0]).toSorted()).toEqual(
      [
        'id',
        'publicCode',
        'title',
        'clientName',
        'legalArea',
        'legalTopic',
        'status',
        'managerNames',
        'updatedAt',
      ].toSorted(),
    )
    expect(response.body.items[0]).not.toHaveProperty('description')
    expect(response.body.items[0]).not.toHaveProperty('intakeId')
    expect(response.body.items[0]).not.toHaveProperty('checklistGate')
    expect(response.body.items[0]).not.toHaveProperty('dossierGate')
    const listedCases = [...response.body.items, ...secondPage.body.items]
    expect(listedCases.map((item: { id: string }) => item.id).toSorted()).toEqual(
      [activeCase.id, closedCase.id].toSorted(),
    )
    expect(listedCases.map((item: { status: string }) => item.status)).toContain(
      LegalCaseStatus.Closed,
    )
  })

  it('rejects non-Admin collaborators before listing Cases', async () => {
    await fixture.registerCollaborator({ profile: 'lawyer' })
    await fixture.registerLegalCases(1)

    await request(fixture.app.getHttpServer()).get('/cases/admin/list').expect(403)
  })

  it('rejects malformed page and page-size parameters', async () => {
    await fixture.registerCollaborator({ profile: 'admin' })

    await request(fixture.app.getHttpServer())
      .get('/cases/admin/list?page=invalid&pageSize=51')
      .expect(400)
  })

  it('returns an empty page when an Admin search has no matching client or case', async () => {
    await fixture.registerCollaborator({ profile: 'admin' })
    await fixture.registerLegalCases(1)

    const response = await request(fixture.app.getHttpServer())
      .get('/cases/admin/list?page=1&pageSize=10&search=no-such-case-or-client')
      .expect(200)

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
      items: [],
    })
  })
})
