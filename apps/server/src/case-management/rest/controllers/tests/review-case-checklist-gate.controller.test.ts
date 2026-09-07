import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import {
  CaseChecklistGateDecision,
  CaseMemberRole,
} from '@hms/core/case-management/domain/structures'

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
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.LeadLawyer,
        isPrimary: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/checklist-gate`)
      .send({
        decision: CaseChecklistGateDecision.ApprovedWithException,
        remarks: 'CNIS será complementado por ofício já autorizado.',
      })
      .expect(200)

    expect(response.body.status).toBe('ready_for_legal_production')
    expect(response.body.checklistGate.decision).toBe('approved_with_exception')
    expect(response.body.checklistGate.remarks).toBe(
      'CNIS será complementado por ofício já autorizado.',
    )
    expect(response.body.checklistGate.decidedBy).toBe(collaborator.collaboratorId)
    expect(response.body.dossierGate.homologatedAt).toBeUndefined()
  })

  it('rejects an invalid case id before querying the repository', async () => {
    const collaborator = await fixture.registerCollaborator()
    await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch('/cases/not-a-uuid/checklist-gate')
      .send({
        decision: CaseChecklistGateDecision.Approved,
      })
      .expect(400)

    expect(response.body.statusCode).toBe(400)
  })

  it('rejects full approval until mandatory checklist items can be verified server-side', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.LeadLawyer,
        isPrimary: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/checklist-gate`)
      .send({
        decision: CaseChecklistGateDecision.Approved,
      })
      .expect(409)

    expect(response.body.message).toBe(
      'A aprovação integral do checklist exige validação server-side dos itens obrigatórios.',
    )
    expect(response.body.statusCode).toBe(409)
  })

  it('rejects approval with exception without remarks', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.LeadLawyer,
        isPrimary: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/checklist-gate`)
      .send({
        decision: CaseChecklistGateDecision.ApprovedWithException,
      })
      .expect(409)

    expect(response.body.message).toBe(
      'Informe as ressalvas para aprovar o checklist com exceção.',
    )
    expect(response.body.statusCode).toBe(409)
  })
})
