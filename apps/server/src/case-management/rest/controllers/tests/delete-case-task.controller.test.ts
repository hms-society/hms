import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  CaseMemberRole,
  CaseTaskStatus,
} from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { DeleteCaseTaskController } from '@/case-management/rest/controllers/delete-case-task.controller'

describe('Delete Case Task Controller [DELETE /cases/:caseId/tasks/:caseTaskId]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      DeleteCaseTaskController,
      (builder) => builder,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('soft deletes the task and hides it from the list', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const task = await fixture.registerCaseTask(legalCase.id)
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.Collaborator,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .delete(`/cases/${legalCase.id}/tasks/${task.id}`)
      .send({ version: 1 })
      .expect(200)

    expect(response.body).toMatchObject({ id: task.id, version: 2 })
    expect(response.body.deletedAt).toBeTruthy()
    expect(await fixture.findCaseTask(task.id)).toBeUndefined()
  })

  it('rejects deleting a completed task', async () => {
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
        role: CaseMemberRole.Collaborator,
      },
    ])
    const task = await fixture.registerCaseTask(legalCase.id, {
      createdById: collaborator.collaboratorId,
      status: CaseTaskStatus.Completed,
    })

    await request(fixture.app.getHttpServer())
      .delete(`/cases/${legalCase.id}/tasks/${task.id}`)
      .send({ version: task.version })
      .expect(400)

    expect(await fixture.findCaseTask(task.id)).toMatchObject({
      id: task.id,
      status: CaseTaskStatus.Completed,
      version: task.version,
    })
  })
})
