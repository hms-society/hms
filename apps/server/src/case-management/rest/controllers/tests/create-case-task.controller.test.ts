import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { CreateCaseTaskController } from '@/case-management/rest/controllers/create-case-task.controller'

describe('Create Case Task Controller [POST /cases/:caseId/tasks]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      CreateCaseTaskController,
      (builder) => builder,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('creates a task with a responsible collaborator from the case team', async () => {
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

    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/tasks`)
      .send({
        type: 'internal_task',
        title: 'Review the case response',
        description: 'Review the case response',
        plannedDate: '2099-01-15',
        plannedTime: '',
        assigneeIds: [collaborator.collaboratorId],
        reminders: [{ value: 3, unit: 'days' }],
      })
      .expect(201)

    expect(response.body).toMatchObject({
      caseId: legalCase.id,
      type: 'internal_task',
      description: 'Review the case response',
      status: 'to_do',
      createdById: collaborator.collaboratorId,
      assigneeIds: [collaborator.collaboratorId],
      reminders: [expect.objectContaining({ value: 3, unit: 'days' })],
      version: 1,
    })
    expect(await fixture.findCaseTask(response.body.id)).toMatchObject({
      id: response.body.id,
      caseId: legalCase.id,
      assigneeIds: [collaborator.collaboratorId],
    })
  })

  it('rejects a responsible collaborator outside the case team', async () => {
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

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/tasks`)
      .send({
        type: 'internal_task',
        title: 'Should not be created',
        description: 'Should not be created',
        plannedDate: '2099-01-15',
        assigneeIds: ['11111111-1111-4111-8111-111111111111'],
      })
      .expect(400)
  })

  it('rejects creation when the authenticated collaborator is not a case member', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/tasks`)
      .send({
        type: 'internal_task',
        title: 'Should not be created',
        description: 'Should not be created',
        plannedDate: '2099-01-15',
        assigneeIds: ['11111111-1111-4111-8111-111111111111'],
      })
      .expect(403)
  })

  it('deduplicates repeated responsible collaborator ids', async () => {
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

    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/tasks`)
      .send({
        type: 'internal_task',
        title: 'Tarefa com responsável repetido',
        description: 'IDs repetidos devem ser persistidos uma única vez',
        plannedDate: '2099-01-15',
        assigneeIds: [collaborator.collaboratorId, collaborator.collaboratorId],
      })
      .expect(201)

    expect(response.body.assigneeIds).toEqual([collaborator.collaboratorId])
  })

  it('rejects duplicate reminders before persistence', async () => {
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

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/tasks`)
      .send({
        type: 'internal_task',
        title: 'Lembretes duplicados',
        description: 'Não deve persistir lembretes duplicados',
        plannedDate: '2099-01-15',
        assigneeIds: [collaborator.collaboratorId],
        reminders: [
          { value: 3, unit: 'days' },
          { value: 3, unit: 'days' },
        ],
      })
      .expect(400)
  })
})
