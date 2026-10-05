import {
  DocumentGenerationFaker,
  DocumentVersionFaker,
} from '../../../document-production/domain/entities/fakers'
import type { DocumentGenerationRequestedEvent } from '../../../document-production/domain/events'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { LegalCasesRepository } from '../../interfaces'
import { GenerateLegalCaseDocumentRevisionUseCase } from '../generate-legal-case-document-revision-use-case'

describe('GenerateLegalCaseDocumentRevisionUseCase', () => {
  let cases: MockProxy<LegalCasesRepository>
  let packages: MockProxy<DocumentPackagesRepository>
  let packageDocuments: MockProxy<PackageDocumentsRepository>
  let generations: MockProxy<DocumentGenerationsRepository>
  let versions: MockProxy<DocumentVersionsRepository>
  let broker: MockProxy<Broker>
  let datetime: MockProxy<DatetimeProvider>
  let ids: MockProxy<IdProvider>
  let useCase: GenerateLegalCaseDocumentRevisionUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    generations = mock<DocumentGenerationsRepository>()
    versions = mock<DocumentVersionsRepository>()
    broker = mock<Broker>()
    datetime = mock<DatetimeProvider>()
    ids = mock<IdProvider>()
    useCase = new GenerateLegalCaseDocumentRevisionUseCase(
      cases,
      packages,
      packageDocuments,
      generations,
      versions,
      broker,
      datetime,
      ids,
    )
  })

  it('requests AI to elaborate a new version from the selected version without creating another piece', async () => {
    const legalCase = LegalCaseFaker.fake({
      status: 'legal_production',
      checklistGate: {
        decision: 'approved',
        decidedAt: new Date(),
        decidedBy: 'reviewer',
        remarks: undefined,
      },
      dossierGate: { homologatedAt: new Date(), homologatedBy: 'reviewer' },
    })
    const sourceVersion = DocumentVersionFaker.fake({
      id: 'version-1',
      documentId: 'document-1',
      versionNumber: 1,
    })
    const generation = DocumentGenerationFaker.fake({
      status: 'completed',
      documentId: 'document-1',
      documentSpecificationVersionId: 'spec-1',
      source: {
        type: 'case',
        id: legalCase.id,
        data: { referenceDocuments: [{ id: 'ref-1', fileName: 'cnis.pdf' }] },
      },
    })
    const occurredAt = new Date('2026-09-25T16:00:00.000Z')
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])
    packages.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: 'document-1', documentSpecificationId: 'spec-1' } as never,
    ])
    generations.findLatestByDocumentId.mockResolvedValue(generation)
    versions.findById.mockResolvedValue(sourceVersion)
    versions.findLatestByDocumentId.mockResolvedValue(sourceVersion)
    ids.generate.mockReturnValue('generation-2')
    datetime.now.mockReturnValue(occurredAt)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: 'document-1',
        sourceDocumentVersionId: 'version-1',
        requestedByCollaboratorId: 'lawyer-id',
        requestedByCollaboratorProfile: CollaboratorProfile.Lawyer,
        instructions: 'Inclua pedido subsidiário.',
      }),
    ).resolves.toEqual({ documentGenerationId: 'generation-2', documentId: 'document-1' })
    const event = broker.publish.mock.calls[0]?.[0] as DocumentGenerationRequestedEvent
    expect(event.payload.documentId).toBe('document-1')
    expect(event.payload.source.data).toMatchObject({
      baseDocumentVersionId: 'version-1',
      baseDocumentContent: sourceVersion.content,
      generationInstructions: 'Inclua pedido subsidiário.',
      referenceDocuments: [{ id: 'ref-1', fileName: 'cnis.pdf' }],
    })
  })
})
