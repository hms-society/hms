import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { CaseMembersRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { ListDocumentValidationLogsController } from '@/document-engine/rest/controllers/list-document-validation-logs.controller'
import {
  DocumentBatchChannel,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('List Document Validation Logs Controller [GET /document-validation/documents/:documentFileId/logs]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      ListDocumentValidationLogsController,
      userId,
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('returns the validation history for a document file', async () => {
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
          storagePath: 'client/comprovante-residencia.pdf',
          originalName: 'comprovante-residencia.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })

    const file = batch.files?.[0]
    expect(file).toBeDefined()

    await fixture.documentValidationLogsRepository.add({
      documentFileId: file?.id ?? '',
      actorId: userId,
      action: DocumentValidationLogAction.ResendRequested,
      status: DocumentValidationStatus.ResendRequested,
      reason: 'Documento incompleto.',
      message: 'Envie novamente o arquivo completo.',
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${file?.id}/logs`)
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        documentFileId: file?.id,
        actorId: userId,
        action: DocumentValidationLogAction.ResendRequested,
        status: DocumentValidationStatus.ResendRequested,
        reason: 'Documento incompleto.',
        message: 'Envie novamente o arquivo completo.',
      }),
    ])
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
    await fixture.documentValidationLogsRepository.add({
      documentFileId: fileId,
      actorId: userId,
      action: DocumentValidationLogAction.ResendRequested,
      reason: 'Private reason',
      message: 'Private message',
      metadata: { context: 'private-context' },
    })
    const allowed = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${fileId}/logs`)
      .expect(200)
    expect(allowed.body).toEqual([
      expect.objectContaining({
        reason: 'Private reason',
        message: 'Private message',
        metadata: { context: 'private-context' },
      }),
    ])
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
    const denied = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${fileId}/logs`)
      .expect(403)
    expect(JSON.stringify(denied.body)).not.toContain('Private')
    expect(JSON.stringify(denied.body)).not.toContain('private-context')
    expect(
      (await fixture.documentValidationsRepository.findByFileId(fileId))?.status,
    ).toBe(DocumentValidationStatus.AwaitingValidation)
  })
})
