import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ListCaseDocumentExceptionsController } from '@/document-engine/rest/controllers/list-case-document-exceptions.controller'
import { DOCUMENT_ENGINE_REPOSITORIES } from '@/document-engine/rest/controllers/request-document-exception.controller'
import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'
import type { DocumentExceptionsRepository } from '@hms/core/document-engine/interfaces'

describe('List Case Document Exceptions Controller [GET /cases/:caseId/document-exceptions]', () => {
  let fixture: DocumentEngineModuleFixture
  let repository: DocumentExceptionsRepository

  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ListCaseDocumentExceptionsController,
      randomUUID(),
    )
    repository = fixture.app.get<DocumentExceptionsRepository>(
      DOCUMENT_ENGINE_REPOSITORIES.documentExceptions,
    )
  })

  beforeEach(async () => {
    await fixture.resetDatabase()
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('returns only exceptions for the requested case', async () => {
    const caseId = randomUUID()
    const otherCaseId = randomUUID()
    const actorId = randomUUID()
    const expected = await repository.create({
      caseId,
      type: DocumentExceptionType.DISPENSA_DEFINITIVA,
      status: DocumentExceptionStatus.PENDING,
      justification: 'Missing document',
      createdBy: actorId,
    })
    await repository.create({
      caseId: otherCaseId,
      type: DocumentExceptionType.DISPENSA_DEFINITIVA,
      status: DocumentExceptionStatus.PENDING,
      justification: 'Other case',
      createdBy: actorId,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${caseId}/document-exceptions`)
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        id: expected.id,
        caseId,
        justification: 'Missing document',
      }),
    ])
  })

  it('forbids a collaborator without an allowed profile', async () => {
    await fixture.setCollaboratorProfile('attendant')
    await request(fixture.app.getHttpServer())
      .get(`/cases/${randomUUID()}/document-exceptions`)
      .expect(403)
  })
})
