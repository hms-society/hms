import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  CaseMemberRole,
  CaseTaskStatus,
} from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { UpdateCaseTaskController } from '@/case-management/rest/controllers/update-case-task.controller'

describe('Update Case Task Controller [PATCH /cases/:caseId/tasks/:caseTaskId]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      UpdateCaseTaskController,
      (builder) => builder,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('updates the status and increments the task version', async () => {
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
        role: CaseMemberRole.Lawyer,
        isPrimary: true,
      },
    ])
    const task = await fixture.registerCaseTask(legalCase.id, {
      createdById: collaborator.collaboratorId,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/tasks/${task.id}`)
      .send({
        version: 1,
        status: 'in_progress',
        description: 'Review the response and supporting documents',
        assigneeIds: [collaborator.collaboratorId],
      })
      .expect(200)

    expect(response.body).toMatchObject({
      id: task.id,
      status: 'in_progress',
      description: 'Review the response and supporting documents',
      version: 2,
    })
    expect(await fixture.findCaseTask(task.id)).toMatchObject({
      status: 'in_progress',
      version: 2,
    })
  })

  it('rejects editing a completed task and preserves its data', async () => {
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
        role: CaseMemberRole.Lawyer,
        isPrimary: true,
      },
    ])
    const task = await fixture.registerCaseTask(legalCase.id, {
      createdById: collaborator.collaboratorId,
      status: CaseTaskStatus.Completed,
    })

    await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/tasks/${task.id}`)
      .send({
        version: task.version,
        description: 'Tentativa de alteração',
      })
      .expect(400)

    expect(await fixture.findCaseTask(task.id)).toMatchObject({
      description: task.description,
      status: CaseTaskStatus.Completed,
      version: task.version,
    })
  })

  it('rejects updating a task when the authenticated collaborator is not a case member', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const task = await fixture.registerCaseTask(legalCase.id, {
      createdById: collaborator.collaboratorId,
    })

    await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/tasks/${task.id}`)
      .send({ version: task.version, description: 'Alteração indevida' })
      .expect(403)

    expect(await fixture.findCaseTask(task.id)).toMatchObject({
      description: task.description,
      version: task.version,
    })
  })
})
