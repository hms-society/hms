import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { CaseAccessProvider, LegalCasesRepository } from '../../interfaces'
import type { ClientDocumentsProvider } from '#document-engine/interfaces'
import { ForbiddenError, NotFoundError } from '#shared/domain/errors'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { ClientDocumentFaker } from '#document-engine/domain/entities/fakers'
import { CaseAccessIntent } from '../../domain/structures'
import { ListCaseHistoryDocumentsUseCase } from '../list-case-history-documents-use-case'

describe('List Case History Documents Use Case', () => {
  it('authorizes manual selection and lists only current case client', async () => {
    const cases = mock<LegalCasesRepository>()
    const access = mock<CaseAccessProvider>()
    const documents = mock<ClientDocumentsProvider>()
    const legalCase = LegalCaseFaker.fake()
    cases.findById.mockResolvedValue(legalCase)
    const available = ClientDocumentFaker.fakeMany(3)
    documents.listAvailable.mockResolvedValue(available)
    expect(
      await new ListCaseHistoryDocumentsUseCase(cases, access, documents).execute({
        caseId: legalCase.id,
        actorId: 'actor',
      }),
    ).toBe(available)
    expect(access.authorize).toHaveBeenCalledWith({
      caseId: legalCase.id,
      actorId: 'actor',
      intent: CaseAccessIntent.WriteContent,
    })
    expect(documents.listAvailable).toHaveBeenCalledWith({
      caseId: legalCase.id,
      actorId: 'actor',
      clientId: legalCase.clientId,
    })
  })
  it('rejects missing case', async () => {
    const cases = mock<LegalCasesRepository>()
    const access = mock<CaseAccessProvider>()
    const documents = mock<ClientDocumentsProvider>()
    await expect(
      new ListCaseHistoryDocumentsUseCase(cases, access, documents).execute({
        caseId: 'case',
        actorId: 'actor',
      }),
    ).rejects.toThrow(NotFoundError)
    expect(documents.listAvailable).not.toHaveBeenCalled()
  })
  it('never lists sources for denied writers', async () => {
    const cases = mock<LegalCasesRepository>()
    const access = mock<CaseAccessProvider>()
    const documents = mock<ClientDocumentsProvider>()
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(
      new ListCaseHistoryDocumentsUseCase(cases, access, documents).execute({
        caseId: 'case',
        actorId: 'actor',
      }),
    ).rejects.toThrow(ForbiddenError)
    expect(documents.listAvailable).not.toHaveBeenCalled()
  })
})
