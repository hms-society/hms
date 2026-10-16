import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { HomologateCaseDossierController } from '@/case-management/rest/controllers/homologate-case-dossier.controller'

describe('Homologate Case Dossier Controller [PATCH /cases/:caseId/dossier-gate/homologation]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(HomologateCaseDossierController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rejects invalid case identifiers', async () => {
    await fixture.registerCollaborator()
    const response = await request(fixture.app.getHttpServer())
      .patch('/cases/not-a-uuid/dossier-gate/homologation')
      .send({})
      .expect(400)

    expect(response.body.statusCode).toBe(400)
  })

  it('homologates a case after its required checklist has been validated', async () => {
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
        role: 'manager',
      },
    ])

    const [checklistItem] = await fixture.registerCaseChecklistItems([
      {
        caseId: legalCase.id,
        templateItemKey: 'required-contract-document',
        title: 'Contrato assinado',
        isRequired: true,
      },
    ])
    if (!checklistItem) throw new Error('Required checklist fixture was not created')

    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const validatedItem = await checklistItems.markAsValidatedByDocument({
      caseId: legalCase.id,
      checklistItemId: checklistItem.id,
      documentFileId: randomUUID(),
      documentFileName: 'contrato-assinado.pdf',
      validatedBy: collaborator.collaboratorId,
    })
    expect(validatedItem?.status).toBe(CaseChecklistItemStatus.Validated)

    const legalCases = fixture.app.get<LegalCasesRepository>(
      CASE_MANAGEMENT_REPOSITORIES.legalCases,
    )
    await legalCases.reviewChecklistGate({
      caseId: legalCase.id,
      checklistGate: {
        decision: CaseChecklistGateDecision.Approved,
        decidedBy: collaborator.collaboratorId,
      },
      expectedStatus: LegalCaseStatus.Documentation,
      status: LegalCaseStatus.ReadyForLegalProduction,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/dossier-gate/homologation`)
      .expect(200)

    expect(response.body).toMatchObject({
      id: legalCase.id,
      status: LegalCaseStatus.LegalProduction,
      dossierGate: {
        homologatedBy: collaborator.collaboratorId,
      },
    })
    expect(response.body.dossierGate.homologatedAt).toBeDefined()
  })
})
