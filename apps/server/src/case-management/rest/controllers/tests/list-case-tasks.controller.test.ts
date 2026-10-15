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
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${firstCase.id}/tasks`)
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({ id: firstTask.id, caseId: firstCase.id }),
    ])
  })
  it.each([
    'documentation',
    'closed',
  ] as const)('allows an Admin without membership to read tasks for a %s Case', async (status) => {
    const admin = await fixture.registerCollaborator({ profile: 'admin' })
    const legalCase = await fixture.registerLegalCase({
      clientId: admin.clientId,
      legalAreaId: admin.legalAreaId,
      legalTopicId: admin.legalTopicId,
      status,
    })
    const task = await fixture.registerCaseTask(legalCase.id)
    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/tasks`)
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({ id: task.id, caseId: legalCase.id }),
    ])
    expect(await fixture.findCaseMembers(legalCase.id)).toEqual([])
    expect(await fixture.findCaseTask(task.id)).toMatchObject({
      id: task.id,
      version: task.version,
    })
  })

  it.each([
    'lawyer',
    'attendant',
  ] as const)('denies a %s without membership before returning tasks', async (profile) => {
    const actor = await fixture.registerCollaborator({ profile })
    const legalCase = await fixture.registerLegalCase({
      clientId: actor.clientId,
      legalAreaId: actor.legalAreaId,
      legalTopicId: actor.legalTopicId,
    })
    const task = await fixture.registerCaseTask(legalCase.id)
    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/tasks`)
      .expect(403)
    expect(response.body).not.toHaveProperty('items')
    expect(JSON.stringify(response.body)).not.toContain(task.id)
    expect(await fixture.findCaseTask(task.id)).toMatchObject({
      id: task.id,
      version: task.version,
    })
  })
})
