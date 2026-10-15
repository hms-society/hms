import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentGenerationFaker } from '../../../document-production/domain/entities/fakers'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { DocumentGenerationRequestedEvent } from '../../../document-production/domain/events'
import { DocumentGenerationStatus } from '../../../document-production/domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseChecklistGateDecision, LegalCaseStatus } from '../../domain/structures'
import type { CaseAccessProvider, LegalCasesRepository } from '../../interfaces'
import { RetryLegalCaseDocumentGenerationUseCase } from '../retry-legal-case-document-generation-use-case'

describe('Retry Legal Case Document Generation Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let packages: MockProxy<DocumentPackagesRepository>
  let packageDocuments: MockProxy<PackageDocumentsRepository>
  let generations: MockProxy<DocumentGenerationsRepository>
  let broker: MockProxy<Broker>
  let datetime: MockProxy<DatetimeProvider>
  let ids: MockProxy<IdProvider>
  let access: MockProxy<CaseAccessProvider>
  let useCase: RetryLegalCaseDocumentGenerationUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    generations = mock<DocumentGenerationsRepository>()
    broker = mock<Broker>()
    datetime = mock<DatetimeProvider>()
    ids = mock<IdProvider>()
    access = mock<CaseAccessProvider>()
    access.authorize.mockResolvedValue()
    useCase = new RetryLegalCaseDocumentGenerationUseCase(
      cases,
      packages,
      packageDocuments,
      generations,
      broker,
      datetime,
      ids,
      access,
    )
  })

  it('retries a stuck generation on the same document without adding another package link', async () => {
    const caseId = 'case-1'
    const documentId = 'document-1'
    const previousGenerationId = 'generation-old'
    const newGenerationId = 'generation-new'
    const now = new Date('2026-09-25T17:00:00.000Z')
    const source = {
      type: 'case' as const,
      id: caseId,
      data: {
        referenceDocuments: [{ id: 'file-1' }],
        templateVariableValues: { nome_requerente: 'Helena' },
        generationInstructions: 'Usar apenas os fatos validados.',
      },
    }
    const generation = DocumentGenerationFaker.fake({
      id: previousGenerationId,
      documentId,
      documentSpecificationVersionId: 'specification-1',
      requestedByCollaboratorId: 'actor-1',
      source,
      status: DocumentGenerationStatus.Running,
    })
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        id: caseId,
        status: LegalCaseStatus.LegalProduction,
        checklistGate: { decision: CaseChecklistGateDecision.Approved },
        dossierGate: { homologatedAt: now },
      }),
    )
    packages.findByContext.mockResolvedValue({
      id: 'package-1',
      context: { type: 'case', caseId },
      documents: [],
      createdAt: now,
      updatedAt: now,
    })
    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      {
        id: 'package-document-1',
        documentPackageId: 'package-1',
        documentId,
        documentSpecificationId: 'specification-1',
        createdAt: now,
        updatedAt: now,
      },
    ])
    generations.findLatestByDocumentId.mockResolvedValue(generation)
    generations.findById.mockResolvedValue(generation)
    generations.replace.mockResolvedValue(
      DocumentGenerationFaker.fake({
        ...generation,
        status: DocumentGenerationStatus.Cancelled,
        cancelledAt: now,
      }),
    )
    datetime.now.mockReturnValue(now)
    ids.generate.mockReturnValue(newGenerationId)

    await expect(
      useCase.execute({
        caseId,
        documentId,
        requestedByCollaboratorId: 'actor-1',
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).resolves.toEqual({ documentGenerationId: newGenerationId, documentId })

    expect(generations.replace).toHaveBeenCalledWith(
      previousGenerationId,
      expect.objectContaining({ status: DocumentGenerationStatus.Cancelled }),
      [DocumentGenerationStatus.Pending, DocumentGenerationStatus.Running],
    )
    expect(packageDocuments.add).not.toHaveBeenCalled()
    expect(broker.publish).toHaveBeenLastCalledWith(
      expect.any(DocumentGenerationRequestedEvent),
    )
    expect(
      (broker.publish.mock.calls.at(-1)?.[0] as DocumentGenerationRequestedEvent).payload,
    ).toEqual(
      expect.objectContaining({
        documentGenerationId: newGenerationId,
        documentId,
        documentSpecificationVersionId: 'specification-1',
        instructions: 'Usar apenas os fatos validados.',
        source,
        occurredAt: now,
      }),
    )
  })

  it('denies Admin retry before package or generation side effects', async () => {
    const legalCase = LegalCaseFaker.fake({ id: 'case-1' })
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockRejectedValue(
      new ForbiddenError('Acesso jurídico ao Caso não autorizado.'),
    )

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: 'document-1',
        requestedByCollaboratorId: 'admin-id',
        requestedByCollaboratorProfile: 'admin',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)

    expect(access.authorize).toHaveBeenCalledWith({
      caseId: legalCase.id,
      actorId: 'admin-id',
      intent: 'write_content',
    })
    expect(cases.listByTeamMember).not.toHaveBeenCalled()
    expect(packages.findByContext).not.toHaveBeenCalled()
    expect(packageDocuments.findByDocumentPackageId).not.toHaveBeenCalled()
    expect(generations.findLatestByDocumentId).not.toHaveBeenCalled()
    expect(generations.replace).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('rejects missing prerequisites and completed generations, then retries failures without instructions', async () => {
    const caseId = 'case-2'
    const documentId = 'document-2'
    const request = {
      caseId,
      documentId,
      requestedByCollaboratorId: 'actor-2',
      requestedByCollaboratorProfile: 'lawyer' as const,
    }
    cases.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    const now = new Date('2026-09-25T17:00:00.000Z')
    const legalCase = LegalCaseFaker.fake({
      id: caseId,
      status: LegalCaseStatus.LegalProduction,
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      dossierGate: { homologatedAt: now },
    })
    cases.findById.mockResolvedValue(legalCase)
    packages.findByContext.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    packages.findByContext.mockResolvedValue({ id: 'package-2' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow()

    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      {
        id: 'package-document-2',
        documentPackageId: 'package-2',
        documentId,
        documentSpecificationId: 'specification-2',
        createdAt: now,
        updatedAt: now,
      },
    ])
    generations.findLatestByDocumentId.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    const source = { type: 'case' as const, id: caseId, data: {} }
    generations.findLatestByDocumentId.mockResolvedValue(
      DocumentGenerationFaker.fake({
        documentId,
        documentSpecificationVersionId: 'specification-2',
        source,
        status: DocumentGenerationStatus.Completed,
      }),
    )
    await expect(useCase.execute(request)).rejects.toThrow('geração concluída')

    generations.findLatestByDocumentId.mockResolvedValue(
      DocumentGenerationFaker.fake({
        id: 'generation-failed',
        documentId,
        documentSpecificationVersionId: 'specification-2',
        source,
        status: DocumentGenerationStatus.Failed,
      }),
    )
    ids.generate.mockReturnValue('generation-retried')
    datetime.now.mockReturnValue(now)

    await expect(useCase.execute(request)).resolves.toEqual({
      documentGenerationId: 'generation-retried',
      documentId,
    })
    const event = broker.publish.mock.calls.at(
      -1,
    )?.[0] as DocumentGenerationRequestedEvent
    expect(event.payload).not.toHaveProperty('instructions')
    expect(event.payload.source).toEqual(source)
  })
})
