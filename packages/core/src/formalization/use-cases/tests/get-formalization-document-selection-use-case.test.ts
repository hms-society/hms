import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { Formalization } from '../../domain/entities'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { FormalizationSourceReader, FormalizationsRepository } from '../../interfaces'
import { GetFormalizationDocumentSelectionUseCase } from '../get-formalization-document-selection-use-case'

describe('Get Formalization Document Selection Use Case', () => {
  let formalization: Formalization
  let repository: MockProxy<FormalizationsRepository>
  let sourceReader: MockProxy<FormalizationSourceReader>
  let specificationsRepository: MockProxy<DocumentSpecificationsRepository>
  let packagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>

  beforeEach(() => {
    formalization = fakeFormalization({ contractFormState: 'closed', contractFormRevision: 1 })
    repository = mock<FormalizationsRepository>()
    sourceReader = mock<FormalizationSourceReader>()
    specificationsRepository = mock<DocumentSpecificationsRepository>()
    packagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
  })

  it('returns an empty definition-driven selection when no package exists', async () => {
    repository.findById.mockResolvedValue(formalization)
    sourceReader.findContext.mockResolvedValue({ intake: {} } as never)
    specificationsRepository.list.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 })
    packagesRepository.findByContext.mockResolvedValue(undefined)
    versionsRepository.findByDocumentIds.mockResolvedValue([])

    await expect(
      new GetFormalizationDocumentSelectionUseCase(repository, sourceReader, specificationsRepository, packagesRepository, packageDocumentsRepository, versionsRepository).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toEqual({ options: [], selectedDocumentSpecificationIds: [] })
  })
})
