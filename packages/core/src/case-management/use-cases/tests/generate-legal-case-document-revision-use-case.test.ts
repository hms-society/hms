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
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseAccessProvider, LegalCasesRepository } from '../../interfaces'
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
  let access: MockProxy<CaseAccessProvider>
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
    access = mock<CaseAccessProvider>()
    access.authorize.mockResolvedValue()
    useCase = new GenerateLegalCaseDocumentRevisionUseCase(
      cases,
      packages,
      packageDocuments,
      generations,
      versions,
      broker,
      datetime,
      ids,
      access,
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

  it('denies Admin revision before package, version, generation, or event work', async () => {
    const legalCase = LegalCaseFaker.fake({ id: 'case-1' })
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockRejectedValue(
      new ForbiddenError('Acesso jurídico ao Caso não autorizado.'),
    )

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: 'document-1',
        sourceDocumentVersionId: 'version-1',
        requestedByCollaboratorId: 'admin-id',
        requestedByCollaboratorProfile: CollaboratorProfile.Admin,
        instructions: 'Atualizar fundamento.',
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
    expect(versions.findById).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('rejects invalid revision inputs and incomplete generation prerequisites', async () => {
    const request = {
      caseId: 'case-1',
      documentId: 'document-1',
      sourceDocumentVersionId: 'version-1',
      requestedByCollaboratorId: 'lawyer-id',
      requestedByCollaboratorProfile: CollaboratorProfile.Lawyer,
      instructions: 'Please revise this document.',
    }
    await expect(useCase.execute({ ...request, instructions: '   ' })).rejects.toThrow(
      'Informe instruções',
    )
    await expect(
      useCase.execute({ ...request, instructions: 'x'.repeat(4001) }),
    ).rejects.toThrow('Informe instruções')

    cases.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    const legalCase = LegalCaseFaker.fake({ id: request.caseId })
    cases.findById.mockResolvedValue(legalCase)
    await expect(useCase.execute(request)).rejects.toThrow('dossiê documental aprovado')
    expect(packages.findByContext).not.toHaveBeenCalled()

    const readyCase = LegalCaseFaker.fake({
      id: request.caseId,
      status: 'legal_production',
      checklistGate: { decision: 'approved' },
      dossierGate: { homologatedAt: new Date(), homologatedBy: 'reviewer' },
    })
    cases.findById.mockResolvedValue(readyCase)
    packages.findByContext.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    packages.findByContext.mockResolvedValue({ id: 'package-1' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow()

    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: request.documentId, documentSpecificationId: 'spec-1' } as never,
    ])
    generations.findLatestByDocumentId.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    const pendingGeneration = DocumentGenerationFaker.fake({
      id: 'generation-pending',
      status: 'pending',
      documentId: request.documentId,
      documentSpecificationVersionId: 'spec-1',
      source: { type: 'case', id: readyCase.id, data: {} },
    })
    const version = DocumentVersionFaker.fake({
      id: request.sourceDocumentVersionId,
      documentId: request.documentId,
    })
    generations.findLatestByDocumentId.mockResolvedValue(pendingGeneration)
    versions.findById.mockResolvedValue(version)
    versions.findLatestByDocumentId.mockResolvedValue(version)
    await expect(useCase.execute(request)).rejects.toThrow(
      'A peça já possui uma geração em andamento.',
    )
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
