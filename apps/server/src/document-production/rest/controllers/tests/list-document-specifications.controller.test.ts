import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { ListDocumentSpecificationsController } from '@/document-production/rest/controllers'

describe('List Document Specifications Controller [GET /document-specifications]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      ListDocumentSpecificationsController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists seeded specifications with resolved legal names for an active administrator', async () => {
    const { areas, topics } = await fixture.seedCatalog()
    await fixture.specificationsSeeder.run({ legalAreas: areas, legalTopics: topics })
    await fixture.registerAdmin()

    const response = await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', 'Bearer fixture-access-token')
      .query({ search: 'contrato', page: 1, pageSize: 1 })
      .expect(200)

    expect(response.body).toMatchObject({ page: 1, pageSize: 1, total: 1, totalPages: 1 })
    expect(response.body.items[0]).toMatchObject({
      name: 'Contrato de prestação de serviços',
      application: {
        scope: 'legal_context',
        legalExpertises: [
          { legalAreaName: 'Cível', legalTopics: [{ legalTopicName: 'Contratos' }] },
        ],
      },
    })
  })

  it('applies legal filters and stable pagination through the real repository', async () => {
    const { areas, topics } = await fixture.seedCatalog()
    await fixture.specificationsSeeder.run({ legalAreas: areas, legalTopics: topics })
    const legalArea = areas[1]
    const legalTopic = topics.find(({ legalAreaId }) => legalAreaId === legalArea?.id)
    if (!legalArea || !legalTopic)
      throw new Error('Fixture legal references were not seeded')
    const [first, second] = await fixture.specificationsRepository.addMany([
      createSpecification({
        name: 'A modelo',
        application: {
          scope: 'legal_context',
          moment: 'consultation',
          legalAreaIds: [legalArea.id],
          legalTopicIdsByArea: { [legalArea.id]: [legalTopic.id] },
        },
      }),
      createSpecification({
        name: 'B modelo',
        application: {
          scope: 'legal_context',
          moment: 'consultation',
          legalAreaIds: [legalArea.id],
          legalTopicIdsByArea: { [legalArea.id]: [legalTopic.id] },
        },
      }),
    ])
    await fixture.registerAdmin()

    const response = await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', 'Bearer fixture-access-token')
      .query({ legalAreaId: areas[1].id, page: 2, pageSize: 1 })
      .expect(200)

    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(response.body.page).toBe(2)
    expect(response.body.items).toHaveLength(1)
  })

  it('does not match a topic from another area when both legal filters are combined', async () => {
    const { areas, topics } = await fixture.seedCatalog()
    const firstArea = areas[0]
    const secondArea = areas[1]
    const firstTopic = topics.find(({ legalAreaId }) => legalAreaId === firstArea?.id)
    const secondTopic = topics.find(({ legalAreaId }) => legalAreaId === secondArea?.id)
    if (!firstArea || !secondArea || !firstTopic || !secondTopic)
      throw new Error('Fixture legal references were not seeded')

    await fixture.specificationsRepository.addMany([
      createSpecification({
        name: 'Modelo com contextos distintos',
        application: {
          scope: 'legal_context',
          moment: 'consultation',
          legalAreaIds: [firstArea.id, secondArea.id],
          legalTopicIdsByArea: {
            [firstArea.id]: [firstTopic.id],
            [secondArea.id]: [secondTopic.id],
          },
        },
      }),
    ])
    const admin = await fixture.registerAdmin()

    const response = await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .query({ legalAreaId: firstArea.id, legalTopicId: secondTopic.id })
      .expect(200)

    expect(response.body.items).toHaveLength(0)
  })

  it('orders names by trimmed lowercase text before the identifier', async () => {
    const admin = await fixture.registerAdmin()
    await fixture.specificationsRepository.addMany([
      createSpecification({ name: ' zebra' }),
      createSpecification({ name: 'Alpha' }),
      createSpecification({ name: ' beta ' }),
    ])

    const response = await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)

    expect(response.body.items.map(({ name }: { name: string }) => name)).toEqual([
      'Alpha',
      ' beta ',
      ' zebra',
    ])
  })

  it('rejects unauthenticated and non-administrator requests', async () => {
    await request(fixture.app.getHttpServer()).get('/document-specifications').expect(401)
    const user = await fixture.registerUser()
    await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', fixture.authenticateAs(user))
      .expect(403)
    expect(user.email).toBeTruthy()
  })

  it('rejects invalid pagination input at the REST boundary', async () => {
    const admin = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .query({ pageSize: 0 })
      .expect(400)
  })

  it('rejects invalid legal identifiers at the REST boundary', async () => {
    const admin = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .get('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .query({ legalAreaId: 'not-a-uuid' })
      .expect(400)
  })
})

function createSpecification(
  overrides: Partial<DocumentSpecificationCreation> = {},
): DocumentSpecificationCreation {
  return {
    name: 'Modelo de teste',
    description: 'Descrição de teste',
    content: 'Conteúdo de teste',
    variables: [],
    application: {
      scope: 'global',
      moment: 'consultation',
      legalAreaIds: [],
      legalTopicIdsByArea: {},
    },
    isRequired: false,
    status: 'available',
    ...overrides,
  }
}
