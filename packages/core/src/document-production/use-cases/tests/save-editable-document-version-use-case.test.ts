import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { CaseMembersRepository } from '../../../case-management/interfaces'
import { DocumentVersionFaker } from '../../domain/entities/fakers'
import type { DocumentTemplateContent } from '../../domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../interfaces'
import { SaveEditableDocumentVersionUseCase } from '../save-editable-document-version-use-case'

describe('Save Editable Document Version Use Case', () => {
  const caseId = 'case-id'
  const documentId = 'document-id'
  const collaboratorId = 'collaborator-id'
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let packagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let caseMembersRepository: MockProxy<CaseMembersRepository>
  let useCase: SaveEditableDocumentVersionUseCase

  beforeEach(() => {
    versionsRepository = mock<DocumentVersionsRepository>()
    packagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    caseMembersRepository = mock<CaseMembersRepository>()
    useCase = new SaveEditableDocumentVersionUseCase(
      versionsRepository,
      packagesRepository,
      packageDocumentsRepository,
      caseMembersRepository,
    )
  })

  it('recalculates pending markers from edited content', async () => {
    const currentVersion = DocumentVersionFaker.fake({
      documentId,
      createdByCollaboratorId: collaboratorId,
      pendingMarkers: [{ marker: '{resolved_placeholder}' }],
    })
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Updated: {remaining_placeholder}' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    const savedVersion = DocumentVersionFaker.fake({ content })
    versionsRepository.findById.mockResolvedValue(currentVersion)
    versionsRepository.saveEditableContent.mockResolvedValue(savedVersion)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    packagesRepository.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      { documentId },
    ] as never)

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: currentVersion.id,
        collaboratorId,
        content,
      }),
    ).resolves.toBe(savedVersion)

    expect(versionsRepository.saveEditableContent).toHaveBeenCalledWith(
      currentVersion.id,
      collaboratorId,
      content,
      [{ marker: '{remaining_placeholder}' }],
    )
  })

  it('rejects editing when the collaborator is no longer an active case member', async () => {
    const currentVersion = DocumentVersionFaker.fake({
      documentId,
      createdByCollaboratorId: collaboratorId,
    })
    versionsRepository.findById.mockResolvedValue(currentVersion)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: currentVersion.id,
        collaboratorId,
        content: {} as DocumentTemplateContent,
      }),
    ).rejects.toThrow()

    expect(versionsRepository.saveEditableContent).not.toHaveBeenCalled()
  })

  it('rejects editing when the route document does not own the version', async () => {
    const currentVersion = DocumentVersionFaker.fake({
      documentId: 'another-document-id',
      createdByCollaboratorId: collaboratorId,
    })
    versionsRepository.findById.mockResolvedValue(currentVersion)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    packagesRepository.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      { documentId },
    ] as never)

    await expect(
      useCase.execute({
        caseId,
        documentId,
        documentVersionId: currentVersion.id,
        collaboratorId,
        content: {} as DocumentTemplateContent,
      }),
    ).rejects.toThrow()

    expect(versionsRepository.saveEditableContent).not.toHaveBeenCalled()
  })
})
