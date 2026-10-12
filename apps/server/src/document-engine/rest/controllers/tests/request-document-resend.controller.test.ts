import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { CaseChecklistItemsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { RequestDocumentResendController } from '@/document-engine/rest/controllers/request-document-resend.controller'
import {
  DocumentBatchChannel,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Request Document Resend Controller [POST /document-validation/documents/:documentFileId/resend-request]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string

  beforeAll(async () => {
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      RequestDocumentResendController,
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

  it('records resend request and stores the sent message in the validation log', async () => {
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

    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${file?.id}/resend-request`)
      .send({
        reason: 'Documento incompleto.',
        message: 'Envie novamente o arquivo completo.',
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.ResendRequested,
        reviewedBy: userId,
      }),
    )
    expect(response.body.humanCorrection).toEqual(
      expect.objectContaining({
        reason: 'Documento incompleto.',
        message: 'Envie novamente o arquivo completo.',
      }),
    )

    const logs = await fixture.documentValidationLogsRepository.listByDocumentFileId(
      file?.id ?? '',
    )

    expect(logs).toEqual([
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

  it('returns a linked document to pending on its authorized case checklist', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-resend',
        title: 'Comprovante atualizado',
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
          storagePath: 'client/outdated-proof.pdf',
          originalName: 'comprovante-antigo.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: file?.id ?? '',
      caseId: legalCase.id,
      checklistItemId: checklistItem?.id,
      status: DocumentValidationStatus.Valid,
      extractedFields: [],
      missingFields: [],
    })
    await checklistItems.markAsValidatedByDocument({
      caseId: legalCase.id,
      checklistItemId: checklistItem?.id ?? '',
      documentFileId: file?.id ?? '',
      documentFileName: 'comprovante-antigo.pdf',
      validatedBy: fixture.authCollaboratorId ?? '',
    })
    await expect(checklistItems.listByCaseId(legalCase.id)).resolves.toEqual([
      expect.objectContaining({ status: 'validated', documentFileId: file?.id }),
    ])

    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${file?.id}/resend-request`)
      .send({
        reason: 'O documento está desatualizado.',
        message: 'Envie o comprovante atualizado.',
      })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.ResendRequested,
        checklistLink: expect.objectContaining({
          caseId: legalCase.id,
          caseLabel: legalCase.title,
          checklistItemId: checklistItem?.id,
          checklistItemLabel: 'Comprovante atualizado',
        }),
        humanCorrection: expect.objectContaining({
          reason: 'O documento está desatualizado.',
          message: 'Envie o comprovante atualizado.',
        }),
      }),
    )
    await expect(checklistItems.listByCaseId(legalCase.id)).resolves.toEqual([
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'pending',
        documentFileId: file?.id,
        documentFileName: 'comprovante-antigo.pdf',
      }),
    ])
  })

  it('authorizes the checklist Case when it differs from the validation record Case', async () => {
    const validationCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: checklistCase.id,
        templateItemKey: 'case-document-cross-case-link',
        title: 'Documento vinculado a outro Caso',
        isRequired: true,
      },
    ])
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: validationCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/cross-case-proof.pdf',
          originalName: 'documento-vinculado.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: file?.id ?? '',
      caseId: validationCase.id,
      status: DocumentValidationStatus.Valid,
      extractedFields: [],
      missingFields: [],
    })
    await checklistItems.markAsInAnalysisByDocument({
      checklistItemId: checklistItem?.id ?? '',
      documentFileId: file?.id ?? '',
      documentFileName: 'documento-vinculado.pdf',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${file?.id}/resend-request`)
      .send({ message: 'Envie uma versão atualizada.' })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.ResendRequested,
        checklistLink: expect.objectContaining({
          caseId: validationCase.id,
        }),
      }),
    )
    await expect(checklistItems.listByCaseId(checklistCase.id)).resolves.toEqual([
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'pending',
        documentFileId: file?.id,
        documentFileName: 'documento-vinculado.pdf',
      }),
    ])
  })

  it('finds and authorizes a checklist Case linked to a record without a Case id', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const checklistItems = fixture.app.get<CaseChecklistItemsRepository>(
      CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    )
    const [checklistItem] = await checklistItems.addMany([
      {
        caseId: legalCase.id,
        templateItemKey: 'case-document-owner-fallback',
        title: 'Documento sem vínculo no registro',
        isRequired: true,
      },
    ])
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
          storagePath: 'client/checklist-owned-proof.pdf',
          originalName: 'documento-sem-caso.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
        },
      ],
    })
    const file = batch.files?.[0]
    expect(checklistItem).toBeDefined()
    expect(file).toBeDefined()
    await checklistItems.markAsInAnalysisByDocument({
      checklistItemId: checklistItem?.id ?? '',
      documentFileId: file?.id ?? '',
      documentFileName: 'documento-sem-caso.pdf',
    })

    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${file?.id}/resend-request`)
      .send({ message: 'Envie novamente este documento.' })
      .expect(201)

    expect(response.body).toEqual(
      expect.objectContaining({
        id: file?.id,
        status: DocumentValidationStatus.ResendRequested,
      }),
    )
    await expect(checklistItems.listByCaseId(legalCase.id)).resolves.toEqual([
      expect.objectContaining({
        id: checklistItem?.id,
        status: 'pending',
        documentFileId: file?.id,
        documentFileName: 'documento-sem-caso.pdf',
      }),
    ])
  })
})
