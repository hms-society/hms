import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '../../../case-management/interfaces'
import { DocumentVersionFaker } from '../../domain/entities/fakers'
import {
  DocumentVersionHomologationConflictError,
  DocumentVersionHomologationNotReadyError,
} from '../../domain/errors'
import type {
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
} from '../../interfaces'
import { HomologateDocumentVersionUseCase } from '../homologate-document-version-use-case'

describe('Homologate Document Version Use Case', () => {
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let homologationsRepository: MockProxy<DocumentVersionHomologationsRepository>
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let caseMembersRepository: MockProxy<CaseMembersRepository>
  let useCase: HomologateDocumentVersionUseCase

  beforeEach(() => {
    versionsRepository = mock<DocumentVersionsRepository>()
    homologationsRepository = mock<DocumentVersionHomologationsRepository>()
    legalCasesRepository = mock<LegalCasesRepository>()
    caseMembersRepository = mock<CaseMembersRepository>()
    useCase = new HomologateDocumentVersionUseCase(
      versionsRepository,
      homologationsRepository,
      legalCasesRepository,
      caseMembersRepository,
    )
    ;(legalCasesRepository.findById as any).mockResolvedValue({ id: 'case-id' } as never)
  })

  it('creates one homologation for an approved version without pending markers', async () => {
    const version = DocumentVersionFaker.fake({
      documentId: 'document-id',
      status: 'approved',
      pendingMarkers: [],
    })
    ;(versionsRepository.findById as any).mockResolvedValue(version)
    ;(caseMembersRepository.findActiveCollaboratorIdsByCaseId as any).mockResolvedValue([
      'collaborator-id',
    ])
    ;(homologationsRepository.add as any).mockImplementation(
      async (homologation: any) => ({
        id: 'homologation-id',
        ...homologation,
      }),
    )

    await expect(
      useCase.execute({
        caseId: 'case-id',
        documentId: 'document-id',
        documentVersionId: version.id,
        approvedByCollaboratorId: 'collaborator-id',
        approvedByCollaboratorName: 'Dra. Teste',
        approvedByCollaboratorProfile: 'lawyer',
        approvedAt: new Date(),
      }),
    ).resolves.toMatchObject({
      id: 'homologation-id',
      documentVersionId: version.id,
      approvedByCollaboratorName: 'Dra. Teste',
    })
  })

  it('rejects a version that is not ready for homologation', async () => {
    const version = DocumentVersionFaker.fake({
      documentId: 'document-id',
      status: 'in_review',
    })
    ;(versionsRepository.findById as any).mockResolvedValue(version)

    await expect(
      useCase.execute({
        caseId: 'case-id',
        documentId: 'document-id',
        documentVersionId: version.id,
        approvedByCollaboratorId: 'collaborator-id',
        approvedByCollaboratorName: 'Dra. Teste',
        approvedByCollaboratorProfile: 'lawyer',
        approvedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(DocumentVersionHomologationNotReadyError)
  })

  it('rejects a version that was already homologated', async () => {
    const version = DocumentVersionFaker.fake({
      documentId: 'document-id',
      status: 'approved',
      pendingMarkers: [],
    })
    ;(versionsRepository.findById as any).mockResolvedValue(version)
    ;(homologationsRepository.findByDocumentVersionId as any).mockResolvedValue({
      id: 'existing',
    } as never)

    await expect(
      useCase.execute({
        caseId: 'case-id',
        documentId: 'document-id',
        documentVersionId: version.id,
        approvedByCollaboratorId: 'collaborator-id',
        approvedByCollaboratorName: 'Dra. Teste',
        approvedByCollaboratorProfile: 'lawyer',
        approvedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(DocumentVersionHomologationConflictError)
  })
})
