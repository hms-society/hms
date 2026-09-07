import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { AddCaseChecklistComplementaryItemController } from '@/case-management/rest/controllers/add-case-checklist-complementary-item.controller'

describe('Add Case Checklist Complementary Item Controller [POST /cases/:caseId/checklist/items]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      AddCaseChecklistComplementaryItemController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('adds an optional item to an assigned case checklist', async () => {
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
      .post(`/cases/${legalCase.id}/checklist/items`)
      .send({
        templateItemKey: 'complementary-contract',
        title: 'Contrato complementar',
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        caseId: legalCase.id,
        templateItemKey: 'complementary-contract',
        title: 'Contrato complementar',
        isRequired: false,
        status: 'pending',
      }),
    )
  })
})
