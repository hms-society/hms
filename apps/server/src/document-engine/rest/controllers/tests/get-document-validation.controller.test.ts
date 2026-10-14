import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { GetDocumentValidationController } from '@/document-engine/rest/controllers/get-document-validation.controller'
import type { CaseChecklistItemsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Get Document Validation Controller [GET /document-validation/documents/:documentFileId]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      GetDocumentValidationController,
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

  it('returns the persisted validation document', async () => {
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
          storagePath: 'client/file.pdf',
          originalName: 'file.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
          status: DocumentValidationStatus.AwaitingValidation,
        },
      ],
    })
    const fileId = batch.files?.[0]?.id
    expect(fileId).toBeDefined()

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${fileId}`)
      .expect(200)

    expect(response.body).toMatchObject({
      id: fileId,
      batchId: batch.id,
      fileName: 'file.pdf',
      clientId,
      status: DocumentValidationStatus.AwaitingValidation,
    })
  })

  it('returns a not found error for an unknown file', async () => {
    await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${randomUUID()}`)
      .expect(404)
  })

  it('projects failure, duplicate, extraction, missing-field, and checklist context', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-extraction',
        title: 'Comprovante de residência',
        isRequired: true,
      },
    ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/original-proof.pdf',
          originalName: 'comprovante-original.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
        {
          storagePath: 'client/duplicate-proof.pdf',
          originalName: 'comprovante-duplicado.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
        },
      ],
    })
    const originalFile = batch.files?.[0]
    const duplicateFile = batch.files?.[1]
    expect(checklistItem).toBeDefined()
    expect(originalFile).toBeDefined()
    expect(duplicateFile).toBeDefined()
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: originalFile?.id ?? '',
      status: DocumentValidationStatus.Valid,
      caseId: legalCase.id,
      checklistItemId: checklistItem?.id,
      hashSha256: 'a'.repeat(64),
      extractedFields: [],
      missingFields: [],
    })
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: duplicateFile?.id ?? '',
      status: DocumentValidationStatus.Duplicate,
      caseId: legalCase.id,
      checklistItemId: checklistItem?.id,
      hashSha256: 'b'.repeat(64),
      originalDocumentId: originalFile?.id,
      aiSuggestion: {
        failureReason: 'A leitura automática não confirmou os dados.',
        failureInstruction: 'Confira o documento original antes de aprovar.',
        originalDocumentFileName: 'nome recebido pela análise',
      },
      extractedFields: [
        { label: 'CEP', value: '01310-100', confidence: 0.96, isRequired: true },
      ],
      missingFields: ['número do imóvel'],
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/document-validation/documents/${duplicateFile?.id}`)
      .expect(200)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: duplicateFile?.id,
        status: DocumentValidationStatus.Duplicate,
        extractedFields: [
          expect.objectContaining({
            label: 'CEP',
            value: '01310-100',
            confidence: 0.96,
            isRequired: true,
          }),
        ],
        missingFields: ['número do imóvel'],
        failure: {
          reason: 'A leitura automática não confirmou os dados.',
          instruction: 'Confira o documento original antes de aprovar.',
        },
        checklistLink: expect.objectContaining({
          caseId: legalCase.id,
          caseLabel: legalCase.title,
          checklistItemId: checklistItem?.id,
          checklistItemLabel: 'Comprovante de residência',
        }),
        duplicateMatch: expect.objectContaining({
          documentFileId: originalFile?.id,
          fileName: 'comprovante-original.pdf',
          caseLabel: legalCase.title,
          checklistItemLabel: 'Comprovante de residência',
          hashSha256: 'a'.repeat(64),
        }),
      }),
    )

    const listResponse = await request(fixture.app.getHttpServer())
      .get('/document-validation/documents')
      .query({ caseId: legalCase.id })
      .expect(200)
    expect(listResponse.body).toContainEqual(
      expect.objectContaining({
        id: duplicateFile?.id,
        failure: {
          reason: 'A leitura automática não confirmou os dados.',
          instruction: 'Confira o documento original antes de aprovar.',
        },
        duplicateMatch: expect.objectContaining({
          documentFileId: originalFile?.id,
          fileName: 'comprovante-original.pdf',
        }),
        extractedFields: expect.arrayContaining([
          expect.objectContaining({ label: 'CEP', value: '01310-100' }),
        ]),
        missingFields: ['número do imóvel'],
      }),
    )
  })
})
