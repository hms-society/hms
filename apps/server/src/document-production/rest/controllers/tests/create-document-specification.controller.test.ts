import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { CreateDocumentSpecificationController } from '@/document-production/rest/controllers'

describe('Create Document Specification Controller [POST /document-specifications]', () => {
  let fixture: DocumentProductionModuleFixture
  const content = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
  }

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      CreateDocumentSpecificationController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('rejects unauthenticated requests', async () => {
    await request(fixture.app.getHttpServer())
      .post('/document-specifications')
      .send({
        name: 'Modelo',
        description: 'Descrição',
        application: { scope: 'global', moment: 'consultation' },
        isRequired: false,
      })
      .expect(401)
  })

  it('creates an available global specification with its template', async () => {
    const admin = await fixture.registerAdmin()

    const response = await request(fixture.app.getHttpServer())
      .post('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        name: ' Novo modelo ',
        description: ' Descrição objetiva ',
        application: { scope: 'global', moment: 'consultation' },
        isRequired: false,
        content,
        variables: [],
      })
      .expect(201)

    expect(response.body).toMatchObject({
      name: 'Novo modelo',
      description: 'Descrição objetiva',
      status: 'available',
      application: { scope: 'global', moment: 'consultation' },
      content,
      variables: [],
    })
  })

  it('rejects invalid payload before persisting', async () => {
    const admin = await fixture.registerAdmin()

    await request(fixture.app.getHttpServer())
      .post('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        name: '',
        description: 'Descrição',
        application: { scope: 'global', moment: 'consultation' },
        isRequired: false,
        status: 'available',
      })
      .expect(400)
  })

  it('creates a legal specification only with catalog references', async () => {
    const admin = await fixture.registerAdmin()
    const { areas, topics } = await fixture.seedCatalog()
    const area = areas[0]
    const topic = topics.find(({ legalAreaId }) => legalAreaId === area?.id)
    if (!area || !topic) throw new Error('Fixture legal references were not seeded')

    const response = await request(fixture.app.getHttpServer())
      .post('/document-specifications')
      .set('Authorization', fixture.authenticateAs(admin))
      .send({
        name: 'Modelo jurídico',
        description: 'Modelo jurídico válido',
        application: {
          scope: 'legal_context',
          moment: 'legal_production',
          legalAreaIds: [area.id],
          legalTopicIdsByArea: { [area.id]: [topic.id] },
        },
        isRequired: true,
        content,
        variables: [],
      })
      .expect(201)

    expect(response.body.application).toMatchObject({
      scope: 'legal_context',
      moment: 'legal_production',
      legalAreaIds: [area.id],
      legalTopicIdsByArea: { [area.id]: [topic.id] },
    })
  })
})
