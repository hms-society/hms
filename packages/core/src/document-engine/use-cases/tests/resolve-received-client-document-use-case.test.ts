import {
  CaseAccessIntent,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
} from '../../../case-management/domain/structures'
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ResolveReceivedClientDocumentUseCase } from '../resolve-received-client-document-use-case'
import type {
  ClientDocumentUploadsRepository,
  DocumentBatchesRepository,
} from '../../interfaces'
import type {
  CaseAccessProvider,
  LegalCasesRepository,
} from '../../../case-management/interfaces'
import { LegalCaseFaker } from '../../../case-management/domain/entities/fakers'
import {
  ClientDocumentUploadFaker,
  DocumentBatchFaker,
  DocumentBatchFileFaker,
} from '../../domain/entities/fakers'
describe('Resolve Received Client Document Use Case', () => {
  it('checks original Case restrictions and leaves global approval unchanged', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const access = mock<CaseAccessProvider>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const file = DocumentBatchFileFaker.fake({
      caseId: 'source-case',
      status: 'validated',
    })
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ clientId: legalCase.clientId, files: [file] }),
    ])
    cases.findById.mockResolvedValue(legalCase)
    const request = {
      clientId: legalCase.clientId,
      actorId: 'actor',
      caseId: legalCase.id,
      fileId: file.id,
    }
    expect(
      await new ResolveReceivedClientDocumentUseCase(
        batches,
        access,
        cases,
        mock<ClientDocumentUploadsRepository>(),
      ).execute(request),
    ).toMatchObject({ source: { kind: 'received_file', fileId: file.id } })
    expect(access.authorize).toHaveBeenCalledWith({
      caseId: file.caseId,
      actorId: 'actor',
      intent: CaseAccessIntent.ReadDocument,
    })
  })
  it('excludes unconfirmed client triage files', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const file = DocumentBatchFileFaker.fake()
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({
        clientId: legalCase.clientId,
        files: [file],
        inTriageBox: true,
      }),
    ])
    cases.findById.mockResolvedValue(legalCase)
    await expect(
      new ResolveReceivedClientDocumentUseCase(
        batches,
        mock<CaseAccessProvider>(),
        cases,
        mock<ClientDocumentUploadsRepository>(),
      ).execute({
        clientId: legalCase.clientId,
        actorId: 'actor',
        caseId: legalCase.id,
        fileId: file.id,
      }),
    ).rejects.toThrow()
  })
  it('denies operational-only Admin access before reading received-file metadata', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const access = mock<CaseAccessProvider>()
    const cases = mock<LegalCasesRepository>()
    access.authorize.mockImplementation(async ({ intent }) => {
      if (intent === CaseAccessIntent.ReadDocument) throw new ForbiddenError('Denied')
    })
    await expect(
      new ResolveReceivedClientDocumentUseCase(
        batches,
        access,
        cases,
        mock<ClientDocumentUploadsRepository>(),
      ).execute({
        clientId: 'client',
        actorId: 'admin',
        caseId: 'target-case',
        fileId: 'file',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(cases.findById).not.toHaveBeenCalled()
    expect(batches.findById).not.toHaveBeenCalled()
  })

  it('rejects an original whose source Case allows only operational reads', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const access = mock<CaseAccessProvider>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const file = DocumentBatchFileFaker.fake({ caseId: 'source-case' })
    const batch = DocumentBatchFaker.fake({ clientId: legalCase.clientId, files: [file] })
    batches.findById.mockResolvedValue([batch])
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockImplementation(async ({ caseId, intent }) => {
      if (caseId === file.caseId && intent === CaseAccessIntent.ReadDocument)
        throw new ForbiddenError('Source documentary access denied')
    })
    await expect(
      new ResolveReceivedClientDocumentUseCase(
        batches,
        access,
        cases,
        mock<ClientDocumentUploadsRepository>(),
      ).execute({
        clientId: legalCase.clientId,
        actorId: 'actor',
        caseId: legalCase.id,
        fileId: file.id,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(access.authorize).toHaveBeenNthCalledWith(1, {
      caseId: legalCase.id,
      actorId: 'actor',
      intent: CaseAccessIntent.ReadDocument,
    })
    expect(access.authorize).toHaveBeenNthCalledWith(2, {
      caseId: file.caseId,
      actorId: 'actor',
      intent: CaseAccessIntent.ReadDocument,
    })
  })

  it('resolves an eligible member original from a closed Case without requiring write access', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const access = mock<CaseAccessProvider>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake({
      lifecycleStatus: LegalCaseLifecycleStatus.Closed,
    })
    const file = DocumentBatchFileFaker.fake({ caseId: legalCase.id })
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ clientId: legalCase.clientId, files: [file] }),
    ])
    cases.findById.mockResolvedValue(legalCase)
    await expect(
      new ResolveReceivedClientDocumentUseCase(
        batches,
        access,
        cases,
        mock<ClientDocumentUploadsRepository>(),
      ).execute({
        clientId: legalCase.clientId,
        actorId: 'actor',
        caseId: legalCase.id,
        fileId: file.id,
      }),
    ).resolves.toMatchObject({ source: { kind: 'received_file', fileId: file.id } })
    expect(access.authorize).toHaveBeenCalledExactlyOnceWith({
      caseId: legalCase.id,
      actorId: 'actor',
      intent: CaseAccessIntent.ReadDocument,
    })
  })
  it.each([
    undefined,
    true,
    false,
  ])('limits duplicate originals to retained reads when forSelection=%s', async (forSelection) => {
    const batches = mock<DocumentBatchesRepository>()
    const access = mock<CaseAccessProvider>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const file = DocumentBatchFileFaker.fake({
      caseId: 'source-case',
      status: 'duplicate',
    })
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ clientId: legalCase.clientId, files: [file] }),
    ])
    cases.findById.mockResolvedValue(legalCase)
    const result = new ResolveReceivedClientDocumentUseCase(
      batches,
      access,
      cases,
      mock<ClientDocumentUploadsRepository>(),
    ).execute({
      clientId: legalCase.clientId,
      actorId: 'actor',
      caseId: legalCase.id,
      fileId: file.id,
      forSelection,
    })
    if (forSelection !== false)
      await expect(result).rejects.toThrow('Documento indisponível.')
    else {
      await expect(result).resolves.toMatchObject({
        source: { kind: 'received_file', fileId: file.id },
      })
      expect(access.authorize).toHaveBeenCalledWith({
        caseId: 'source-case',
        actorId: 'actor',
        intent: CaseAccessIntent.ReadDocument,
      })
    }
  })
  it('still denies a duplicate original after originating Case access is removed', async () => {
    const batches = mock<DocumentBatchesRepository>()
    const access = mock<CaseAccessProvider>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const file = DocumentBatchFileFaker.fake({
      caseId: 'source-case',
      status: 'duplicate',
    })
    batches.findById.mockResolvedValue([
      DocumentBatchFaker.fake({ clientId: legalCase.clientId, files: [file] }),
    ])
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockImplementation(async ({ caseId }) => {
      if (caseId === file.caseId) throw new ForbiddenError('Source denied')
    })
    await expect(
      new ResolveReceivedClientDocumentUseCase(
        batches,
        access,
        cases,
        mock<ClientDocumentUploadsRepository>(),
      ).execute({
        clientId: legalCase.clientId,
        actorId: 'actor',
        caseId: legalCase.id,
        fileId: file.id,
        forSelection: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })
  it.each([
    false,
    true,
    undefined,
  ])('keeps an unpublished upload private when forSelection=%s', async (forSelection) => {
    const batches = mock<DocumentBatchesRepository>()
    const uploads = mock<ClientDocumentUploadsRepository>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const upload = ClientDocumentUploadFaker.fake({
      caseId: legalCase.id,
      clientId: legalCase.clientId,
      clientDocumentId: 'private-document',
    })
    const file = DocumentBatchFileFaker.fake({
      storagePath: upload.storagePath,
      caseId: legalCase.id,
      checklistItemId: upload.checklistItemId,
    })
    cases.findById.mockResolvedValue(legalCase)
    batches.findById.mockResolvedValue([])
    batches.findFileById.mockResolvedValue(file)
    uploads.findByStoragePath.mockResolvedValue(upload)
    const result = new ResolveReceivedClientDocumentUseCase(
      batches,
      mock<CaseAccessProvider>(),
      cases,
      uploads,
    ).execute({
      clientId: legalCase.clientId,
      actorId: 'actor',
      caseId: legalCase.id,
      fileId: file.id,
      forSelection,
    })
    if (forSelection === false)
      await expect(result).resolves.toMatchObject({ source: { fileId: file.id } })
    else {
      await expect(result).rejects.toThrow('Documento indisponível.')
      expect(batches.findFileById).not.toHaveBeenCalled()
    }
  })
  it.each([
    'case',
    'client',
    'unconfirmed',
    'published',
    'item',
  ])('rejects a private source with mismatched %s context', async (reason) => {
    const batches = mock<DocumentBatchesRepository>()
    const uploads = mock<ClientDocumentUploadsRepository>()
    const cases = mock<LegalCasesRepository>()
    const legalCase = LegalCaseFaker.fake()
    const upload = ClientDocumentUploadFaker.fake({
      caseId: legalCase.id,
      clientId: legalCase.clientId,
      clientDocumentId: 'private-document',
      ...(reason === 'case' ? { caseId: 'foreign' } : {}),
      ...(reason === 'client' ? { clientId: 'foreign' } : {}),
      ...(reason === 'unconfirmed' ? { clientDocumentId: undefined } : {}),
      ...(reason === 'published'
        ? { publishedAt: new Date('2026-10-13T12:00:00Z') }
        : {}),
    })
    const file = DocumentBatchFileFaker.fake({
      storagePath: upload.storagePath,
      caseId: legalCase.id,
      checklistItemId: reason === 'item' ? 'foreign' : upload.checklistItemId,
    })
    cases.findById.mockResolvedValue(legalCase)
    batches.findById.mockResolvedValue([])
    batches.findFileById.mockResolvedValue(file)
    uploads.findByStoragePath.mockResolvedValue(upload)
    await expect(
      new ResolveReceivedClientDocumentUseCase(
        batches,
        mock<CaseAccessProvider>(),
        cases,
        uploads,
      ).execute({
        clientId: legalCase.clientId,
        actorId: 'actor',
        caseId: legalCase.id,
        fileId: file.id,
        forSelection: false,
      }),
    ).rejects.toThrow('Documento indisponível.')
  })
})
