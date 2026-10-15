import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { LegalCaseFaker } from '@hms/core/case-management/domain/entities/fakers'

import {
  DrizzleCaseMembersRepository,
  DrizzleLegalCasesRepository,
} from '@/case-management/database/drizzle/repositories'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories'
import { IdentityModuleFixture } from '@/identity/fixtures/identity-module-fixture'
import { DeactivateCollaboratorController } from '@/identity/rest/controllers/deactivate-collaborator.controller'

describe('Deactivate Collaborator Controller [POST /collaborators/:collaboratorId/deactivate]', () => {
  let fixture: IdentityModuleFixture
  beforeAll(async () => {
    fixture = await IdentityModuleFixture.register(DeactivateCollaboratorController, true)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('disables the collaborator in the database and Auth service', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const user = await fixture.registerUser()
    const collaborator = await fixture.registerCollaborator(user, {
      profile: 'attendant',
    })
    const response = await request(fixture.app.getHttpServer())
      .post(`/collaborators/${collaborator.id}/deactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)
    expect(response.body).toMatchObject({
      collaboratorId: collaborator.id,
      status: 'disabled',
    })
    expect(await fixture.app.get(DrizzleUsersRepository).findById(user.id)).toMatchObject(
      { status: 'disabled' },
    )
  })

  it('returns not found for an unknown collaborator', async () => {
    const { user: admin } = await fixture.registerAdmin()
    await request(fixture.app.getHttpServer())
      .post(`/collaborators/${randomUUID()}/deactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(404)
  })

  it('keeps the only eligible case manager active', async () => {
    const { user: admin } = await fixture.registerAdmin()
    const managerUser = await fixture.registerUser()
    const manager = await fixture.registerCollaborator(managerUser, {
      profile: 'lawyer',
    })
    const client = await fixture.registerClient()
    const { areas, topics } = await fixture.seedLegalCatalog()
    const area = areas[0]
    if (!area) throw new Error('Legal area fixture was not created')
    const topic = topics.find(({ legalAreaId }) => legalAreaId === area.id)
    if (!topic) throw new Error('Legal topic fixture was not created')

    const legalCase = LegalCaseFaker.fake({
      clientId: client.id,
      legalAreaId: area.id,
      legalTopicId: topic.id,
    })
    const [createdCase] = await fixture.app.get(DrizzleLegalCasesRepository).addMany([
      {
        publicCode: legalCase.publicCode,
        clientId: legalCase.clientId,
        intakeId: legalCase.intakeId,
        legalAreaId: legalCase.legalAreaId,
        legalTopicId: legalCase.legalTopicId,
        title: legalCase.title,
        description: legalCase.description,
        status: legalCase.status,
        teamVersion: legalCase.teamVersion,
        openedAt: legalCase.openedAt,
      },
    ])
    if (!createdCase) throw new Error('Legal case fixture was not created')

    await fixture.app.get(DrizzleCaseMembersRepository).addMany([
      {
        caseId: createdCase.id,
        collaboratorId: manager.id,
        role: CaseMemberRole.Manager,
        assignedAt: new Date(),
        assignedBy: admin.id,
        archivedLegacy: false,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .post(`/collaborators/${manager.id}/deactivate`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(409)

    expect(response.body.message).toBe(
      'A alteração deixaria um Caso sem Gestor elegível.',
    )
  })
})
