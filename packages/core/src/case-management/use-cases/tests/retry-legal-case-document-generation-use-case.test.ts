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
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseChecklistGateDecision, LegalCaseStatus } from '../../domain/structures'
import type { LegalCasesRepository } from '../../interfaces'
import { RetryLegalCaseDocumentGenerationUseCase } from '../retry-legal-case-document-generation-use-case'

describe('Retry Legal Case Document Generation Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let packages: MockProxy<DocumentPackagesRepository>
  let packageDocuments: MockProxy<PackageDocumentsRepository>
  let generations: MockProxy<DocumentGenerationsRepository>
  let broker: MockProxy<Broker>
  let datetime: MockProxy<DatetimeProvider>
  let ids: MockProxy<IdProvider>
  let useCase: RetryLegalCaseDocumentGenerationUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    generations = mock<DocumentGenerationsRepository>()
    broker = mock<Broker>()
    datetime = mock<DatetimeProvider>()
    ids = mock<IdProvider>()
    useCase = new RetryLegalCaseDocumentGenerationUseCase(
      cases,
      packages,
      packageDocuments,
      generations,
      broker,
      datetime,
      ids,
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
    cases.listByTeamMember.mockResolvedValue([{ id: caseId } as never])
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
})
