import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

import { GetLegalCaseByIntakeController } from '@/case-management/rest/controllers/get-legal-case-by-intake.controller'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'

describe('Get Legal Case By Intake Controller [GET /cases/by-intake/:intakeId]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(GetLegalCaseByIntakeController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects unauthenticated requests before reading the case', async () => {
    const intakeId = '00000000-0000-4000-8000-000000000101'

    const response = await request(fixture.app.getHttpServer()).get(
      `/cases/by-intake/${intakeId}`,
    )

    expect(response.status).toBe(401)
  })

  it('returns the case summary and its primary lawyer', async () => {
    const intakeId = '00000000-0000-4000-8000-000000000102'
    const caseId = '00000000-0000-4000-8000-000000000103'
    const openedAt = new Date('2026-09-08T12:00:00.000Z')

    await fixture.seedLegalCase({
      id: caseId,
      publicCode: 'CASO-20260908-0001',
      clientId: '00000000-0000-4000-8000-000000000104',
      intakeId,
      legalAreaId: '00000000-0000-4000-8000-000000000105',
      legalTopicId: '00000000-0000-4000-8000-000000000106',
      title: 'Revisão contratual',
      status: LegalCaseStatus.Documentation,
      openedAt,
    })
    await fixture.seedCaseMember({
      caseId,
      collaboratorId: fixture.collaboratorId,
      role: 'lead_lawyer',
      isPrimary: true,
      assignedAt: openedAt,
      assignedBy: fixture.collaboratorId,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/by-intake/${intakeId}`)
      .set('Authorization', fixture.authenticate())

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      caseId,
      intakeId,
      publicCode: 'CASO-20260908-0001',
      status: LegalCaseStatus.Documentation,
      legalAreaId: '00000000-0000-4000-8000-000000000105',
      primaryLawyerId: fixture.collaboratorId,
      openedAt: openedAt.toISOString(),
    })
  })

  it('returns an empty summary when the intake has no case', async () => {
    const intakeId = '00000000-0000-4000-8000-000000000107'

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/by-intake/${intakeId}`)
      .set('Authorization', fixture.authenticate())

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
  })
})
