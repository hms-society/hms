import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseTeamHistoryKind } from '@hms/core/case-management/domain/structures'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListCaseTeamHistoryController } from '@/case-management/rest/controllers/list-case-team-history.controller'
import { registerManagedCase } from './case-team-controller-test-helpers'

describe('List Case Team History Controller [GET /cases/:caseId/team/history]', () => {
  let fixture: CaseManagementModuleFixture
  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListCaseTeamHistoryController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns authorized history in the requested page', async () => {
    const { actor, legalCase, manager } = await registerManagedCase(fixture)
    await fixture.registerCaseTeamHistory({
      caseId: legalCase.id,
      membershipId: manager.id,
      collaboratorId: actor.collaboratorId,
      actorId: actor.collaboratorId,
      kind: CaseTeamHistoryKind.Added,
      occurredAt: new Date('2026-10-06T12:00:00.000Z'),
      teamVersion: 1,
      nextRole: 'manager',
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/team/history`)
      .query({ page: 1, pageSize: 10 })
      .expect(200)

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    })
    expect(response.body.items[0]).toMatchObject({
      caseId: legalCase.id,
      membershipId: manager.id,
      collaboratorId: actor.collaboratorId,
      actorId: actor.collaboratorId,
      kind: 'added',
      nextRole: 'manager',
    })
  })
})
