import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListCaseTasksController } from '@/case-management/rest/controllers/list-case-tasks.controller'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

describe('List Case Tasks Controller [GET /cases/:caseId/tasks]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListCaseTasksController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('lists only active tasks for the requested case', async () => {
    const collaborator = await fixture.registerCollaborator()
    const firstCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const secondCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const firstTask = await fixture.registerCaseTask(firstCase.id)
    await fixture.registerCaseTask(secondCase.id)
    await fixture.registerCaseMembers([
      {
        caseId: firstCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.Collaborator,
        isPrimary: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${firstCase.id}/tasks`)
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({ id: firstTask.id, caseId: firstCase.id }),
    ])
  })
})
