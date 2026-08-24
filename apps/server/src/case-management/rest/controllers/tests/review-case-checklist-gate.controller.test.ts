import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseChecklistGateDecision } from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ReviewCaseChecklistGateController } from '@/case-management/rest/controllers/review-case-checklist-gate.controller'

describe('Review Case Checklist Gate Controller [PATCH /cases/:caseId/checklist-gate]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ReviewCaseChecklistGateController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('reviews a case checklist gate', async () => {
    const legalCase = await fixture.registerLegalCase()

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/checklist-gate`)
      .send({
        expectedVersion: legalCase.version,
        decision: CaseChecklistGateDecision.ApprovedWithException,
        decidedBy: fixture.authUser.id,
        remarks: 'CNIS será complementado por ofício já autorizado.',
      })
      .expect(200)

    expect(response.body.status).toBe('ready_for_legal_production')
    expect(response.body.version).toBe(legalCase.version + 1)
    expect(response.body.checklistGate.decision).toBe('approved_with_exception')
    expect(response.body.checklistGate.remarks).toBe(
      'CNIS será complementado por ofício já autorizado.',
    )
    expect(response.body.dossierGate.homologatedAt).toBeUndefined()
  })
})
