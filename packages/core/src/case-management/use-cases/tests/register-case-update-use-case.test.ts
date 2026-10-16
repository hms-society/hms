import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { faker } from '@faker-js/faker'
import type {
  CaseAccessProvider,
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
  CaseCollaboratorsProvider,
  LegalCasesRepository,
} from '../../interfaces'
import type { ClientDocumentsProvider } from '#document-engine/interfaces'
import type { DatetimeProvider } from '#shared/interfaces'
import {
  BadRequestError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { ClientDocumentFaker } from '#document-engine/domain/entities/fakers'
import { CaseAccessIntent } from '../../domain/structures'
import { RegisterCaseUpdateUseCase } from '../register-case-update-use-case'

describe('Register Case Update Use Case', () => {
  const cases = mock<LegalCasesRepository>()
  const access = mock<CaseAccessProvider>()
  const histories = mock<CaseHistoriesRepository>()
  const transaction = mock<CaseHistoryTransactionProvider>()
  const documents = mock<ClientDocumentsProvider>()
  const collaborators = mock<CaseCollaboratorsProvider>()
  const datetime = mock<DatetimeProvider>()
  const now = new Date('2026-10-13T12:00:00.000Z')
  const legalCase = LegalCaseFaker.fake()
  const actorId = faker.string.uuid()
  let useCase: RegisterCaseUpdateUseCase
  let request: Parameters<RegisterCaseUpdateUseCase['execute']>[0]
  beforeEach(() => {
    access.authorize.mockReset()
    histories.add.mockReset()
    histories.findManualOperation.mockResolvedValue(undefined)
    documents.resolve.mockReset()
    cases.findById.mockResolvedValue(legalCase)
    transaction.runInTransaction.mockImplementation((callback) => callback())
    datetime.now.mockReturnValue(now)
    collaborators.findById.mockResolvedValue(undefined)
    histories.add.mockImplementation(async (value) => ({
      ...value,
      id: `record:${faker.string.uuid()}`,
    }))
    useCase = new RegisterCaseUpdateUseCase(
      cases,
      access,
      histories,
      transaction,
      documents,
      collaborators,
      datetime,
    )
    request = {
      caseId: legalCase.id,
      actorId,
      operationId: faker.string.uuid(),
      occurredAt: '2026-10-10T09:00:00-03:00',
      description: '  Reunião concluída  ',
      documentIds: [],
    }
  })
  it('records normalized manual text and authoritative separate timestamps', async () => {
    const result = await useCase.execute(request)
    expect(result.description).toBe('Reunião concluída')
    expect(result.occurredAt).toEqual(new Date('2026-10-10T12:00:00.000Z'))
    expect(result.recordedAt).toBe(now)
    expect(result.actorId).toBe(actorId)
    expect(result).not.toHaveProperty('fingerprint')
    expect(result).not.toHaveProperty('sourceKey')
    expect(result).not.toHaveProperty('operationId')
    expect(transaction.runInTransaction).toHaveBeenCalled()
    expect(access.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ intent: CaseAccessIntent.WriteContent }),
    )
  })
  it.each([
    'received_file',
    'consultation_version',
    'formalization_signed',
  ] as const)('fixes the exact %s reference and deduplicates selection', async (kind) => {
    const document = ClientDocumentFaker.fake({
      clientId: legalCase.clientId,
      source:
        kind === 'received_file'
          ? { kind, fileId: faker.string.uuid() }
          : kind === 'consultation_version'
            ? {
                kind,
                consultationId: faker.string.uuid(),
                documentId: faker.string.uuid(),
                versionId: faker.string.uuid(),
              }
            : {
                kind,
                formalizationId: faker.string.uuid(),
                requestDocumentId: faker.string.uuid(),
                artifactId: faker.string.uuid(),
              },
    })
    documents.resolve.mockResolvedValue(document)
    const result = await useCase.execute({
      ...request,
      documentIds: [document.id, document.id],
    })
    expect(result.documents).toEqual([
      { clientDocumentId: document.id, name: document.name, source: document.source },
    ])
    expect(documents.resolve).toHaveBeenCalledTimes(1)
  })
  it('replays committed metadata before checking a later revoked source', async () => {
    const document = ClientDocumentFaker.fake({ clientId: legalCase.clientId })
    request = { ...request, documentIds: [document.id] }
    documents.resolve.mockResolvedValue(document)
    const result = await useCase.execute(request)
    histories.findManualOperation.mockResolvedValue({
      ...histories.add.mock.calls[0]?.[0],
      ...result,
    } as Awaited<ReturnType<CaseHistoriesRepository['add']>>)
    histories.add.mockClear()
    documents.resolve.mockClear()
    documents.resolve.mockRejectedValue(new ForbiddenError('Revoked'))
    expect(
      await useCase.execute({ ...request, description: 'Reunião concluída' }),
    ).toEqual(result)
    expect(histories.add).not.toHaveBeenCalled()
    expect(documents.resolve).not.toHaveBeenCalled()
    await expect(
      useCase.execute({ ...request, description: 'Different' }),
    ).rejects.toThrow(ConflictError)
  })
  it.each([
    '',
    ' ',
    'x'.repeat(5001),
  ])('rejects invalid descriptions', async (description) => {
    await expect(useCase.execute({ ...request, description })).rejects.toThrow(
      BadRequestError,
    )
    expect(histories.add).not.toHaveBeenCalled()
  })
  it.each([
    'invalid',
    '2026-10-14T00:00:00Z',
    '2026-02-30T12:00:00Z',
    '2026-10-10T12:00:00',
  ])('rejects invalid/future occurrence %s', async (occurredAt) => {
    await expect(useCase.execute({ ...request, occurredAt })).rejects.toThrow(
      BadRequestError,
    )
  })
  it('rejects foreign client sources without recording', async () => {
    const document = ClientDocumentFaker.fake()
    documents.resolve.mockResolvedValue(document)
    await expect(
      useCase.execute({ ...request, documentIds: [document.id] }),
    ).rejects.toThrow(NotFoundError)
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('does not replay after current write permission was revoked', async () => {
    access.authorize.mockRejectedValue(new ForbiddenError('Denied'))
    await expect(useCase.execute(request)).rejects.toThrow(ForbiddenError)
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('propagates append failure through the transaction boundary', async () => {
    histories.add.mockRejectedValue(new ConflictError('Append failed'))
    await expect(useCase.execute(request)).rejects.toThrow(ConflictError)
    expect(transaction.runInTransaction).toHaveBeenCalled()
  })
})
