import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import {
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'

import {
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { ListIntakeResponsiblesController } from '@/intake/rest/controllers/list-intake-responsibles.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('List Intake Responsibles Controller [GET /intakes/responsibles]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(ListIntakeResponsiblesController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists only responsibles linked to active users', async () => {
    const usersRepository = fixture.app.get(DrizzleUsersRepository)
    const collaboratorsRepository = fixture.app.get(DrizzleCollaboratorsRepository)
    const activeUserDraft = UserFaker.fake({ status: 'active' })
    const disabledUserDraft = UserFaker.fake({ status: 'disabled' })
    const users = await usersRepository.addMany([
      {
        id: activeUserDraft.id,
        email: activeUserDraft.email,
        status: activeUserDraft.status,
        lastAccessAt: activeUserDraft.lastAccessAt,
      },
      {
        id: disabledUserDraft.id,
        email: disabledUserDraft.email,
        status: disabledUserDraft.status,
        lastAccessAt: disabledUserDraft.lastAccessAt,
      },
    ])
    const activeUser = users.find(({ id }) => id === activeUserDraft.id)
    const disabledUser = users.find(({ id }) => id === disabledUserDraft.id)
    if (!activeUser || !disabledUser) throw new Error('Test users were not created')

    await collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({
        userId: activeUser.id,
        profile: 'attendant',
        professionalName: 'Atendente Ativo',
      }),
    )
    await collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({
        userId: disabledUser.id,
        profile: 'attendant',
        professionalName: 'Atendente Inativo',
      }),
    )

    const response = await request(fixture.app.getHttpServer())
      .get('/intakes/responsibles')
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({ professionalName: 'Atendente Ativo' }),
    ])
    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ professionalName: 'Atendente Inativo' }),
      ]),
    )
  })
})
