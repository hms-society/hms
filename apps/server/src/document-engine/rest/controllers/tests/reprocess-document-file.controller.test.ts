import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { DocumentFileProcessingRequestedEvent } from '@hms/core/document-engine/domain/events'
import { AppError } from '@hms/core/shared/domain/errors'
import type { ProcessDocumentFileWorkflowInput } from '@hms/core/document-engine/domain/structures'
import type { CaseMembersRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { DetectDocumentDuplicateTool } from '@/document-engine/ai/mastra/tools/detect-document-duplicate-tool'
import { ProcessDocumentFileJob } from '@/document-engine/messaging/inngest/jobs/process-document-file-job'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import {
  DocumentBatchChannel,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'

describe('Reprocess Document File Controller [POST /document-validation/documents/:documentFileId/reprocess]', () => {
  let fixture: DocumentEngineModuleFixture
  let userId: string
  let clientId: string
  let inngest: InngestFixture
  const duplicateHashesByFileId = new Map<string, string>()
  const duplicateDetectionResults = new Map<string, Record<string, unknown>>()

  beforeAll(async () => {
    userId = randomUUID()
    inngest = await InngestFixture.register({
      createFunctions(client) {
        const workflow = {
          run: async (input: ProcessDocumentFileWorkflowInput) => {
            const hashSha256 =
              duplicateHashesByFileId.get(input.documentFileId) ?? 'f'.repeat(64)
            const tool = new DetectDocumentDuplicateTool(
              fixture.documentValidationsRepository,
            )
            const detection = await tool.function.execute({
              ...input,
              contentBase64: 'dGVzdA==',
              hashSha256,
            })
            duplicateDetectionResults.set(input.documentFileId, detection)
            return {
              batchId: input.batchId,
              documentFileId: input.documentFileId,
              metadata: { hashSha256, extractedTextFull: '' },
              suggestion: detection.suggestion,
            }
          },
        }
        return [new ProcessDocumentFileJob(client, workflow as never).function]
      },
    })
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      undefined,
      userId,
      (builder) => builder.overrideProvider(InngestClient).useValue(inngest.client),
    )
  })

  beforeEach(async () => {
    clientId = randomUUID()
    duplicateHashesByFileId.clear()
    duplicateDetectionResults.clear()
    await fixture.resetDatabase()
    await fixture.seedUserAndClient(userId, clientId)
  })

  afterAll(async () => {
    try {
      await fixture?.close()
    } finally {
      await inngest?.close()
    }
  })

  it('marks a persisted file for processing and publishes its event', async () => {
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.WhatsApp,
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

    const publication = vi.spyOn(inngest.client, 'send')
    const response = await request(fixture.app.getHttpServer())
      .post(`/document-validation/documents/${fileId}/reprocess`)
      .expect(201)

    expect(publication).toHaveBeenCalledWith({
      name: DocumentFileProcessingRequestedEvent._NAME,
      data: {
        batchId: batch.id,
        documentFileId: fileId,
        storagePath: 'client/file.pdf',
        originalName: 'file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 12,
      },
    })
    publication.mockRestore()
    expect(response.body).toMatchObject({
      id: fileId,
      status: DocumentValidationStatus.Processing,
    })
    expect(
      (await fixture.documentValidationsRepository.findByFileId(fileId ?? ''))?.status,
    ).toBe(DocumentValidationStatus.Processing)
  })

  it('detects an existing hash match and returns no duplicate for an unmatched hash', async () => {
    const matchingHash = 'a'.repeat(64)
    const unmatchedHash = 'b'.repeat(64)
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.WhatsApp,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/original.pdf',
          originalName: 'original.pdf',
          mimeType: 'application/octet-stream',
          sizeBytes: 12,
        },
        {
          storagePath: 'client/duplicate-candidate.pdf',
          originalName: 'duplicate-candidate.pdf',
          mimeType: 'application/octet-stream',
          sizeBytes: 12,
        },
        {
          storagePath: 'client/unique-candidate.pdf',
          originalName: 'unique-candidate.pdf',
          mimeType: 'application/octet-stream',
          sizeBytes: 12,
        },
      ],
    })
    const [original, duplicateCandidate, uniqueCandidate] = batch.files ?? []
    expect(original).toBeDefined()
    expect(duplicateCandidate).toBeDefined()
    expect(uniqueCandidate).toBeDefined()
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: original?.id ?? '',
      status: DocumentValidationStatus.Valid,
      hashSha256: matchingHash,
      extractedFields: [],
      missingFields: [],
    })
    duplicateHashesByFileId.set(duplicateCandidate?.id ?? '', matchingHash)
    duplicateHashesByFileId.set(uniqueCandidate?.id ?? '', unmatchedHash)

    for (const candidate of [duplicateCandidate, uniqueCandidate]) {
      await request(fixture.app.getHttpServer())
        .post(`/document-validation/documents/${candidate?.id}/reprocess`)
        .expect(201)
    }

    await expect
      .poll(
        () =>
          duplicateDetectionResults.has(duplicateCandidate?.id ?? '') &&
          duplicateDetectionResults.has(uniqueCandidate?.id ?? ''),
        { timeout: 20_000 },
      )
      .toBe(true)
    expect(duplicateDetectionResults.get(duplicateCandidate?.id ?? '')).toMatchObject({
      suggestion: {
        suggestedStatus: DocumentValidationStatus.Duplicate,
        originalDocumentId: original?.id,
        originalDocumentFileName: 'original.pdf',
      },
    })
    expect(duplicateDetectionResults.get(uniqueCandidate?.id ?? '')).toBeDefined()
    expect(duplicateDetectionResults.get(uniqueCandidate?.id ?? '')).not.toHaveProperty(
      'suggestion',
    )
  }, 30_000)

  it('rejects malformed file identifiers', async () => {
    await request(fixture.app.getHttpServer())
      .post('/document-validation/documents/invalid/reprocess')
      .expect(400)
  })
  it('propagates a controlled broker failure and permits retry through the real broker', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.WhatsApp,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/retry.pdf',
          originalName: 'retry.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
        },
      ],
    })
    const fileId = batch.files?.[0]?.id ?? ''
    expect(fileId).not.toBe('')
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: fileId,
      caseId: legalCase.id,
      status: DocumentValidationStatus.AwaitingValidation,
      extractedFields: [],
      missingFields: [],
    })
    // Controlled adapter failure: the successful retry still uses real Inngest transport.
    const publication = vi
      .spyOn(inngest.client, 'send')
      .mockRejectedValueOnce(new AppError('Publication unavailable', 'Broker error'))
    try {
      await request(fixture.app.getHttpServer())
        .post(`/document-validation/documents/${fileId}/reprocess`)
        .expect(500)
      expect(
        (await fixture.documentValidationsRepository.findByFileId(fileId))?.status,
      ).toBe(DocumentValidationStatus.Processing)
      const retry = await request(fixture.app.getHttpServer())
        .post(`/document-validation/documents/${fileId}/reprocess`)
        .expect(201)
      expect(retry.body.status).toBe(DocumentValidationStatus.Processing)
      const processingPublications = publication.mock.calls.filter(
        ([event]) => event.name === DocumentFileProcessingRequestedEvent._NAME,
      )
      expect(processingPublications).toHaveLength(2)
      expect(processingPublications.at(-1)?.[0]).toEqual({
        name: DocumentFileProcessingRequestedEvent._NAME,
        data: {
          batchId: batch.id,
          documentFileId: fileId,
          storagePath: 'client/retry.pdf',
          originalName: 'retry.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
        },
      })
    } finally {
      publication.mockRestore()
    }
  })

  it('denies a removed member before changing processing status or publishing', async () => {
    const legalCase = await fixture.createCaseWithCurrentCollaborator()
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.WhatsApp,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId: legalCase.clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath: 'client/private.pdf',
          originalName: 'private.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 12,
        },
      ],
    })
    const fileId = batch.files?.[0]?.id ?? ''
    await fixture.documentValidationsRepository.recordAnalysis({
      documentFileId: fileId,
      caseId: legalCase.id,
      status: DocumentValidationStatus.AwaitingValidation,
      extractedFields: [],
      missingFields: [],
    })
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
    const publication = vi.spyOn(inngest.client, 'send')
    try {
      await request(fixture.app.getHttpServer())
        .post(`/document-validation/documents/${fileId}/reprocess`)
        .expect(403)
      expect(publication).not.toHaveBeenCalled()
      expect(
        (await fixture.documentValidationsRepository.findByFileId(fileId))?.status,
      ).toBe(DocumentValidationStatus.AwaitingValidation)
    } finally {
      publication.mockRestore()
    }
  })
})
