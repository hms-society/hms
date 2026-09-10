import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { CreateLegalCaseController } from '@/case-management/rest/controllers/create-legal-case.controller'

describe('CreateLegalCaseController [POST /cases]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(CreateLegalCaseController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('allows an admin or lawyer to create a new legal case', async () => {
    const collaborator = await fixture.registerCollaborator()
    const intake = await fixture.registerIntake(collaborator.clientId)

    const payload = {
      title: 'Aposentadoria Teste',
      intakeId: intake.id,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
      description: 'Descrição inicial do caso',
      team: [],
    }

    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(201)

    expect(response.body).toMatchObject({
      title: 'Aposentadoria Teste',
      intakeId: intake.id,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
      description: 'Descrição inicial do caso',
      status: 'documentation',
    })

    expect(response.body.publicCode).toBeDefined()
    expect(response.body.id).toBeDefined()
  })

  it('rejects case creation for attendant profile', async () => {
    const collaborator = await fixture.registerCollaborator({ profile: 'attendant' })
    const intake = await fixture.registerIntake(collaborator.clientId)

    const payload = {
      title: 'Aposentadoria Teste',
      intakeId: intake.id,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
      description: 'Descrição inicial do caso',
      team: [],
    }

    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(403)

    expect(response.body.message).toEqual('You do not have permission to create cases.')
  })

  it('rejects case creation if missing mandatory fields', async () => {
    const collaborator = await fixture.registerCollaborator()
    // No title provided
    const payload = {
      intakeId: 'any-id',
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
      team: [],
    }

    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(400)

    expect(response.body.message).toContain('Validation failed')
  })
})
