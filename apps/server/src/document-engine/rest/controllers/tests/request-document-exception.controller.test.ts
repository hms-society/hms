import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { RequestDocumentExceptionController } from '@/document-engine/rest/controllers/request-document-exception.controller'
import { ActiveCollaboratorGuard } from '@/identity/guards'

describe('Request Document Exception Controller [POST /cases/:caseId/document-exceptions]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string
  let caseId: string
  let collaboratorId: string

  beforeAll(async () => {
    userId = randomUUID()
    collaboratorId = randomUUID()

    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      RequestDocumentExceptionController,
      userId,
      (builder) =>
        builder.overrideGuard(ActiveCollaboratorGuard).useValue({
          canActivate(context: any) {
            const req = context.switchToHttp().getRequest()
            req.collaborator = {
              collaboratorId,
              userId: req.user.id,
              profile: 'lawyer',
              permissions: [],
            }
            return true
          },
        }),
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    caseId = randomUUID()

    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('deve solicitar uma exceção e gravar no banco', async () => {
    const documentId = randomUUID()

    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${caseId}/document-exceptions`)
      .send({
        documentId,
        type: 'ACEITE_PROVISORIO',
        justification: 'Falta assinar',
        deadlineDate: new Date('2026-10-10').toISOString(),
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        caseId,
        documentId,
        type: 'ACEITE_PROVISORIO',
        status: 'PENDING',
        justification: 'Falta assinar',
      }),
    )

    const db = (fixture as any).drizzleClient.requireDatabase()
    const result = await db.execute(
      `SELECT * FROM document_exceptions WHERE id = '${response.body.id}'`,
    )
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('PENDING')
  })

  it('deve retornar 400 se data limite não for fornecida para ACEITE_PROVISORIO', async () => {
    const documentId = randomUUID()

    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${caseId}/document-exceptions`)
      .send({
        documentId,
        type: 'ACEITE_PROVISORIO',
        justification: 'Falta assinar',
      })

    expect(response.status).toBe(400)
  })
})
