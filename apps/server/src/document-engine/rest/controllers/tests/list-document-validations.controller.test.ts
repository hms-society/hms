import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { CaseMembersRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ListDocumentValidationsController } from '@/document-engine/rest/controllers/list-document-validations.controller'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('List Document Validations Controller [GET /document-validation/documents]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ListDocumentValidationsController,
      userId,
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture?.close()
  })

  it('filters persisted files by validation status', async () => {
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/first.pdf',
          originalName: 'first.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
          status: DocumentValidationStatus.AwaitingValidation,
        },
        {
          storagePath: 'client/second.pdf',
          originalName: 'second.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 13,
          status: DocumentValidationStatus.ResendRequested,
        },
      ],
    })

    const response = await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ status: DocumentValidationStatus.ResendRequested })
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        id: batch.files?.[1]?.id,
        fileName: 'second.pdf',
        status: DocumentValidationStatus.ResendRequested,
      }),
    ])
  })

  it('rejects an invalid case identifier', async () => {
    await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ caseId: 'invalid' })
      .expect(400)
  })
  it('revokes persisted Case content immediately after membership removal', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'private/case.pdf',
          originalName: 'private-case.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
        },
      ],
    })
    const fileId = batch.files?.[0]?.id ?? ''
    expect(fileId).not.toBe('')
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: fileId,
      status: DocumentValidationStatus.AwaitingValidation,
      caseId: legalCase.id,
      extractedFields: [],
      missingFields: [],
    })
    const allowed = await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ caseId: legalCase.id })
      .expect(200)
    expect(allowed.body.map((document: { id: string }) => document.id)).toEqual([fileId])
    const members = fixture.app.get<CaseMembersRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseMembers,
    )
    const membership = await members.findByCaseAndCollaborator(
      legalCase.id,
      fixture.authCollaboratorId ?? '',
    )
    expect(membership).toBeDefined()
    if (!membership) throw new Error('Expected persisted membership')
    await members.replace(membership.id, {
      role: membership.role,
      assignedAt: membership.assignedAt,
      assignedBy: membership.assignedBy,
      removedAt: new Date('2026-10-07T12:00:00.000Z'),
      removedBy: fixture.authCollaboratorId,
    })
    await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ caseId: legalCase.id })
      .expect(403)
    const filtered = await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .expect(200)
    expect(filtered.body).toEqual([])
    expect(
      (await fixture.documentValidationsRepository.findByFileId(fileId))?.status,
    ).toBe(DocumentValidationStatus.AwaitingValidation)
  })
})
