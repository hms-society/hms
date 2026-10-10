import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentVersionFaker } from '../../domain/entities/fakers'
import type { DocumentTemplateContent } from '../../domain/structures'
import type { DocumentVersionsRepository } from '../../interfaces'
import { SaveEditableDocumentVersionUseCase } from '../save-editable-document-version-use-case'

describe('Save Editable Document Version Use Case', () => {
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let useCase: SaveEditableDocumentVersionUseCase

  beforeEach(() => {
    versionsRepository = mock<DocumentVersionsRepository>()
    useCase = new SaveEditableDocumentVersionUseCase(versionsRepository)
  })

  it('recalculates pending markers from edited content', async () => {
    const currentVersion = DocumentVersionFaker.fake({
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

    await expect(
      useCase.execute({
        documentVersionId: currentVersion.id,
        collaboratorId: currentVersion.createdByCollaboratorId,
        content,
      }),
    ).resolves.toBe(savedVersion)

    expect(versionsRepository.saveEditableContent).toHaveBeenCalledWith(
      currentVersion.id,
      currentVersion.createdByCollaboratorId,
      content,
      [{ marker: '{remaining_placeholder}' }],
    )
  })
})
