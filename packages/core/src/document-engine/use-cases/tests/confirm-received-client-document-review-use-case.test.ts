import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { CollaboratorsRepository } from '#identity/interfaces'
import { CollaboratorFaker } from '#identity/domain/entities/fakers'
import type { CaseAccessProvider } from '../../../case-management/interfaces'
import { CaseAccessIntent } from '../../../case-management/domain/structures'
import { ConflictError, ForbiddenError } from '#shared/domain/errors'
import {
  ClientDocumentFaker,
  ClientDocumentUploadFaker,
  DocumentValidationDocumentFaker,
} from '../../domain/entities/fakers'
import type {
  DocumentValidationsRepository,
  DocumentValidationLogsRepository,
  DocumentValidationReviewRepository,
  ChecklistUploadPublicationRepository,
  ClientDocumentUploadsRepository,
} from '../../interfaces'
import {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../../domain/structures'
import type { ResolveClientDocumentUseCase } from '../resolve-client-document-use-case'
import { ConfirmReceivedClientDocumentReviewUseCase } from '../confirm-received-client-document-review-use-case'

describe('Confirm Received Client Document Review Use Case', () => {
  let resolve: MockProxy<ResolveClientDocumentUseCase>
  let validations: MockProxy<DocumentValidationsRepository & DocumentValidationReviewRepository>
  let logs: MockProxy<DocumentValidationLogsRepository>
  let collaborators: MockProxy<CollaboratorsRepository>
  let access: MockProxy<CaseAccessProvider>
  let batches: MockProxy<ChecklistUploadPublicationRepository>
  let uploads: MockProxy<ClientDocumentUploadsRepository>
  let useCase: ConfirmReceivedClientDocumentReviewUseCase
  const actor = CollaboratorFaker.legal()
  const document = ClientDocumentFaker.fake({
    source: { kind: 'received_file', fileId: 'file' },
  })
  const request = {
    documentId: document.id,
    clientId: document.clientId,
    caseId: 'target',
    checklistItemId: 'item',
    actorId: actor.id,
    reviewedAt: new Date('2026-10-13T12:00:00.000Z'),
  }
  const current = DocumentValidationDocumentFaker.fake({
    id: 'file',
    clientId: document.clientId,
    checklistLink: { caseId: request.caseId },
    humanCorrection: { decision: 'previous', reason: 'Preserved note' },
  })
  beforeEach(() => {
    batches = mock<ChecklistUploadPublicationRepository>()
    uploads = mock<ClientDocumentUploadsRepository>()
    resolve = mock<ResolveClientDocumentUseCase>()
    validations = mock<DocumentValidationsRepository & DocumentValidationReviewRepository>()
    logs = mock<DocumentValidationLogsRepository>()
    collaborators = mock<CollaboratorsRepository>()
    access = mock<CaseAccessProvider>()
    resolve.execute.mockResolvedValue(document)
    validations.findByFileId.mockResolvedValue(current)
    validations.replace.mockResolvedValue(true)
    collaborators.findById.mockResolvedValue(actor)
    useCase = new ConfirmReceivedClientDocumentReviewUseCase(
      resolve,
      validations,
      logs,
      collaborators,
      access,
      batches,
      uploads,
    )
  })
  it('records genuine human approval with user identity and exact review context while filling a missing same-Case link', async () => {
    await useCase.execute(request)
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId: request.caseId,
      actorId: actor.id,
      intent: CaseAccessIntent.WriteContent,
    })
    expect(resolve.execute).toHaveBeenCalledExactlyOnceWith({
      ...request,
      forSelection: false,
    })
    expect(validations.replace).toHaveBeenCalledExactlyOnceWith(
      current.id,
      {
        status: DocumentValidationStatus.Valid,
        reviewedBy: actor.userId,
        reviewedAt: request.reviewedAt,
        checklistItemId: request.checklistItemId,
        humanCorrection: {
          decision: DocumentValidationDecision.Validate,
          reason: 'Preserved note',
          checklistReview: {
            clientDocumentId: document.id,
            caseId: request.caseId,
            checklistItemId: request.checklistItemId,
            actorId: actor.id,
            reviewedAt: request.reviewedAt.toISOString(),
          },
        },
      },
      {
        clientId: document.clientId,
        caseId: request.caseId,
        checklistItemId: undefined,
        reviewedAt: undefined,
      },
    )
    expect(logs.add).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        documentFileId: current.id,
        actorId: actor.userId,
        createdAt: request.reviewedAt,
        action: DocumentValidationLogAction.DecisionRecorded,
        status: DocumentValidationStatus.Valid,
        decision: DocumentValidationDecision.Validate,
        metadata: expect.objectContaining({
          caseId: request.caseId,
          checklistItemId: request.checklistItemId,
          origin: 'checklist_review',
        }),
      }),
    )
  })
  it.each([
    { caseId: 'origin', checklistItemId: 'origin-item' },
    { caseId: 'target', checklistItemId: 'another-item' },
    undefined,
  ])('preserves preexisting or unrestricted source authority %j', async (link) => {
    validations.findByFileId.mockResolvedValue({ ...current, checklistLink: link })
    await useCase.execute(request)
    const [, changes, expected] = validations.replace.mock.calls[0]
    expect(changes.checklistItemId).toBeUndefined()
    expect(changes).not.toHaveProperty('caseId')
    expect(expected).toMatchObject({
      caseId: link?.caseId,
      checklistItemId: link?.checklistItemId,
    })
  })
  it('carries the prior human timestamp into the atomic replacement', async () => {
    const reviewedAt = new Date('2026-10-12T12:00:00.123Z')
    validations.findByFileId.mockResolvedValue({ ...current, reviewedAt })
    await useCase.execute(request)
    expect(validations.replace.mock.calls[0][2].reviewedAt).toBe(reviewedAt)
  })
  it.each([
    'write',
    'source',
  ])('does not change original state after %s permission loss', async (permission) => {
    if (permission === 'write')
      access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    else resolve.execute.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ForbiddenError)
    expect(validations.replace).not.toHaveBeenCalled()
    expect(logs.add).not.toHaveBeenCalled()
  })
  it.each([
    'missing-document',
    'foreign-client',
    'missing-actor',
    'missing-user',
  ])('rejects unavailable identity/source mapping %s without audit', async (reason) => {
    if (reason === 'missing-document')
      validations.findByFileId.mockResolvedValue(undefined)
    if (reason === 'foreign-client')
      validations.findByFileId.mockResolvedValue({ ...current, clientId: 'foreign' })
    if (reason === 'missing-actor') collaborators.findById.mockResolvedValue(undefined)
    if (reason === 'missing-user')
      collaborators.findById.mockResolvedValue({ ...actor, userId: '' })
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(validations.replace).not.toHaveBeenCalled()
    expect(logs.add).not.toHaveBeenCalled()
  })
  it('does not write a produced source into the received-file projection', async () => {
    resolve.execute.mockResolvedValue(
      ClientDocumentFaker.fake({
        source: {
          kind: 'consultation_version',
          consultationId: 'consultation',
          documentId: 'doc',
          versionId: 'version',
        },
      }),
    )
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(validations.findByFileId).not.toHaveBeenCalled()
  })
  it('rejects a source ownership or concurrent review conflict before recording a human decision', async () => {
    validations.replace.mockResolvedValue(false)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(logs.add).not.toHaveBeenCalled()
  })
  it('propagates an audit failure so the enclosing Case transaction rolls back', async () => {
    logs.add.mockRejectedValue(new ConflictError('Audit failure'))
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
  })
  it.each([
    true,
    false,
  ])('publishes a private original only after its bound validation, success=%s', async (published) => {
    validations.findByFileId.mockResolvedValue({ ...current, clientId: undefined })
    uploads.findByStoragePath.mockResolvedValue(
      ClientDocumentUploadFaker.fake({
        storagePath: current.storagePath,
        clientDocumentId: document.id,
        clientId: request.clientId,
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
      }),
    )
    batches.publishChecklistUpload.mockResolvedValue(published)
    const result = useCase.execute(request)
    if (published) {
      await expect(result).resolves.toBeUndefined()
      expect(validations.replace).toHaveBeenCalledOnce()
      expect(logs.add).toHaveBeenCalledOnce()
    } else {
      await expect(result).rejects.toBeInstanceOf(ConflictError)
      expect(validations.replace).not.toHaveBeenCalled()
      expect(logs.add).not.toHaveBeenCalled()
    }
    expect(batches.publishChecklistUpload).toHaveBeenCalledExactlyOnceWith({
      documentId: document.id,
      fileId: current.id,
      clientId: request.clientId,
      caseId: request.caseId,
      checklistItemId: request.checklistItemId,
      reviewedAt: request.reviewedAt,
    })
  })
  it('rejects an unlinked ordinary source instead of publishing it as a checklist upload', async () => {
    validations.findByFileId.mockResolvedValue({ ...current, clientId: undefined })
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(ConflictError)
    expect(batches.publishChecklistUpload).not.toHaveBeenCalled()
    expect(validations.replace).not.toHaveBeenCalled()
  })
})
