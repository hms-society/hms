import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import {
  ClientFaker,
  CollaboratorCreationFaker,
  UserFaker,
} from '@hms/core/identity/domain/entities/fakers'
import { TaxIdFaker } from '@hms/core/identity/domain/structures/fakers'
import { IntakeListStatus } from '@hms/core/intake/domain/structures'

import {
  DrizzleClientsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { ListIntakesController } from '@/intake/rest/controllers/list-intakes.controller'
import { IntakeModuleFixture } from '@/intake/fixtures/intake-module-fixture'

describe('List Intakes Controller [GET /intakes]', () => {
  let fixture: IntakeModuleFixture

  beforeAll(async () => {
    fixture = await IntakeModuleFixture.register(ListIntakesController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists hydrated intakes with pagination, filters, and masked client data', async () => {
    const clientRepository = fixture.app.get(DrizzleClientsRepository)
    const usersRepository = fixture.app.get(DrizzleUsersRepository)
    const collaboratorsRepository = fixture.app.get(DrizzleCollaboratorsRepository)

    const clientDraft = ClientFaker.fake({
      name: 'Cliente Listável',
      taxId: TaxIdFaker.cpf({ value: '52998224725' }),
    })
    const client = await clientRepository.add({
      type: 'natural',
      name: clientDraft.name,
      taxId: clientDraft.taxId,
      phone: clientDraft.phone,
      email: clientDraft.email,
      address: clientDraft.address,
    })
    if (!client) throw new Error('Test client was not created')

    const userDraft = UserFaker.fake({ status: 'active' })
    const [user] = await usersRepository.addMany([
      {
        id: userDraft.id,
        email: userDraft.email,
        status: userDraft.status,
        lastAccessAt: userDraft.lastAccessAt,
      },
    ])
    if (!user) throw new Error('Test user was not created')

    const responsible = await collaboratorsRepository.add(
      CollaboratorCreationFaker.administrative({
        userId: user.id,
        profile: 'attendant',
        professionalName: 'Responsável Listável',
      }),
    )
    if (!responsible) throw new Error('Test responsible was not created')

    await fixture.seedIntakes([
      {
        clientId: client.id,
        responsibleId: responsible.id,
        status: IntakeListStatus.Contracted,
        demandNotes: 'Demanda que não participa da busca',
      },
      {
        clientId: client.id,
        responsibleId: responsible.id,
        status: IntakeListStatus.ConsultationScheduled,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .get('/intakes')
      .query({ search: 'Cliente Listável', page: 1, pageSize: 1 })
      .expect(200)

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2,
      statusCounts: {
        all: 2,
        byStatus: {
          [IntakeListStatus.Contracted]: 1,
          [IntakeListStatus.ConsultationScheduled]: 1,
        },
      },
    })
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0]).toMatchObject({
      client: {
        clientId: client.id,
        name: 'Cliente Listável',
        maskedTaxId: '***.***.***-25',
      },
      responsible: {
        responsibleId: responsible.id,
        professionalName: 'Responsável Listável',
      },
    })
    expect(response.body.items[0].client.maskedTaxId).not.toContain('52998224725')
  })

  it('normalizes an invalid status and caps the requested page size', async () => {
    const response = await request(fixture.app.getHttpServer())
      .get('/intakes')
      .query({ status: 'unknown-status', pageSize: 101 })
      .expect(200)

    expect(response.body).toMatchObject({
      page: 1,
      pageSize: 100,
      total: 0,
      totalPages: 0,
    })
  })
})
