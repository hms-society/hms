import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { faker } from '@faker-js/faker'
import type {
  CaseAccessProvider,
  CaseHistoriesRepository,
  LegalCasesRepository,
} from '../../interfaces'
import type { ClientDocumentsProvider } from '#document-engine/interfaces'
import { ForbiddenError, NotFoundError } from '#shared/domain/errors'
import { CaseHistoryEntryFaker, LegalCaseFaker } from '../../domain/entities/fakers'
import { ClientDocumentFaker } from '#document-engine/domain/entities/fakers'
import { CaseAccessIntent } from '../../domain/structures'
import { ReadCaseHistoryDocumentUseCase } from '../read-case-history-document-use-case'

describe('Read Case History Document Use Case', () => {
  const cases = mock<LegalCasesRepository>()
  const access = mock<CaseAccessProvider>()
  const histories = mock<CaseHistoriesRepository>()
  const documents = mock<ClientDocumentsProvider>()
  const legalCase = LegalCaseFaker.fake()
  const document = ClientDocumentFaker.fake({ clientId: legalCase.clientId })
  const entry = CaseHistoryEntryFaker.fake({
    caseId: legalCase.id,
    documents: [
      { clientDocumentId: document.id, source: document.source, name: document.name },
    ],
  })
  const request = {
    caseId: legalCase.id,
    actorId: 'actor',
    entryId: entry.id,
    documentId: document.id,
  }
  let useCase: ReadCaseHistoryDocumentUseCase
  beforeEach(() => {
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockReset()
    histories.findById.mockResolvedValue(entry)
    documents.read.mockReset()
    documents.read.mockResolvedValue({ document, bytes: new Uint8Array([1, 2]) })
    useCase = new ReadCaseHistoryDocumentUseCase(cases, access, histories, documents)
  })
  it('returns authenticated bytes only for the exact fixed source', async () => {
    const result = await useCase.execute(request)
    expect(result.bytes).toEqual(new Uint8Array([1, 2]))
    expect(access.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ intent: CaseAccessIntent.ReadDocument }),
    )
    expect(documents.read).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: legalCase.clientId, documentId: document.id }),
    )
  })
  it('never reads missing or foreign history references', async () => {
    histories.findById.mockResolvedValue({ ...entry, caseId: 'other' })
    await expect(useCase.execute(request)).rejects.toThrow(NotFoundError)
    expect(documents.read).not.toHaveBeenCalled()
  })
  it('refuses substituted exact source identifiers', async () => {
    documents.read.mockResolvedValue({
      document: {
        ...document,
        source: { kind: 'received_file', fileId: faker.string.uuid() },
      },
      bytes: new Uint8Array([3]),
    })
    await expect(useCase.execute(request)).rejects.toThrow(NotFoundError)
  })
  it('refuses current revoked source access', async () => {
    documents.read.mockRejectedValue(new ForbiddenError('Revoked'))
    await expect(useCase.execute(request)).rejects.toThrow(ForbiddenError)
  })
  it('refuses case access before resolving sources', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(useCase.execute(request)).rejects.toThrow(ForbiddenError)
    expect(documents.read).not.toHaveBeenCalled()
  })
  it.each([
    {
      kind: 'consultation_version',
      consultationId: 'c',
      documentId: 'd',
      versionId: 'v',
    },
    {
      kind: 'formalization_signed',
      formalizationId: 'f',
      requestDocumentId: 'd',
      artifactId: 'a',
    },
  ] as const)('compares every fixed ID in $kind', async (source) => {
    const selected = { ...document, source }
    const linked = {
      ...entry,
      documents: [{ clientDocumentId: document.id, name: document.name, source }],
    }
    histories.findById.mockResolvedValue(linked)
    documents.read.mockResolvedValue({ document: selected, bytes: new Uint8Array([1]) })
    await expect(useCase.execute(request)).resolves.toEqual({
      document: selected,
      bytes: new Uint8Array([1]),
    })
    for (const key of Object.keys(source).filter((key) => key !== 'kind')) {
      documents.read.mockResolvedValue({
        document: { ...selected, source: { ...source, [key]: 'changed' } },
        bytes: new Uint8Array([1]),
      })
      await expect(useCase.execute(request)).rejects.toThrow(NotFoundError)
    }
  })
})
