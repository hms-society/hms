import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ReviewDocumentExceptionController } from '@/document-engine/rest/controllers/review-document-exception.controller'
import { DOCUMENT_ENGINE_REPOSITORIES } from '@/document-engine/rest/controllers/request-document-exception.controller'
import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '@hms/core/document-engine/domain/structures'
import type { DocumentExceptionsRepository } from '@hms/core/document-engine/interfaces'

describe.each([
  { action: 'approve', status: DocumentExceptionStatus.APPROVED },
  { action: 'reject', status: DocumentExceptionStatus.REJECTED },
])('Review Document Exception Controller [POST /documents/exceptions/:id/$action]', ({
  action,
  status,
}) => {
  let fixture: DocumentEngineModuleFixture
  let repository: DocumentExceptionsRepository

  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ReviewDocumentExceptionController,
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

  it(`persists a ${status.toLowerCase()} decision and reviewer`, async () => {
    const caseId = (await fixture.createCaseWithCurrentCollaborator()).id
    const exception = await repository.create({
      caseId,
      type: DocumentExceptionType.DISPENSA_DEFINITIVA,
      status: DocumentExceptionStatus.PENDING,
      justification: 'Missing document',
      createdBy: fixture.authenticatedUserId ?? '',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/documents/exceptions/${exception.id}/${action}`)
      .send({ justification: 'Review reason' })
      .expect(201)

    expect(response.body).toMatchObject({
      id: exception.id,
      status,
      reviewedBy: fixture.authCollaboratorId,
      ...(action === 'reject' ? { rejectionJustification: 'Review reason' } : {}),
    })
    expect(await repository.findById(exception.id)).toMatchObject({
      status,
      reviewedBy: fixture.authCollaboratorId,
    })
  })

  it('forbids reviewing an exception for a Case without current membership', async () => {
    const caseId = (await fixture.createCaseWithCurrentCollaborator(false)).id
    const exception = await repository.create({
      caseId,
      type: DocumentExceptionType.DISPENSA_DEFINITIVA,
      status: DocumentExceptionStatus.PENDING,
      justification: 'Missing document',
      createdBy: fixture.authenticatedUserId ?? '',
    })
    await request(fixture.app.getHttpServer())
      .post(`/documents/exceptions/${exception.id}/${action}`)
      .send({})
      .expect(403)
  })
})
