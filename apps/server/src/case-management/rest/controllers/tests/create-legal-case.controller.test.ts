import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { CreateLegalCaseController } from '@/case-management/rest/controllers/create-legal-case.controller'

describe('Create Legal Case Controller [POST /cases]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(CreateLegalCaseController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('creates an explicit eligible initial Manager atomically with history and supports an idempotent retry', async () => {
    const collaborator = await fixture.registerCollaborator()
    const intake = await fixture.registerIntake(collaborator.clientId)

    const payload = {
      title: 'Aposentadoria Teste',
      intakeId: intake.id,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
      description: 'Descrição inicial do caso',
      team: [],
      initialManagerCollaboratorId: collaborator.collaboratorId,
      operationId: '00000000-0000-4000-8000-000000000401',
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
      teamVersion: 1,
    })

    expect(response.body.publicCode).toBeDefined()
    expect(response.body.id).toBeDefined()
    const memberships = await fixture.findCaseMembers(response.body.id)
    expect(memberships).toMatchObject([
      {
        collaboratorId: collaborator.collaboratorId,
        role: 'manager',
        archivedLegacy: false,
      },
    ])
    const history = await fixture.listCaseTeamHistory(response.body.id)
    expect(history.total).toBe(1)
    expect(history.items[0]).toMatchObject({
      actorId: collaborator.collaboratorId,
      collaboratorId: collaborator.collaboratorId,
      kind: 'added',
      nextRole: 'manager',
    })

    const retry = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(201)
    expect(retry.body.id).toBe(response.body.id)
    expect(
      await fixture.listCaseTeamHistory(response.body.id).then((result) => result.total),
    ).toBe(1)
  })

  it('returns a conflict for the same Intake with a new operation key and preserves the original Case', async () => {
    const creator = await fixture.registerCollaborator()
    const intake = await fixture.registerIntake(creator.clientId)
    const payload = {
      title: 'One Case per Intake',
      intakeId: intake.id,
      legalAreaId: creator.legalAreaId,
      legalTopicId: creator.legalTopicId,
      team: [],
      initialManagerCollaboratorId: creator.collaboratorId,
      operationId: randomUUID(),
    }
    const original = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(201)
    const conflict = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send({ ...payload, operationId: randomUUID() })
      .expect(409)
    expect(conflict.body.message).toBe(
      'O Intake já possui Caso ou a equipe inicial conflita com um vínculo existente.',
    )
    expect(await fixture.findCasesByIntakeId(intake.id)).toEqual([
      { id: original.body.id },
    ])
    expect(
      await fixture.listCaseTeamHistory(original.body.id).then(({ total }) => total),
    ).toBe(1)
  })

  it.each([
    'same payload',
    'different Intake',
  ] as const)('handles concurrent requests with the same operation key (%s) without partial writes', async (scenario) => {
    const creator = await fixture.registerCollaborator()
    const firstIntake = await fixture.registerIntake(creator.clientId)
    const secondIntake =
      scenario === 'same payload'
        ? firstIntake
        : await fixture.registerIntake(creator.clientId)
    const firstPayload = {
      title: 'Concurrent opening',
      intakeId: firstIntake.id,
      legalAreaId: creator.legalAreaId,
      legalTopicId: creator.legalTopicId,
      team: [],
      initialManagerCollaboratorId: creator.collaboratorId,
      operationId: randomUUID(),
    }
    const payloads = [firstPayload, { ...firstPayload, intakeId: secondIntake.id }]
    const responses = await Promise.all(
      payloads.map((payload) =>
        request(fixture.app.getHttpServer()).post('/cases').send(payload),
      ),
    )
    expect(responses.map(({ status }) => status).sort()).toEqual(
      scenario === 'same payload' ? [201, 201] : [201, 409],
    )
    const winnerIndex = responses.findIndex(({ status }) => status === 201)
    const winner = responses[winnerIndex]
    expect(winner).toBeDefined()
    const winnerPayload = payloads[winnerIndex]
    if (!winner || !winnerPayload) throw new Error('No opening winner')
    expect(await fixture.findCasesByIntakeId(winnerPayload.intakeId)).toEqual([
      { id: winner.body.id },
    ])
    expect(await fixture.findCaseMembers(winner.body.id)).toHaveLength(1)
    expect((await fixture.listCaseTeamHistory(winner.body.id)).total).toBe(1)
    const retry = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(winnerPayload)
      .expect(201)
    expect(retry.body.id).toBe(winner.body.id)
    if (scenario === 'same payload') {
      expect(responses[0]?.body.id).toBe(responses[1]?.body.id)
    } else {
      const loserIndex = winnerIndex === 0 ? 1 : 0
      const loserPayload = payloads[loserIndex]
      if (!loserPayload) throw new Error('No conflicting opening payload')
      expect(responses[loserIndex]?.body.message).toBe(
        'A chave da operação já foi usada com outro conteúdo.',
      )
      expect(await fixture.findCasesByIntakeId(loserPayload.intakeId)).toEqual([])
    }
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
      initialManagerCollaboratorId: '00000000-0000-4000-8000-000000000402',
      operationId: '00000000-0000-4000-8000-000000000403',
    }

    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(403)

    expect(response.body.message).toEqual('Abertura de Caso não autorizada.')
  })

  it('rejects case creation if missing mandatory fields', async () => {
    const collaborator = await fixture.registerCollaborator()
    const payload = {
      intakeId: 'any-id',
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
      team: [],
      operationId: '00000000-0000-4000-8000-000000000404',
    }

    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send(payload)
      .expect(400)

    expect(response.body.message).toContain('Validation failed')
  })
  it('assigns only the explicitly chosen Manager when the creator also owns the Intake', async () => {
    const creator = await fixture.registerCollaborator()
    const manager = await fixture.registerAdditionalCollaborator()
    const intake = await fixture.registerIntake(creator.clientId)
    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send({
        title: 'Explicit Manager',
        intakeId: intake.id,
        legalAreaId: creator.legalAreaId,
        legalTopicId: creator.legalTopicId,
        team: [],
        initialManagerCollaboratorId: manager.collaboratorId,
        operationId: randomUUID(),
      })
      .expect(201)
    const members = await fixture.findCaseMembers(response.body.id)
    expect(members).toHaveLength(1)
    expect(members[0]).toMatchObject({
      collaboratorId: manager.collaboratorId,
      role: 'manager',
    })
    expect(
      members.some((member) => member.collaboratorId === creator.collaboratorId),
    ).toBe(false)
    const history = await fixture.listCaseTeamHistory(response.body.id)
    expect(history.total).toBe(1)
    expect(history.items[0]).toMatchObject({
      actorId: creator.collaboratorId,
      collaboratorId: manager.collaboratorId,
      nextRole: 'manager',
    })
  })

  it.each([
    'inactive',
    'wrong profile',
  ] as const)('rejects an ineligible chosen Manager (%s) without creating a Case', async (scenario) => {
    const creator = await fixture.registerCollaborator()
    const manager = await fixture.registerAdditionalCollaborator({
      profile: scenario === 'wrong profile' ? 'paralegal' : 'lawyer',
    })
    const intake = await fixture.registerIntake(creator.clientId)
    if (scenario === 'inactive') {
      const collaborators = fixture.app.get<CollaboratorsRepository>(
        IDENTITY_REPOSITORIES.collaborators,
      )
      const candidate = await collaborators.findById(manager.collaboratorId)
      expect(candidate).toBeDefined()
      await fixture.app
        .get<UsersRepository>(IDENTITY_REPOSITORIES.users)
        .updateStatus(candidate?.userId ?? '', 'disabled')
    }
    const response = await request(fixture.app.getHttpServer())
      .post('/cases')
      .send({
        title: 'Invalid Manager',
        intakeId: intake.id,
        legalAreaId: creator.legalAreaId,
        legalTopicId: creator.legalTopicId,
        team: [],
        initialManagerCollaboratorId: manager.collaboratorId,
        operationId: randomUUID(),
      })
      .expect(409)
    expect(response.body.message).toBe('Selecione um Advogado ativo como Gestor inicial.')
    expect(await fixture.findCasesByIntakeId(intake.id)).toEqual([])
  })
})
