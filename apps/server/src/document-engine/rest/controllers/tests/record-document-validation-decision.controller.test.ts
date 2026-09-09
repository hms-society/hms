import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { RecordDocumentValidationDecisionController } from '@/document-engine/rest/controllers/record-document-validation-decision.controller'
import { IdProvider } from '@/shared/provision/id/id-provider'
import {
  DocumentBatchChannel,
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Record Document Validation Decision Controller [PATCH /document-validation/documents/:documentFileId/decision]', () => {
  const idProvider = new IdProvider()
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = idProvider.generate()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      RecordDocumentValidationDecisionController,
      userId,
    )
  })

  beforeEach(async () => {
    clientId = idProvider.generate()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    await fixture.close()
  })

  it('records a validation decision without writing mock labels into uuid columns', async () => {
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${idProvider.generate()}`,
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

    const response = await request(fixture.app.getHttpServer())
      .patch(`/document-validation/documents/${file?.id}/decision`)
      .send({
        decision: DocumentValidationDecision.Validate,
        documentTypeId: 'case-0089',
        checklistRequirementId: 'residence-proof',
      })
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.Valid,
        reviewedBy: userId,
      }),
    )
    expect(response.body.checklistLink.caseId).toBeUndefined()
    expect(response.body.checklistLink.checklistItemId).toBeUndefined()
    expect(response.body.humanCorrection).toEqual(
      expect.objectContaining({
        decision: DocumentValidationDecision.Validate,
        documentTypeId: 'case-0089',
        checklistRequirementId: 'residence-proof',
      }),
    )

    const logs = await fixture.documentValidationLogsRepository.listByDocumentFileId(
      file?.id ?? '',
    )

    expect(logs).toEqual([
      expect.objectContaining({
        documentFileId: file?.id,
        actorId: userId,
        action: DocumentValidationLogAction.DecisionRecorded,
        status: DocumentValidationStatus.Valid,
        decision: DocumentValidationDecision.Validate,
      }),
    ])
  })
})
